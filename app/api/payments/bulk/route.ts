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
      const expectedAmount = item.months.length * monthlyFee;

      validatedItems.push({
        admission,
        months: item.months,
        monthlyFee,
        expectedAmount,
      });
    }

    // Execute all payments in a transaction
    const result = await db.$transaction(async (tx) => {
      const payments = [];
      let totalAmount = 0;

      // For bulk payments, we append a suffix to make each receipt_no unique
      // First payment gets the base receipt_no, subsequent ones get -2, -3, etc.
      for (let i = 0; i < validatedItems.length; i++) {
        const { admission, months, monthlyFee, expectedAmount } = validatedItems[i];
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
          },
        });

        // Recalculate pending fees for this admission
        const updatedAdmission = await tx.admission.findUnique({
          where: { id: admission.id },
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
            admission.selectedDays
          );

          await tx.admission.update({
            where: { id: admission.id },
            data: { fees_pending: pendingData.pendingAmount },
          });
        }

        payments.push(payment);
        totalAmount += expectedAmount;
      }

      return { payments, totalAmount };
    });

    return NextResponse.json({
      success: true,
      paymentsCreated: result.payments.length,
      totalAmount: result.totalAmount,
      payments: result.payments,
    });
  } catch (error: any) {
    console.log("[PAYMENTS_BULK_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
