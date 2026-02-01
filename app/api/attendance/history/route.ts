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
    const batchId = url.searchParams.get("batchId"); // Optional filter by batch

    // Build query condition
    const whereCondition: any = {};
    if (batchId) {
      whereCondition.batchId = batchId;
    }

    // If user is teacher, only show their batches
    if (user.user_metadata.role === Role.TEACHER) {
      const teacherBatches = await db.batch.findMany({
        where: { teacherId: user.id },
        select: { id: true }
      });
      whereCondition.batchId = { in: teacherBatches.map(b => b.id) };
    }

    // Get all attendance records grouped by batch and date
    const attendanceRecords = await (db as any).attendance.findMany({
      where: whereCondition,
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            subject: true,
            classLevel: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Group by batchId and date
    const historyMap = new Map<string, {
      batchId: string;
      batchName: string;
      subject: string;
      classLevel: string | null;
      date: string;
      present: number;
      absent: number;
      total: number;
    }>();

    for (const record of attendanceRecords) {
      const dateStr = record.date.toISOString().split('T')[0];
      const key = `${record.batchId}-${dateStr}`;

      if (!historyMap.has(key)) {
        historyMap.set(key, {
          batchId: record.batchId,
          batchName: record.batch.name,
          subject: record.batch.subject,
          classLevel: record.batch.classLevel,
          date: dateStr,
          present: 0,
          absent: 0,
          total: 0
        });
      }

      const entry = historyMap.get(key)!;
      entry.total += 1;
      if (record.status) {
        entry.present += 1;
      } else {
        entry.absent += 1;
      }
    }

    // Convert map to array and sort by date desc
    const history = Array.from(historyMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(history);
  } catch (error) {
    console.log("[ATTENDANCE_HISTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
