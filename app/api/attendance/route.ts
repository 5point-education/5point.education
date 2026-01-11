import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || (user.user_metadata.role !== Role.TEACHER && user.user_metadata.role !== Role.RECEPTIONIST && user.user_metadata.role !== Role.ADMIN)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const batchId = url.searchParams.get("batchId");
    const date = url.searchParams.get("date"); // Expected format: YYYY-MM-DD

    if (!batchId || !date) {
      return new NextResponse("Missing required parameters: batchId and date", { status: 400 });
    }

    // Parse the date to create a date range for the entire day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get students in the batch
    const admissions = await db.admission.findMany({
      where: {
        batchId: batchId,
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    });

    // Get existing attendance records for the date and batch
    const attendanceRecords = await (db as any).attendance.findMany({
      where: {
        batchId: batchId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Create a map of attendance records for quick lookup
    const attendanceMap = new Map(
      attendanceRecords.map((record: any) => [record.studentId, record.status])
    );

    // Combine student data with attendance status
    const studentsWithAttendance = admissions.map(admission => ({
      admissionId: admission.id,
      studentId: admission.student.id,
      name: admission.student.user.name,
      email: admission.student.user.email,
      phone: admission.student.phone,
      parentName: admission.student.fatherName,
      joinDate: admission.admission_date,
      isPresent: attendanceMap.has(admission.student.id) ? attendanceMap.get(admission.student.id) : null // null means not marked yet
    }));

    return NextResponse.json(studentsWithAttendance);
  } catch (error) {
    console.log("[ATTENDANCE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || (user.user_metadata.role !== Role.TEACHER && user.user_metadata.role !== Role.RECEPTIONIST && user.user_metadata.role !== Role.ADMIN)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { batchId, date, attendanceData } = body;

    if (!batchId || !date || !Array.isArray(attendanceData)) {
      return new NextResponse("Missing required fields: batchId, date, attendanceData", { status: 400 });
    }

    // Check if user is teacher and if they are assigned to this batch
    if (user.user_metadata.role === Role.TEACHER) {
      const batch = await db.batch.findFirst({
        where: {
          id: batchId,
          teacherId: user.id
        }
      });

      if (!batch) {
        return new NextResponse("You are not authorized to take attendance for this batch", { status: 403 });
      }
    }

    // Parse the date
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0); // Set to start of day in UTC

    // Process attendance data
    for (const record of attendanceData) {
      const { studentId, isPresent } = record;

      if (!studentId || typeof isPresent !== 'boolean') {
        continue; // Skip invalid records
      }

      // Upsert attendance record
      await (db as any).attendance.upsert({
        where: {
          date_batchId_studentId: {
            date: attendanceDate,
            batchId: batchId,
            studentId: studentId
          }
        },
        update: {
          status: isPresent,
          updatedAt: new Date()
        },
        create: {
          date: attendanceDate,
          batchId: batchId,
          studentId: studentId,
          status: isPresent
        }
      });
    }

    return NextResponse.json({ success: true, message: "Attendance saved successfully" });
  } catch (error) {
    console.log("[ATTENDANCE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || (user.user_metadata.role !== Role.TEACHER && user.user_metadata.role !== Role.RECEPTIONIST && user.user_metadata.role !== Role.ADMIN)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { attendanceId, isPresent } = body;

    if (!attendanceId || typeof isPresent !== 'boolean') {
      return new NextResponse("Missing required fields: attendanceId, isPresent", { status: 400 });
    }

    // Check if user can edit this attendance record
    const attendanceRecord = await (db as any).attendance.findUnique({
      where: {
        id: attendanceId
      },
      include: {
        batch: true
      }
    });

    if (!attendanceRecord) {
      return new NextResponse("Attendance record not found", { status: 404 });
    }

    // If user is teacher, check if they are assigned to this batch
    if (user.user_metadata.role === Role.TEACHER && attendanceRecord.batch.teacherId !== user.id) {
      return new NextResponse("You are not authorized to edit attendance for this batch", { status: 403 });
    }

    // Update attendance record
    const updatedAttendance = await (db as any).attendance.update({
      where: {
        id: attendanceId
      },
      data: {
        status: isPresent,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, attendance: updatedAttendance });
  } catch (error) {
    console.log("[ATTENDANCE_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}