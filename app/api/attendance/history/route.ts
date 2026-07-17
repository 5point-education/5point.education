import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    const role = user?.user_metadata.role as Role | undefined;
    if (error || !user || (role !== Role.TEACHER && role !== Role.RECEPTIONIST && role !== Role.ADMIN)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const requestedBatchId = new URL(req.url).searchParams.get("batchId");
    const authorizedWhere = role === Role.TEACHER
      ? { teacherId: user.id, isActive: true, admissions: { some: { status: "ACTIVE" as const } } }
      : { isActive: true };
    const authorizedBatches = await db.batch.findMany({
      where: authorizedWhere,
      select: { id: true, name: true, subject: true, classLevel: true },
      orderBy: { name: "asc" },
    });
    const authorizedIds = new Set(authorizedBatches.map((batch) => batch.id));
    if (requestedBatchId && !authorizedIds.has(requestedBatchId)) {
      return new NextResponse("You are not authorized to view this batch history", { status: 403 });
    }

    const records = await db.attendance.findMany({
      where: { batchId: requestedBatchId ? requestedBatchId : { in: Array.from(authorizedIds) } },
      include: {
        batch: { select: { id: true, name: true, subject: true, classLevel: true } },
        session: { select: { id: true, type: true, label: true } },
      },
      orderBy: [{ date: "desc" }, { batchId: "asc" }],
    });

    const historyMap = new Map<string, {
      batchId: string;
      batchName: string;
      subject: string;
      classLevel: string | null;
      date: string;
      sessionId: string | null;
      sessionType: string;
      sessionLabel: string;
      present: number;
      absent: number;
      total: number;
    }>();

    for (const record of records) {
      const date = record.date.toISOString().slice(0, 10);
      const key = `${record.sessionId || record.batchId + ":" + date}`;
      const current = historyMap.get(key) || {
        batchId: record.batchId,
        batchName: record.batch.name,
        subject: record.batch.subject,
        classLevel: record.batch.classLevel,
        date,
        sessionId: record.sessionId,
        sessionType: record.session?.type || "REGULAR",
        sessionLabel: record.session?.label || "Regular Class",
        present: 0,
        absent: 0,
        total: 0,
      };
      current.total += 1;
      if (record.status) current.present += 1;
      else current.absent += 1;
      historyMap.set(key, current);
    }

    return NextResponse.json({
      history: Array.from(historyMap.values()).sort((a, b) => b.date.localeCompare(a.date)),
      authorizedBatches,
    });
  } catch (error) {
    console.error("[ATTENDANCE_HISTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
