import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { PaymentKind, Role } from "@prisma/client";
import {
  generateDateRange,
  validateMonthSelection,
  getMonthlyFee,
} from "@/lib/fees-utils";
import { recalculateAdmissionBalance } from "@/lib/fee-ledger";

export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get("studentId");
        const admissionId = searchParams.get("admissionId");

        if (!studentId && !admissionId) {
            return new NextResponse("Student ID or Admission ID is required", { status: 400 });
        }

        const where: any = {};
        if (studentId) where.studentId = studentId;
        if (admissionId) where.admissionId = admissionId;

        const payments = await db.payment.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                admission: {
                    include: {
                        batch: true
                    }
                }
            }
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
        const { 
            studentId, 
            admissionId, 
            amount, 
            mode, 
            receipt_no, 
            months, // NEW: Array of month strings ["2025-01", "2025-02"]
            notes,  // NEW: Optional notes
            skipFeesPendingUpdate 
        } = body;

        const paymentAmount = parseFloat(amount);

        // NEW: Month-based payment flow
        if (admissionId && months && Array.isArray(months) && months.length > 0) {
            // Get admission with batch
            const admission = await db.admission.findUnique({
                where: { id: admissionId },
                include: {
                    batch: true,
                    payments: {
                        select: {
                            coveredMonths: true
                        }
                    }
                }
            });

            if (!admission) {
                return new NextResponse("Admission not found", { status: 404 });
            }

            if (!admission.batch) {
                return new NextResponse("Admission has no batch", { status: 400 });
            }

            // Validate month selection
            const validation = validateMonthSelection(months, admission.payments);
            if (!validation.isValid) {
                return new NextResponse(validation.error, { status: 400 });
            }

            // Calculate expected amount
            const monthlyFee = getMonthlyFee(admission.batch, admission);
            const expectedAmount = months.length * monthlyFee;

            // Allow overpayment (e.g. including admission charge) but not underpayment
            if (paymentAmount < expectedAmount - 0.01) {
                return new NextResponse(
                    `Amount mismatch. Minimum expected ₹${expectedAmount} for ${months.length} month(s) at ₹${monthlyFee}/month`,
                    { status: 400 }
                );
            }

            // Generate date range from months
            const { from, to } = generateDateRange(months);

            // Create payment with month-based data
            const payment = await db.payment.create({
                data: {
                    studentId: admission.studentId,
                    admissionId,
                    amount: paymentAmount,
                    mode,
                    receipt_no,
                    coveredMonths: months,
                    coveredFromDate: from,
                    coveredToDate: to,
                    notes: notes || null,
                    kind: PaymentKind.BATCH_FEE,
                }
            });

            await recalculateAdmissionBalance(admissionId);

            return NextResponse.json(payment);
        }

        // LEGACY: Old payment flow (for backward compatibility)
        if (!studentId) {
            return new NextResponse("Student ID is required for legacy payments", { status: 400 });
        }

        const admission = admissionId
            ? await db.admission.findUnique({ where: { id: admissionId }, include: { batch: true } })
            : null;

        if (admissionId && (!admission || admission.studentId !== studentId)) {
            return new NextResponse("Admission does not belong to this student", { status: 400 });
        }

        // Payments without covered months are intentionally kept isolated from
        // recurring batch allocations. They can be reconciled manually later.
        const payment = await db.payment.create({
            data: {
                studentId,
                admissionId: admissionId || null,
                amount: paymentAmount,
                mode,
                receipt_no,
                coveredMonths: [],
                kind: admission?.batch && (admission.batch.feeModel === "ONE_TIME" || admission.batch.feeModel === "CUSTOM")
                    ? PaymentKind.BATCH_FEE
                    : PaymentKind.LEGACY_UNALLOCATED,
            }
        });

        if (admissionId && !skipFeesPendingUpdate && payment.kind === PaymentKind.BATCH_FEE) {
            await recalculateAdmissionBalance(admissionId);
        }

        return NextResponse.json(payment);

    } catch (error: any) {
        console.log("[PAYMENTS_POST]", error);
        return new NextResponse(error.message || "Internal Error", { status: 500 });
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
        const { id, amount, mode, receipt_no, discountAmount } = body;

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
        if (discountAmount !== undefined) {
            const parsedDiscount = Number(discountAmount);
            if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
                return new NextResponse("Discount must be a non-negative number", { status: 400 });
            }
            updateData.discountAmount = parsedDiscount;
        }

        const payment = await db.payment.update({
            where: { id },
            data: updateData
        });

        if (oldPayment.admissionId && (amountDifference !== 0 || discountAmount !== undefined)) {
            if (oldPayment.kind === PaymentKind.ADMISSION_CHARGE) {
                const charges = await db.payment.aggregate({
                    where: { admissionId: oldPayment.admissionId, kind: PaymentKind.ADMISSION_CHARGE },
                    _sum: { amount: true },
                });
                const admission = await db.admission.findUnique({ where: { id: oldPayment.admissionId } });
                if (admission) {
                    await db.admission.update({
                        where: { id: admission.id },
                        data: { admission_charge_pending: Math.max(0, admission.admission_charge - (charges._sum.amount || 0)) },
                    });
                }
            } else {
                await recalculateAdmissionBalance(oldPayment.admissionId);
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

        // Delete the payment
        await db.payment.delete({
            where: { id }
        });

        if (payment.admissionId) {
            if (payment.kind === PaymentKind.ADMISSION_CHARGE) {
                const charges = await db.payment.aggregate({
                    where: { admissionId: payment.admissionId, kind: PaymentKind.ADMISSION_CHARGE },
                    _sum: { amount: true },
                });
                const admission = await db.admission.findUnique({ where: { id: payment.admissionId }, select: { admission_charge: true } });
                await db.admission.update({
                    where: { id: payment.admissionId },
                    data: { admission_charge_pending: Math.max(0, (admission?.admission_charge || 0) - (charges._sum.amount || 0)) },
                });
            } else {
                await recalculateAdmissionBalance(payment.admissionId);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.log("[PAYMENTS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
