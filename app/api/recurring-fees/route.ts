import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { addMonths, differenceInMonths } from "date-fns";

// Calculate how many periods have elapsed since admission
function calculatePeriodsElapsed(admissionDate: Date, feeModel: 'MONTHLY' | 'QUARTERLY'): number {
    const now = new Date();
    const monthsElapsed = differenceInMonths(now, admissionDate) + 1; // Include current period
    
    if (feeModel === 'MONTHLY') {
        return Math.max(1, monthsElapsed);
    } else { // QUARTERLY
        return Math.max(1, Math.ceil(monthsElapsed / 3));
    }
}

// Get period start and end dates
function getPeriodDates(admissionDate: Date, periodNumber: number, feeModel: string) {
    if (feeModel === 'MONTHLY') {
        const start = addMonths(admissionDate, periodNumber - 1);
        const end = addMonths(admissionDate, periodNumber);
        return { start, end };
    } else { // QUARTERLY
        const start = addMonths(admissionDate, (periodNumber - 1) * 3);
        const end = addMonths(admissionDate, periodNumber * 3);
        return { start, end };
    }
}

// Get fee amount for the admission (considering days-wise fees)
function getFeeAmount(batch: any, admission: any): number {
    // If days-wise fees is enabled
    if (batch.daysWiseFeesEnabled && batch.daysWiseFees) {
        // If we have selectedDays, use the days-wise fee
        if (admission.selectedDays) {
            const daysWiseFees = batch.daysWiseFees as Record<string, number>;
            return daysWiseFees[admission.selectedDays.toString()] || batch.feeAmount || 0;
        }
        // For existing admissions without selectedDays, use total_fees from admission
        // (this is the fee that was entered during admission)
        if (admission.total_fees && admission.total_fees > 0) {
            return admission.total_fees;
        }
    }
    // For regular fee model, use batch feeAmount
    // Or fall back to admission's total_fees if batch feeAmount is not set
    return batch.feeAmount || admission.total_fees || 0;
}

export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get all admissions with MONTHLY or QUARTERLY fee models
        const admissions = await db.admission.findMany({
            where: {
                batch: {
                    feeModel: {
                        in: ['MONTHLY', 'QUARTERLY']
                    },
                    isActive: true // Only active batches
                }
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                batch: {
                    select: {
                        id: true,
                        name: true,
                        subject: true,
                        feeModel: true,
                        feeAmount: true,
                        daysWiseFeesEnabled: true,
                        daysWiseFees: true,
                        isActive: true
                    }
                },
                recurringPeriods: {
                    orderBy: {
                        periodNumber: 'asc'
                    }
                }
            },
            orderBy: {
                admission_date: 'desc'
            }
        });

        const recurringFeesData = [];

        for (const admission of admissions) {
            if (!admission.batch || !admission.batch.feeModel) continue;

            const feeModel = admission.batch.feeModel as 'MONTHLY' | 'QUARTERLY';
            const periodsElapsed = calculatePeriodsElapsed(admission.admission_date, feeModel);
            const feeAmount = getFeeAmount(admission.batch, admission);

            // Get existing periods
            const existingPeriods = admission.recurringPeriods;
            const existingPeriodNumbers = new Set(existingPeriods.map(p => p.periodNumber));

            // Generate missing periods
            const periodsToCreate = [];
            for (let i = 1; i <= periodsElapsed; i++) {
                if (!existingPeriodNumbers.has(i)) {
                    const { start, end } = getPeriodDates(admission.admission_date, i, feeModel);
                    periodsToCreate.push({
                        admissionId: admission.id,
                        periodNumber: i,
                        periodType: feeModel,
                        periodStart: start,
                        periodEnd: end,
                        amount: feeAmount,
                        isPaid: false
                    });
                }
            }

            // Create missing periods in database
            if (periodsToCreate.length > 0) {
                await db.recurringFeePeriod.createMany({
                    data: periodsToCreate,
                    skipDuplicates: true
                });
            }

            // Fix existing periods with amount 0 (for backwards compatibility)
            const periodsToFix = existingPeriods.filter(p => p.amount === 0 && !p.isPaid);
            if (periodsToFix.length > 0 && feeAmount > 0) {
                await db.recurringFeePeriod.updateMany({
                    where: {
                        id: { in: periodsToFix.map(p => p.id) }
                    },
                    data: {
                        amount: feeAmount
                    }
                });
            }

            // Fetch all periods again after creating
            const allPeriods = await db.recurringFeePeriod.findMany({
                where: { admissionId: admission.id },
                include: {
                    payment: {
                        select: {
                            id: true,
                            receipt_no: true,
                            mode: true,
                            date: true
                        }
                    }
                },
                orderBy: { periodNumber: 'asc' }
            });

            // Add to response data
            for (const period of allPeriods) {
                const now = new Date();
                let status: 'paid' | 'pending' | 'overdue' = 'pending';
                
                if (period.isPaid) {
                    status = 'paid';
                } else if (period.periodEnd < now) {
                    status = 'overdue';
                }

                recurringFeesData.push({
                    id: period.id,
                    admissionId: admission.id,
                    studentId: admission.studentId,
                    studentName: admission.student.user.name,
                    studentPhone: admission.student.phone,
                    batchId: admission.batch.id,
                    batchName: `${admission.batch.name} - ${admission.batch.subject}`,
                    feeModel: feeModel,
                    periodNumber: period.periodNumber,
                    periodLabel: feeModel === 'MONTHLY' 
                        ? `Month ${period.periodNumber}` 
                        : `Q${period.periodNumber}`,
                    periodStart: period.periodStart,
                    periodEnd: period.periodEnd,
                    amount: period.amount,
                    isPaid: period.isPaid,
                    paidAt: period.paidAt,
                    paymentId: period.paymentId,
                    payment: period.payment,
                    status,
                    admissionDate: admission.admission_date
                });
            }
        }

        // Sort by status (overdue first, then pending, then paid) and then by period start
        recurringFeesData.sort((a, b) => {
            const statusOrder = { overdue: 0, pending: 1, paid: 2 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            return new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime();
        });

        return NextResponse.json(recurringFeesData);

    } catch (error) {
        console.log("[RECURRING_FEES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
