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
    const selectedMonth = searchParams.get("month") || new Date().toISOString().slice(0, 7); // "2026-02"
    const selectedBatchId = searchParams.get("batchId") || "all";

    // Get teacher's batches
    const batchWhere: any = { teacherId: user.id };
    const batches = await db.batch.findMany({
      where: batchWhere,
      select: { id: true, name: true, subject: true },
      orderBy: { name: 'asc' },
    });

    // Build payment query: payments linked to admissions in teacher's batches
    const batchIds = selectedBatchId === "all"
      ? batches.map(b => b.id)
      : [selectedBatchId];

    const payments = await db.payment.findMany({
      where: {
        admission: {
          batchId: { in: batchIds },
        },
        coveredMonths: { has: selectedMonth },
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
        admission: {
          include: {
            batch: { select: { name: true, subject: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    const formatted = payments.map(p => ({
      id: p.id,
      studentName: p.student?.user?.name || "Unknown",
      batchName: p.admission?.batch
        ? `${p.admission.batch.name} - ${p.admission.batch.subject}`
        : "N/A",
      amount: p.amount,
      date: p.date.toISOString(),
      mode: p.mode,
      receipt_no: p.receipt_no,
    }));

    return NextResponse.json({
      payments: formatted,
      totalCollected,
      totalPayments: payments.length,
      batches: batches.map(b => ({
        id: b.id,
        name: `${b.name} - ${b.subject}`,
      })),
    });

  } catch (error) {
    console.log("[TEACHER_PAYROLL_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
