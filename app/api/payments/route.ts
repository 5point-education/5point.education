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
        const { studentId, amount, mode, receipt_no } = body;

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

        // Update Pending Fees on the latest admission
        // Find latest admission for this student
        const latestAdmission = await db.admission.findFirst({
            where: { studentId },
            orderBy: { createdAt: 'desc' }
        });

        if (latestAdmission) {
            await db.admission.update({
                where: { id: latestAdmission.id },
                data: {
                    fees_pending: {
                        decrement: paymentAmount
                    }
                }
            });
        }

        return NextResponse.json(payment);

    } catch (error) {
        console.log("[PAYMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
