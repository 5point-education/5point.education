import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import {
  generateDateRange,
  validateMonthSelection,
  getMonthlyFee,
  calculatePendingFees,
} from "@/lib/fees-utils";

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
                }
            });

            // Recalculate pending fees for this admission
            // Get updated admission with new payment
            const updatedAdmission = await db.admission.findUnique({
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

            if (updatedAdmission && updatedAdmission.batch) {
                const pendingData = await calculatePendingFees(
                    updatedAdmission,
                    admission.selectedDays
                );

                await db.admission.update({
                    where: { id: admissionId },
                    data: { fees_pending: pendingData.pendingAmount }
                });
            }

            return NextResponse.json(payment);
        }

        // LEGACY: Old payment flow (for backward compatibility)
        if (!studentId) {
            return new NextResponse("Student ID is required for legacy payments", { status: 400 });
        }

        // Create Payment (legacy - no months)
        const payment = await db.payment.create({
            data: {
                studentId,
                admissionId: admissionId || null,
                amount: paymentAmount,
                mode,
                receipt_no,
                coveredMonths: [],
            }
        });

        // Update Pending Fees on admissions - skip if already calculated during admission creation
        if (!skipFeesPendingUpdate) {
            const admissionsWithPending = await db.admission.findMany({
                where: { 
                    studentId,
                    fees_pending: { gt: 0 }
                },
                orderBy: { createdAt: 'asc' }
            });

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
