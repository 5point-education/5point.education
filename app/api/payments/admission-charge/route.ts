import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

/**
 * POST /api/payments/admission-charge
 * Records a payment specifically for admission charges.
 * Unlike batch fees, admission charges can be paid partially with custom amounts.
 */
export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { 
            studentId, 
            admissionId, 
            amount, 
            mode, 
            receipt_no,
            notes 
        } = body;

        // Validation
        if (!studentId || !admissionId || !amount || !receipt_no) {
            return new NextResponse("Missing required fields: studentId, admissionId, amount, receipt_no", { status: 400 });
        }

        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            return new NextResponse("Invalid payment amount", { status: 400 });
        }

        // Get the admission to verify and check pending charge
        const admission = await db.admission.findUnique({
            where: { id: admissionId },
            include: {
                batch: {
                    select: {
                        name: true,
                        subject: true
                    }
                }
            }
        });

        if (!admission) {
            return new NextResponse("Admission not found", { status: 404 });
        }

        if (admission.studentId !== studentId) {
            return new NextResponse("Admission does not belong to this student", { status: 400 });
        }

        // Check if there's pending admission charge
        if (admission.admission_charge_pending <= 0) {
            return new NextResponse("No pending admission charge for this admission", { status: 400 });
        }

        // Ensure payment doesn't exceed pending amount
        if (paymentAmount > admission.admission_charge_pending) {
            return new NextResponse(
                `Payment amount (₹${paymentAmount}) exceeds pending admission charge (₹${admission.admission_charge_pending})`,
                { status: 400 }
            );
        }

        // Create the payment record
        const payment = await db.payment.create({
            data: {
                studentId,
                admissionId,
                amount: paymentAmount,
                mode,
                receipt_no,
                coveredMonths: [], // Admission charges don't cover months
                notes: notes ? `Admission Charge Payment${notes ? ': ' + notes : ''}` : 'Admission Charge Payment',
            }
        });

        // Update the admission's pending charge
        const newPendingCharge = admission.admission_charge_pending - paymentAmount;
        await db.admission.update({
            where: { id: admissionId },
            data: {
                admission_charge_pending: Math.max(0, newPendingCharge) // Ensure non-negative
            }
        });

        return NextResponse.json({
            success: true,
            payment,
            newPendingCharge: Math.max(0, newPendingCharge),
            message: `Recorded ₹${paymentAmount} payment for admission charge`
        });

    } catch (error: any) {
        console.log("[ADMISSION_CHARGE_PAYMENT_POST]", error);
        return new NextResponse(error.message || "Internal Error", { status: 500 });
    }
}
