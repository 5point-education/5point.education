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

interface BulkPaymentItem {
  admissionId: string;
  months: string[];
  discountAmount?: number; // Optional per-batch discount
}

export async function POST(req: Request) {
  try {
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (
      error ||
      !user ||
      (user.user_metadata.role !== Role.ADMIN &&
        user.user_metadata.role !== Role.RECEPTIONIST)
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      studentId,
      receipt_no,
      mode,
      notes,
      items,
    }: {
      studentId: string;
      receipt_no: string;
      mode: string;
      notes?: string;
      items: BulkPaymentItem[];
    } = body;

    // Validate required fields
    if (!studentId || !receipt_no || !mode || !items || items.length === 0) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check receipt_no is not already used
    const existingReceipt = await db.payment.findUnique({
      where: { receipt_no },
    });
    if (existingReceipt) {
      return new NextResponse(
        `Receipt number "${receipt_no}" is already used`,
        { status: 400 }
      );
    }

    // Pre-validate all items before starting the transaction
    const validatedItems: {
      admission: any;
      months: string[];
      monthlyFee: number;
      expectedAmount: number;
      discountAmount: number;
    }[] = [];

    for (const item of items) {
      if (!item.admissionId || !item.months || item.months.length === 0) {
        return new NextResponse(
          `Invalid item: each item must have admissionId and at least one month`,
          { status: 400 }
        );
      }

      const admission = await db.admission.findUnique({
        where: { id: item.admissionId },
        include: {
          batch: true,
          payments: {
            select: { coveredMonths: true },
          },
        },
      });

      if (!admission) {
        return new NextResponse(
          `Admission ${item.admissionId} not found`,
          { status: 404 }
        );
      }

      if (!admission.batch) {
        return new NextResponse(
          `Admission ${item.admissionId} has no batch`,
          { status: 400 }
        );
      }

      // Verify admission belongs to this student
      if (admission.studentId !== studentId) {
        return new NextResponse(
          `Admission ${item.admissionId} does not belong to this student`,
          { status: 400 }
        );
      }

      // Validate months aren't already paid
      const validation = validateMonthSelection(item.months, admission.payments);
      if (!validation.isValid) {
        return new NextResponse(
          `${admission.batch.name}: ${validation.error}`,
          { status: 400 }
        );
      }

      // Calculate expected amount
      const monthlyFee = getMonthlyFee(admission.batch, admission);
      const subtotal = item.months.length * monthlyFee;
      
      // Apply discount (cannot exceed subtotal)
      const discountAmount = Math.min(item.discountAmount || 0, subtotal);
      const expectedAmount = subtotal - discountAmount;

      validatedItems.push({
        admission,
        months: item.months,
        monthlyFee,
        expectedAmount,
        discountAmount,
      });
    }

    // Execute all payments in a transaction (keep it minimal to avoid timeout)
    const paymentRecords = await db.$transaction(async (tx) => {
      const payments = [];
      let totalAmount = 0;

      // For bulk payments, we append a suffix to make each receipt_no unique
      // First payment gets the base receipt_no, subsequent ones get -2, -3, etc.
      for (let i = 0; i < validatedItems.length; i++) {
        const { admission, months, expectedAmount, discountAmount } = validatedItems[i];
        const { from, to } = generateDateRange(months);

        const itemReceiptNo = i === 0 ? receipt_no : `${receipt_no}-${i + 1}`;

        const payment = await tx.payment.create({
          data: {
            studentId,
            admissionId: admission.id,
            amount: expectedAmount,
            mode,
            receipt_no: itemReceiptNo,
            coveredMonths: months,
            coveredFromDate: from,
            coveredToDate: to,
            notes: notes || null,
            discountAmount,
          },
        });

        payments.push(payment);
        totalAmount += expectedAmount;
      }

      return { payments, totalAmount, admissionIds: validatedItems.map(v => v.admission.id) };
    });

    // Recalculate pending fees AFTER transaction commits (avoids transaction timeout)
    for (const admissionId of paymentRecords.admissionIds) {
      try {
        const updatedAdmission = await db.admission.findUnique({
          where: { id: admissionId },
          include: {
            batch: true,
            payments: {
              select: { coveredMonths: true },
            },
          },
        });

        if (updatedAdmission && updatedAdmission.batch) {
          const pendingData = await calculatePendingFees(
            updatedAdmission,
            updatedAdmission.selectedDays
          );

          await db.admission.update({
            where: { id: admissionId },
            data: { fees_pending: pendingData.pendingAmount },
          });
        }
      } catch (err) {
        console.error(`Failed to recalculate pending fees for admission ${admissionId}:`, err);
        // Don't throw - payment was recorded successfully
      }
    }

    return NextResponse.json({
      success: true,
      paymentsCreated: paymentRecords.payments.length,
      totalAmount: paymentRecords.totalAmount,
      payments: paymentRecords.payments,
    });
  } catch (error: any) {
    console.log("[PAYMENTS_BULK_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
