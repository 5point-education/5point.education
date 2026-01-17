import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

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

        const payments = await db.payment.findMany({
            where: { studentId },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(payments);

    } catch (error) {
        console.log("[PAYMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
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

export async function PATCH(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { id, amount, mode, receipt_no } = body;

        if (!id) {
            return new NextResponse("Payment ID is required", { status: 400 });
        }

        // Get the old payment to calculate difference
        const oldPayment = await db.payment.findUnique({
            where: { id }
        });

        if (!oldPayment) {
            return new NextResponse("Payment not found", { status: 404 });
        }

        const newAmount = amount !== undefined ? parseFloat(amount) : oldPayment.amount;
        const amountDifference = newAmount - oldPayment.amount;

        // Update the payment
        const updateData: any = {};
        if (amount !== undefined) updateData.amount = newAmount;
        if (mode !== undefined) updateData.mode = mode;
        if (receipt_no !== undefined) updateData.receipt_no = receipt_no;

        const payment = await db.payment.update({
            where: { id },
            data: updateData
        });

        // If amount changed, update fees_pending on admissions
        if (amountDifference !== 0) {
            const admissions = await db.admission.findMany({
                where: { studentId: oldPayment.studentId },
                orderBy: { createdAt: 'asc' }
            });

            // Recalculate all fees_pending based on total payments
            const allPayments = await db.payment.findMany({
                where: { studentId: oldPayment.studentId }
            });
            const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

            // Distribute total paid across admissions
            let remainingPaid = totalPaid;
            for (const admission of admissions) {
                const paidForThis = Math.min(remainingPaid, admission.total_fees);
                const newPending = Math.max(0, admission.total_fees - paidForThis);
                
                await db.admission.update({
                    where: { id: admission.id },
                    data: { fees_pending: newPending }
                });
                
                remainingPaid -= paidForThis;
            }
        }

        return NextResponse.json(payment);

    } catch (error) {
        console.log("[PAYMENTS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return new NextResponse("Payment ID is required", { status: 400 });
        }

        // Get the payment to know the student and amount
        const payment = await db.payment.findUnique({
            where: { id }
        });

        if (!payment) {
            return new NextResponse("Payment not found", { status: 404 });
        }

        const studentId = payment.studentId;
        const deletedAmount = payment.amount;

        // Delete the payment
        await db.payment.delete({
            where: { id }
        });

        // Recalculate fees_pending for all admissions
        const admissions = await db.admission.findMany({
            where: { studentId },
            orderBy: { createdAt: 'asc' }
        });

        const remainingPayments = await db.payment.findMany({
            where: { studentId }
        });
        const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);

        // Distribute total paid across admissions
        let remainingPaid = totalPaid;
        for (const admission of admissions) {
            const paidForThis = Math.min(remainingPaid, admission.total_fees);
            const newPending = Math.max(0, admission.total_fees - paidForThis);
            
            await db.admission.update({
                where: { id: admission.id },
                data: { fees_pending: newPending }
            });
            
            remainingPaid -= paidForThis;
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.log("[PAYMENTS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
