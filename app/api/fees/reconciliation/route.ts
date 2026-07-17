import { PaymentKind, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { calculatePendingFees } from "@/lib/fees-utils";
import { recalculateAdmissionBalance } from "@/lib/fee-ledger";

async function getRole() {
  const supabase = createAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const role = user?.user_metadata.role as Role | undefined;
  return error || !user || (role !== Role.ADMIN && role !== Role.RECEPTIONIST) ? null : role;
}

async function preview() {
  const admissions = await db.admission.findMany({
    where: { status: "ACTIVE", batchId: { not: null } },
    include: { batch: true, payments: { select: { amount: true, kind: true, coveredMonths: true } }, student: { include: { user: { select: { name: true } } } } },
    orderBy: { updatedAt: "desc" },
  });
  const rows = [];
  for (const admission of admissions) {
    if (!admission.batch) continue;
    let canonical: number;
    if (admission.batch.feeModel === "ONE_TIME" || admission.batch.feeModel === "CUSTOM") {
      const paid = admission.payments.filter((payment) => payment.kind === PaymentKind.BATCH_FEE).reduce((sum, payment) => sum + payment.amount, 0);
      canonical = Math.max(0, Math.round((admission.total_fees - admission.discount_value - paid) * 100) / 100);
    } else {
      canonical = (await calculatePendingFees(admission, admission.selectedDays)).pendingAmount;
    }
    const difference = Math.round((admission.fees_pending - canonical) * 100) / 100;
    if (Math.abs(difference) > 0.009) rows.push({ admissionId: admission.id, studentName: admission.student.user.name, batchName: admission.batch.name, stored: admission.fees_pending, canonical, difference });
  }
  return rows;
}

export async function GET() {
  try {
    if (!await getRole()) return new NextResponse("Unauthorized", { status: 401 });
    const rows = await preview();
    return NextResponse.json({ count: rows.length, rows });
  } catch (error) {
    console.error("[FEES_RECONCILIATION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const role = await getRole();
    if (role !== Role.ADMIN) return new NextResponse("Only administrators can confirm reconciliation", { status: 403 });
    const body = await req.json().catch(() => ({}));
    if (body.confirm !== true) return new NextResponse("Send { confirm: true } to apply reconciliation", { status: 400 });
    const rows = await preview();
    for (const row of rows) await recalculateAdmissionBalance(row.admissionId);
    return NextResponse.json({ success: true, updated: rows.length });
  } catch (error) {
    console.error("[FEES_RECONCILIATION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
