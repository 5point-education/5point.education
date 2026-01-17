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
        const { periodId, amount, mode, receipt_no } = body;

        if (!periodId || !amount || !mode || !receipt_no) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Get the period to find the student
        const period = await db.recurringFeePeriod.findUnique({
            where: { id: periodId },
            include: {
                admission: {
                    select: {
                        studentId: true
                    }
                }
            }
        });

        if (!period) {
            return new NextResponse("Period not found", { status: 404 });
        }

        if (period.isPaid) {
            return new NextResponse("Period already paid", { status: 400 });
        }

        // Create payment
        const payment = await db.payment.create({
            data: {
                studentId: period.admission.studentId,
                amount: parseFloat(amount),
                mode,
                receipt_no,
            }
        });

        // Update the period as paid
        await db.recurringFeePeriod.update({
            where: { id: periodId },
            data: {
                isPaid: true,
                paidAt: new Date(),
                paymentId: payment.id
            }
        });

        return NextResponse.json({ 
            success: true, 
            payment,
            message: "Payment recorded successfully" 
        });

    } catch (error: any) {
        console.log("[RECURRING_FEES_PAY]", error);
        
        // Handle unique constraint violation for receipt_no
        if (error.code === 'P2002') {
            return new NextResponse("Receipt number already exists", { status: 400 });
        }
        
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// Mark period as unpaid (for corrections)
export async function DELETE(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const periodId = searchParams.get("periodId");

        if (!periodId) {
            return new NextResponse("Period ID is required", { status: 400 });
        }

        const period = await db.recurringFeePeriod.findUnique({
            where: { id: periodId }
        });

        if (!period) {
            return new NextResponse("Period not found", { status: 404 });
        }

        // If there's an associated payment, delete it
        if (period.paymentId) {
            await db.payment.delete({
                where: { id: period.paymentId }
            });
        }

        // Mark period as unpaid
        await db.recurringFeePeriod.update({
            where: { id: periodId },
            data: {
                isPaid: false,
                paidAt: null,
                paymentId: null
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.log("[RECURRING_FEES_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
