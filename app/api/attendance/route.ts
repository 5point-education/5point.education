import { AttendanceSessionType, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { sendTrackedAbsence } from "@/lib/notification-delivery";

const STAFF_ROLES = new Set([Role.TEACHER, Role.RECEPTIONIST, Role.ADMIN]);

function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function dayRange(date: Date) {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return { gte: date, lte: end };
}

async function getSession(
  batchId: string,
  attendanceDate: Date,
  userId: string,
  sessionId?: string | null,
  sessionType: AttendanceSessionType = AttendanceSessionType.REGULAR,
  sessionLabel = "Regular Class",
) {
  if (sessionId) {
    const session = await db.attendanceSession.findFirst({ where: { id: sessionId, batchId } });
    if (!session) throw new Error("Attendance session was not found for this batch");
    return session;
  }

  const existing = await db.attendanceSession.findFirst({
    where: { batchId, date: attendanceDate, type: sessionType },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return db.attendanceSession.create({
    data: {
      batchId,
      date: attendanceDate,
      type: sessionType,
      label: sessionLabel.trim() || (sessionType === AttendanceSessionType.EXTRA ? "Extra Class" : "Regular Class"),
      createdById: userId,
    },
  });
}

async function getStaffUser() {
  const supabase = createAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const role = user?.user_metadata.role as Role | undefined;
  if (error || !user || (role !== Role.TEACHER && role !== Role.RECEPTIONIST && role !== Role.ADMIN)) return null;
  return user;
}

export async function GET(req: Request) {
  try {
    const user = await getStaffUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const url = new URL(req.url);
    const batchId = url.searchParams.get("batchId");
    const date = url.searchParams.get("date");
    const requestedSessionId = url.searchParams.get("sessionId");
    if (!batchId || !date) return new NextResponse("Missing required parameters: batchId and date", { status: 400 });

    const attendanceDate = parseDate(date);
    if (!attendanceDate) return new NextResponse("Invalid date", { status: 400 });

    const batch = await db.batch.findUnique({ where: { id: batchId }, select: { id: true, teacherId: true } });
    if (!batch) return new NextResponse("Batch not found", { status: 404 });
    if (user.user_metadata.role === Role.TEACHER && batch.teacherId !== user.id) {
      return new NextResponse("You are not authorized to view attendance for this batch", { status: 403 });
    }

    const session = requestedSessionId
      ? await db.attendanceSession.findFirst({ where: { id: requestedSessionId, batchId } })
      : await db.attendanceSession.findFirst({
          where: { batchId, date: attendanceDate, type: AttendanceSessionType.REGULAR },
          orderBy: { createdAt: "asc" },
        });

    const admissions = await db.admission.findMany({
      where: { batchId, status: "ACTIVE" },
      include: { student: { include: { user: true } } },
      orderBy: { admission_date: "asc" },
    });

    const attendanceRecords = await db.attendance.findMany({
      where: session
        ? { sessionId: session.id }
        : { batchId, date: dayRange(attendanceDate) },
    });
    const attendanceMap = new Map(attendanceRecords.map((record) => [record.studentId, record.status]));

    return NextResponse.json(admissions.map((admission) => ({
      admissionId: admission.id,
      studentId: admission.student.id,
      name: admission.student.user.name,
      email: admission.student.user.email,
      phone: admission.student.phone,
      parentName: admission.student.fatherName,
      joinDate: admission.admission_date,
      sessionId: session?.id || null,
      sessionType: session?.type || AttendanceSessionType.REGULAR,
      sessionLabel: session?.label || "Regular Class",
      // null is retained for the API; the new-attendance UI applies its
      // default-present policy without changing persisted history.
      isPresent: attendanceMap.has(admission.student.id) ? attendanceMap.get(admission.student.id) : null,
    })));
  } catch (error) {
    console.error("[ATTENDANCE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getStaffUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { batchId, date, attendanceData, sessionId, sessionType, sessionLabel } = body;
    if (!batchId || !date || !Array.isArray(attendanceData)) {
      return new NextResponse("Missing required fields: batchId, date, attendanceData", { status: 400 });
    }

    const attendanceDate = parseDate(date);
    if (!attendanceDate) return new NextResponse("Invalid date", { status: 400 });

    const batch = await db.batch.findUnique({ where: { id: batchId }, select: { id: true, teacherId: true } });
    if (!batch) return new NextResponse("Batch not found", { status: 404 });
    if (user.user_metadata.role === Role.TEACHER && batch.teacherId !== user.id) {
      return new NextResponse("You are not authorized to take attendance for this batch", { status: 403 });
    }

    const type = sessionType === AttendanceSessionType.EXTRA ? AttendanceSessionType.EXTRA : AttendanceSessionType.REGULAR;
    const session = await getSession(batchId, attendanceDate, user.id, sessionId, type, sessionLabel);
    const studentIds = new Set(
      (await db.admission.findMany({ where: { batchId, status: "ACTIVE" }, select: { studentId: true } })).map((a) => a.studentId),
    );

    for (const record of attendanceData) {
      const { studentId, isPresent } = record;
      if (!studentId || typeof isPresent !== "boolean" || !studentIds.has(studentId)) continue;

      const attendance = await db.attendance.upsert({
        where: { sessionId_studentId: { sessionId: session.id, studentId } },
        update: { status: isPresent },
        create: { date: attendanceDate, batchId, studentId, sessionId: session.id, status: isPresent },
        include: { student: { include: { user: true } } },
      });

      if (!isPresent) {
        const phone = attendance.student.parentMobile || attendance.student.phone;
        if (phone) {
          sendTrackedAbsence(phone, attendance.student.user.name, date, `absence:${session.id}:${studentId}`).catch(console.error);
        }
      }
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("[ATTENDANCE_POST]", error);
    return new NextResponse(error instanceof Error ? error.message : "Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getStaffUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    const body = await req.json();
    const { attendanceId, isPresent } = body;
    if (!attendanceId || typeof isPresent !== "boolean") return new NextResponse("Missing required fields: attendanceId, isPresent", { status: 400 });

    const record = await db.attendance.findUnique({ where: { id: attendanceId }, include: { batch: true, student: { include: { user: true } } } });
    if (!record) return new NextResponse("Attendance record not found", { status: 404 });
    if (user.user_metadata.role === Role.TEACHER && record.batch.teacherId !== user.id) {
      return new NextResponse("You are not authorized to edit attendance for this batch", { status: 403 });
    }

    const updated = await db.attendance.update({ where: { id: attendanceId }, data: { status: isPresent } });
    if (!isPresent) {
      const phone = record.student.parentMobile || record.student.phone;
      if (phone) sendTrackedAbsence(phone, record.student.user.name, record.date.toISOString().slice(0, 10), `absence:${record.sessionId || record.id}:${record.studentId}`).catch(console.error);
    }
    return NextResponse.json({ success: true, attendance: updated });
  } catch (error) {
    console.error("[ATTENDANCE_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
