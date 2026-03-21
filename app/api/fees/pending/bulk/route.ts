import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { calculatePendingFees, getMonthsBetween } from "@/lib/fees-utils";

export async function GET(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return new NextResponse("Student ID is required", { status: 400 });
    }

    // Fetch all active admissions for the student with batch and payment data
    const admissions = await db.admission.findMany({
      where: {
        studentId,
        status: { in: ["ACTIVE", "COMPLETED"] },
        batch: {
          feeModel: { in: ["MONTHLY", "QUARTERLY"] },
        },
      },
      include: {
        batch: true,
        payments: {
          select: {
            coveredMonths: true,
          },
        },
      },
      orderBy: { admission_date: "asc" },
    });

    // Calculate pending fees for each admission
    const results = await Promise.all(
      admissions.map(async (admission) => {
        if (!admission.batch) return null;

        try {
          const pendingData = await calculatePendingFees(
            {
              ...admission,
              batch: admission.batch,
            },
            admission.selectedDays
          );

          // Get covered months list
          const coveredMonthsSet = new Set<string>();
          admission.payments.forEach((payment) => {
            payment.coveredMonths.forEach((month) => {
              coveredMonthsSet.add(month);
            });
          });

          // Calculate actual fee based on fee model
          const baseFee = admission.batch.feeAmount || 0;
          const discountValue = admission.discount_value || 0;
          const actualFee = Math.max(0, baseFee - discountValue);

          return {
            admissionId: admission.id,
            batchId: admission.batchId,
            batchName: `${admission.batch.name} - ${admission.batch.subject}`,
            feeModel: admission.batch.feeModel,
            monthlyFee: pendingData.monthlyFee,
            actualFee,
            baseFeeBeforeDiscount: baseFee,
            discount_value: discountValue,
            discount_type: admission.discount_type || null,
            totalMonths: pendingData.totalMonths,
            coveredMonths: pendingData.coveredMonths,
            coveredMonthsList: Array.from(coveredMonthsSet),
            pendingMonths: pendingData.pendingMonths,
            pendingAmount: pendingData.pendingAmount,
            futureMonths: pendingData.futureMonths || [],
          };
        } catch (error) {
          console.error(`Error calculating fees for admission ${admission.id}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls and admissions with no pending/future months
    const validResults = results.filter(
      (r) => r !== null && (r.pendingMonths.length > 0 || r.futureMonths.length > 0)
    );

    return NextResponse.json(validResults);
  } catch (error: any) {
    console.log("[FEES_PENDING_BULK_GET]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
