import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { studentId, amount, mode, receipt_no, skipFeesPendingUpdate } = body;

        const paymentAmount = parseFloat(amount);

        // Create Payment
        const payment = await db.payment.create({
            data: {
                studentId,
                amount: paymentAmount,
                mode,
                receipt_no,
            }
        });

        // Update Pending Fees on admissions - skip if already calculated during admission creation
        // skipFeesPendingUpdate is used during initial admission when fees_pending is already set correctly
        if (!skipFeesPendingUpdate) {
            // Find all admissions for this student with pending fees
            const admissionsWithPending = await db.admission.findMany({
                where: { 
                    studentId,
                    fees_pending: { gt: 0 }
                },
                orderBy: { createdAt: 'asc' }
            });

            // Distribute payment across admissions in order
            let remainingPayment = paymentAmount;
            for (const admission of admissionsWithPending) {
                if (remainingPayment <= 0) break;
                
                const amountToApply = Math.min(remainingPayment, admission.fees_pending);
                const newPending = admission.fees_pending - amountToApply;
                
                await db.admission.update({
                    where: { id: admission.id },
                    data: { fees_pending: newPending }
                });
                
                remainingPayment -= amountToApply;
            }
        }


        return NextResponse.json(payment);

    } catch (error) {
        console.log("[PAYMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
