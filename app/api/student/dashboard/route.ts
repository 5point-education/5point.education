import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { AdmissionStatus, Role } from "@prisma/client";
import { calculatePendingFees } from "@/lib/fees-utils";

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || user.user_metadata.role !== Role.STUDENT) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Get Student Profile ID
    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: user.id }
    });

    if (!studentProfile) {
      return new NextResponse("Student profile not found", { status: 404 });
    }

    // 2. Get Admissions (for Fees & Batch info) with payments
    const admissions = await db.admission.findMany({
      where: {
        studentId: studentProfile.id,
        status: AdmissionStatus.ACTIVE
      },
      include: {
        batch: true,
        payments: {
          select: {
            coveredMonths: true
          }
        }
      },
      orderBy: { createdAt: 'desc' } // Latest first
    });

    // Calculate actual pending fees using calculatePendingFees for each admission
    let totalCalculatedFeesPending = 0;
    let totalAdmissionChargePending = 0;
    const feesBreakdown = [];

    // Calculate total discounts across all batches (independent of pending fees)
    let totalDiscounts = 0;
    const discountsBreakdown: Array<{
      batchName: string;
      discountValue: number;
      discountType: string | null;
      status: string;
    }> = [];

    for (const adm of admissions) {
      if (adm.discount_value && adm.discount_value > 0) {
        totalDiscounts += adm.discount_value;
        discountsBreakdown.push({
          batchName: adm.batch ? `${adm.batch.name} - ${adm.batch.subject}` : 'No Batch',
          discountValue: adm.discount_value,
          discountType: adm.discount_type,
          status: adm.status,
        });
      }
    }

    for (const adm of admissions) {
      let calculatedPendingAmount = 0;
      let monthlyFee = 0;
      let pendingMonths: string[] = [];

      // Calculate pending fees if batch exists and is not ONE_TIME/CUSTOM
      if (adm.batch && adm.batch.feeModel !== "ONE_TIME" && adm.batch.feeModel !== "CUSTOM") {
        try {
          const pendingData = await calculatePendingFees(
            {
              ...adm,
              batch: adm.batch,
            },
            adm.selectedDays
          );
          calculatedPendingAmount = pendingData.pendingAmount;
          monthlyFee = pendingData.monthlyFee;
          pendingMonths = pendingData.pendingMonths;
        } catch (error) {
          console.error(`Error calculating pending fees for admission ${adm.id}:`, error);
          // Fallback to database value if calculation fails
          calculatedPendingAmount = adm.fees_pending;
        }
      } else {
        // For ONE_TIME/CUSTOM, use database value
        calculatedPendingAmount = adm.fees_pending;
      }

      const admissionChargePending = adm.admission_charge_pending || 0;
      const totalPending = calculatedPendingAmount + admissionChargePending;

      totalCalculatedFeesPending += calculatedPendingAmount;
      totalAdmissionChargePending += admissionChargePending;

      if (totalPending > 0) {
        feesBreakdown.push({
          admissionId: adm.id,
          batchName: adm.batch ? `${adm.batch.name} - ${adm.batch.subject}` : 'No Batch',
          feesPending: calculatedPendingAmount,
          admissionChargePending,
          totalPending,
          monthlyFee,
          pendingMonths: pendingMonths.length,
          discountVal: adm.discount_value,
          discountType: adm.discount_type,
          status: adm.status,
        });
      }
    }

    const pendingFees = totalCalculatedFeesPending;

    // Simplistic Logic for "Next Class": Take schedule from latest batch
    let nextClass = "Not Assigned";
    if (admissions.length > 0 && admissions[0].batch) {
      nextClass = admissions[0].batch.schedule;
    } else if (studentProfile.service_type === "HOME_TUTOR") {
      nextClass = "Home Tutor Schedule"; // Placeholder, real app might have calendar
    }

    // 3. Get Exam Results
    const results = await db.result.findMany({
      where: { studentId: studentProfile.id },
      include: {
        exam: {
          include: {
            batch: true
          }
        }
      },
      orderBy: {
        exam: { date: 'desc' }
      }
    });

    const totalExams = results.length;

    // Calculate Average Percentage
    let totalPercentage = 0;
    results.forEach(r => {
      totalPercentage += (r.score / r.exam.total_marks) * 100;
    });
    const averageScore = totalExams > 0 ? (totalPercentage / totalExams).toFixed(1) : "0";

    // Format for Chart (Oldest to Newest)
    const performanceData = [...results].reverse().map(r => ({
      examName: r.exam.name,
      score: r.score,
      totalMarks: r.exam.total_marks,
      date: r.exam.date.toISOString(),
    }));

    // Format for Table (Newest to Oldest)
    const recentResults = results.map(r => ({
      id: r.id,
      examName: r.exam.name,
      subject: r.exam.batch.subject, // Assuming batch subject. Exam name usually has context too.
      score: r.score,
      totalMarks: r.exam.total_marks,
      remarks: r.remarks,
      date: r.exam.date.toISOString(),
    }));

    return NextResponse.json({
      overview: {
        totalExams,
        averageScore,
        pendingFees,
        totalFeesPending: totalCalculatedFeesPending,
        totalAdmissionChargePending,
        totalDiscounts,
        nextClass
      },
      feesBreakdown,
      discountsBreakdown,
      performanceData,
      recentResults
    });

  } catch (error) {
    console.log("[STUDENT_DASHBOARD_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
