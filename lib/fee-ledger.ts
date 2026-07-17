import { AdmissionStatus, PaymentKind, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { calculatePendingFees } from "@/lib/fees-utils";

export type FeeLedgerClient = typeof db | Prisma.TransactionClient;

export function normalizeSubjectKey(subject: string | null | undefined) {
  return (subject || "").trim().toLocaleLowerCase();
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function recalculateAdmissionBalance(
  admissionId: string,
  client: FeeLedgerClient = db,
) {
  const admission = await client.admission.findUnique({
    where: { id: admissionId },
    include: {
      batch: true,
      payments: {
        select: {
          amount: true,
          kind: true,
          coveredMonths: true,
        },
      },
    },
  });

  if (!admission || !admission.batch) return null;

  let pendingAmount = admission.fees_pending;
  if (admission.batch.feeModel === "ONE_TIME" || admission.batch.feeModel === "CUSTOM") {
    const paidBatchFees = admission.payments
      .filter((payment) => payment.kind === PaymentKind.BATCH_FEE)
      .reduce((sum, payment) => sum + payment.amount, 0);
    pendingAmount = Math.max(
      0,
      roundCurrency(admission.total_fees - (admission.discount_value || 0) - paidBatchFees),
    );
  } else {
    const pendingData = await calculatePendingFees(admission, admission.selectedDays);
    pendingAmount = roundCurrency(pendingData.pendingAmount);
  }

  await client.admission.update({
    where: { id: admissionId },
    data: { fees_pending: pendingAmount },
  });

  return pendingAmount;
}

export async function recalculateStudentBalances(
  studentId: string,
  client: FeeLedgerClient = db,
) {
  const admissions = await client.admission.findMany({
    where: { studentId },
    select: { id: true },
  });

  for (const admission of admissions) {
    await recalculateAdmissionBalance(admission.id, client);
  }
}

export async function findDuplicateSubjectAdmissions(studentId: string, subjectKey: string) {
  return db.admission.findMany({
    where: {
      studentId,
      status: AdmissionStatus.ACTIVE,
      activeSubjectKey: subjectKey,
    },
    include: {
      batch: { select: { id: true, name: true, subject: true } },
      student: { include: { user: { select: { name: true } } } },
    },
    orderBy: { admission_date: "asc" },
  });
}

export async function classifyLegacyPaymentKinds() {
  const payments = await db.payment.findMany({
    where: { kind: PaymentKind.LEGACY_UNALLOCATED },
    select: { id: true, notes: true, coveredMonths: true },
  });

  let batchFees = 0;
  let admissionCharges = 0;
  for (const payment of payments) {
    const kind = payment.coveredMonths.length > 0
      ? PaymentKind.BATCH_FEE
      : payment.notes?.toLowerCase().startsWith("admission charge payment")
        ? PaymentKind.ADMISSION_CHARGE
        : PaymentKind.LEGACY_UNALLOCATED;

    if (kind === PaymentKind.LEGACY_UNALLOCATED) continue;
    await db.payment.update({ where: { id: payment.id }, data: { kind } });
    if (kind === PaymentKind.BATCH_FEE) batchFees += 1;
    if (kind === PaymentKind.ADMISSION_CHARGE) admissionCharges += 1;
  }

  return { reviewed: payments.length, batchFees, admissionCharges };
}
