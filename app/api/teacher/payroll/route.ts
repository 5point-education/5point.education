import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || (user.user_metadata.role !== Role.TEACHER && user.user_metadata.role !== Role.ADMIN)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const selectedMonth = searchParams.get("month") || new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const selectedBatchId = searchParams.get("batchId") || "all";
    const teacherIdParam = searchParams.get("teacherId");
    const teacherId = user.user_metadata.role === Role.TEACHER ? user.id : teacherIdParam;

    if (!teacherId) {
      return new NextResponse("teacherId is required for admin view", { status: 400 });
    }

    const batchWhere: any = { teacherId };

    const batches = await db.batch.findMany({
      where: batchWhere,
      select: { id: true, name: true, subject: true },
      orderBy: { name: 'asc' },
    });

    const batchIds = selectedBatchId === "all" ? batches.map((batch) => batch.id) : [selectedBatchId];
    if (selectedBatchId !== "all" && !batches.some((batch) => batch.id === selectedBatchId)) {
      return new NextResponse("Unauthorized batch access", { status: 403 });
    }

    const sheets = await db.teacherFeeSheet.findMany({
      where: {
        teacherId,
        month: selectedMonth,
        batchId: { in: batchIds },
      },
      include: {
        batch: { select: { id: true, name: true, subject: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const totalTeacherAmount = sheets.reduce((sum, sheet) => sum + sheet.totalTeacherAmount, 0);
    const totalReceived = sheets.reduce((sum, sheet) => sum + sheet.totalReceived, 0);

    return NextResponse.json({
      sheets: sheets.map((sheet) => ({
        id: sheet.id,
        batchId: sheet.batchId,
        batchName: `${sheet.batch.name} - ${sheet.batch.subject}`,
        totalReceived: sheet.totalReceived,
        totalDeductions: sheet.totalDeductions,
        totalTeacherAmount: sheet.totalTeacherAmount,
        updatedAt: sheet.updatedAt.toISOString(),
      })),
      totalTeacherAmount,
      totalReceived,
      totalSheets: sheets.length,
      batches: batches.map((b) => ({
        id: b.id,
        name: `${b.name} - ${b.subject}`,
      })),
    });

  } catch (error) {
    console.log("[TEACHER_PAYROLL_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
