import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { addMonths, setDate, startOfDay } from "date-fns";

// Fixed billing cycle day (should match recurring-fees route)
const BILLING_CYCLE_DAY = 5;

// Get the next billing date from a given date
function getNextBillingDate(fromDate: Date): Date {
    const date = new Date(fromDate);
    const currentDay = date.getDate();

    if (currentDay <= BILLING_CYCLE_DAY) {
        return startOfDay(setDate(date, BILLING_CYCLE_DAY));
    } else {
        return startOfDay(setDate(addMonths(date, 1), BILLING_CYCLE_DAY));
    }
}

export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { studentId, batchId, total_fees, admission_charge, admission_charge_pending, fees_pending, selectedDays } = body;

        if (!studentId || total_fees === undefined || fees_pending === undefined) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const admission = await db.admission.create({
            data: {
                studentId,
                batchId: batchId || null, // Optional for Home Tutor
                total_fees: parseFloat(total_fees), // Batch fee (used for recurring)
                admission_charge: admission_charge ? parseFloat(admission_charge) : 0, // One-time admission charge
                admission_charge_pending: admission_charge_pending ? parseFloat(admission_charge_pending) : 0, // Pending admission charge
                fees_pending: parseFloat(fees_pending), // Pending batch fees only
                selectedDays: selectedDays ? parseInt(selectedDays) : null, // For days-wise fees
            }
        });

        // If batch has MONTHLY or QUARTERLY fee model, create first period as paid
        if (batchId) {
            try {
                const batch = await db.batch.findUnique({
                    where: { id: batchId },
                    select: {
                        feeModel: true,
                        feeAmount: true,
                        daysWiseFeesEnabled: true,
                        daysWiseFees: true
                    }
                });

                console.log("[ADMISSIONS_POST] Batch found:", batch?.feeModel);

                if (batch && (batch.feeModel === 'MONTHLY' || batch.feeModel === 'QUARTERLY')) {
                    // Use total_fees from admission (what user entered)
                    // This respects any modifications the user made during admission
                    const feeAmount = parseFloat(total_fees);

                    console.log("[ADMISSIONS_POST] Creating first recurring period with amount:", feeAmount);

                    // Calculate first period dates
                    const admissionDate = admission.admission_date;
                    const periodStart = startOfDay(new Date(admissionDate));
                    const periodEnd = getNextBillingDate(admissionDate);

                    const now = new Date();

                    // Check if user actually paid (fees_pending == 0 means fully paid)
                    const userPaid = parseFloat(fees_pending) === 0;

                    // Create first recurring period
                    // Mark as paid ONLY if user actually paid during admission
                    // Don't create a separate payment - the admission page handles that
                    const period = await db.recurringFeePeriod.create({
                        data: {
                            admissionId: admission.id,
                            periodNumber: 1,
                            periodType: batch.feeModel,
                            periodStart,
                            periodEnd,
                            amount: feeAmount,
                            isPaid: userPaid,
                            paidAt: userPaid ? now : null,
                            paymentId: null // Will be linked later if needed
                        }
                    });

                    console.log("[ADMISSIONS_POST] First recurring period created:", period.id, "isPaid:", userPaid);
                }
            } catch (recurringError) {
                // Log but don't fail the admission if recurring period creation fails
                console.error("[ADMISSIONS_POST] Error creating first recurring period:", recurringError);
            }
        }

        return NextResponse.json(admission);

    } catch (error) {
        console.log("[ADMISSIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
