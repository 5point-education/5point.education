import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { calculatePendingFees } from "@/lib/fees-utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch all student profiles with their admissions and payments
        const students = await db.studentProfile.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    }
                },
                admissions: {
                    include: {
                        batch: {
                            select: {
                                id: true,
                                name: true,
                                subject: true,
                                feeModel: true,
                                feeAmount: true,
                                daysWiseFeesEnabled: true,
                                daysWiseFees: true,
                                endDate: true,
                                isActive: true,
                                updatedAt: true,
                            }
                        },
                        payments: {
                            select: {
                                coveredMonths: true
                            }
                        }
                    }
                },
                payments: {
                    orderBy: {
                        date: 'desc'
                    }
                }
            },
            orderBy: {
                user: {
                    name: 'asc'
                }
            }
        });

        // Transform data to include calculated fields
        const feesData = await Promise.all(students.map(async (student) => {
            // Calculate actual pending fees and total fees for each admission
            let totalCalculatedFees = 0; // Total fees that should be paid (calculated from months)
            let totalCalculatedFeesPending = 0; // Calculated pending fees
            let totalAdmissionCharge = 0;
            let totalAdmissionChargePending = 0;

            const admissionsWithCalculations = await Promise.all(
                student.admissions.map(async (adm) => {
                    let calculatedTotalFees = 0; // Total fees for this admission (months * monthlyFee)
                    let calculatedPendingAmount = 0;
                    let monthlyFee = 0;
                    let totalMonths = 0;
                    let pendingMonths = 0;

                    // Calculate fees if batch exists and is not ONE_TIME/CUSTOM
                    if (adm.batch && adm.batch.feeModel !== "ONE_TIME" && adm.batch.feeModel !== "CUSTOM") {
                        try {
                            // Get payments for this admission
                            const admissionPayments = adm.payments || [];
                            const pendingData = await calculatePendingFees(
                                {
                                    ...adm,
                                    batch: adm.batch,
                                    payments: admissionPayments,
                                },
                                adm.selectedDays
                            );
                            calculatedPendingAmount = pendingData.pendingAmount;
                            monthlyFee = pendingData.monthlyFee;
                            totalMonths = pendingData.totalMonths;
                            pendingMonths = pendingData.pendingMonths.length;
                            // Total fees = all months * monthly fee
                            calculatedTotalFees = totalMonths * monthlyFee;
                        } catch (error) {
                            console.error(`Error calculating fees for admission ${adm.id}:`, error);
                            // Fallback to database values
                            calculatedTotalFees = adm.total_fees;
                            calculatedPendingAmount = adm.fees_pending;
                        }
                    } else {
                        // For ONE_TIME/CUSTOM, use database values
                        calculatedTotalFees = adm.total_fees;
                        calculatedPendingAmount = adm.fees_pending;
                    }

                    const admissionCharge = adm.admission_charge || 0;
                    const admissionChargePending = adm.admission_charge_pending || 0;

                    totalCalculatedFees += calculatedTotalFees;
                    totalCalculatedFeesPending += calculatedPendingAmount;
                    totalAdmissionCharge += admissionCharge;
                    totalAdmissionChargePending += admissionChargePending;

                    return {
                        id: adm.id,
                        batchId: adm.batchId,
                        batchName: adm.batch ? `${adm.batch.name} - ${adm.batch.subject}` : 'No Batch',
                        total_fees: calculatedTotalFees, // Calculated total fees
                        calculatedPendingFees: calculatedPendingAmount, // Calculated pending fees
                        admission_charge: admissionCharge,
                        admission_charge_pending: admissionChargePending,
                        fees_pending: calculatedPendingAmount, // Use calculated value
                        feeModel: adm.batch?.feeModel || null,
                        admission_date: adm.admission_date,
                        monthlyFee,
                        totalMonths,
                        pendingMonths,
                    };
                })
            );

            const totalFees = totalCalculatedFees + totalAdmissionCharge;
            const totalPending = totalCalculatedFeesPending + totalAdmissionChargePending;
            const totalPaid = student.payments.reduce((sum, pay) => sum + pay.amount, 0);

            return {
                studentId: student.id,
                studentName: student.user.name,
                email: student.user.email,
                phone: student.phone,
                admissions: admissionsWithCalculations,
                payments: student.payments.map(pay => ({
                    id: pay.id,
                    amount: pay.amount,
                    date: pay.date,
                    mode: pay.mode,
                    receipt_no: pay.receipt_no,
                })),
                totalFees, // Total fees (calculated + admission charges)
                totalCalculatedFees, // Calculated batch fees only
                totalAdmissionCharge,
                totalPaid,
                totalPending, // Total pending (calculated + admission charges)
                totalBatchFeesPending: totalCalculatedFeesPending, // Calculated pending batch fees
                totalAdmissionChargePending,
            };
        }));

        return NextResponse.json(feesData);

    } catch (error) {
        console.log("[FEES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
