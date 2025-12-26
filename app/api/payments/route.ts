import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.RECEPTIONIST)) {
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
