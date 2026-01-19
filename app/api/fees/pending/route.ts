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
    const admissionId = searchParams.get("admissionId");

    if (!admissionId) {
      return new NextResponse("Admission ID is required", { status: 400 });
    }

    // Get admission with batch and payments
    const admission = await db.admission.findUnique({
      where: { id: admissionId },
      include: {
        batch: true,
        payments: {
          select: {
            coveredMonths: true,
          },
        },
      },
    });

    if (!admission) {
      return new NextResponse("Admission not found", { status: 404 });
    }

    if (!admission.batch) {
      return new NextResponse("Admission has no batch", { status: 400 });
    }

    // Use the helper function to calculate pending fees
    const pendingData = await calculatePendingFees(
      {
        ...admission,
        batch: admission.batch!,
      },
      admission.selectedDays
    );

    // Get all months and covered months for response
    const allMonths = await db.admission.findUnique({
      where: { id: admissionId },
      include: {
        payments: {
          select: {
            coveredMonths: true,
          },
        },
      },
    });

    const coveredMonthsSet = new Set<string>();
    allMonths?.payments.forEach((payment) => {
      payment.coveredMonths.forEach((month) => {
        coveredMonthsSet.add(month);
      });
    });

    // Determine calculation end date for response
    let calculationEndDate: Date;
    if (admission.status === "WITHDRAWN" && admission.endDate) {
      calculationEndDate = admission.endDate;
    } else if (admission.batch.endDate) {
      calculationEndDate = admission.batch.endDate;
    } else if (!admission.batch.isActive) {
      calculationEndDate = admission.batch.updatedAt;
    } else {
      calculationEndDate = new Date();
    }

    return NextResponse.json({
      admissionId,
      ...pendingData,
      calculationEndDate,
      allMonths: pendingData.totalMonths > 0 ? 
        getMonthsBetween(
          admission.admission_date,
          calculationEndDate,
          admission.batch.feeModel
        ) : [],
      coveredMonthsList: Array.from(coveredMonthsSet),
    });
  } catch (error: any) {
    console.log("[FEES_PENDING_GET]", error);
    return new NextResponse(error.message || "Internal Error", {
      status: 500,
    });
  }
}
