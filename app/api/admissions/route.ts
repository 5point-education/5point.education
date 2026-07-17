import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { normalizeSubjectKey, recalculateAdmissionBalance } from "@/lib/fee-ledger";

export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.ADMIN && user.user_metadata.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { studentId, batchId, total_fees, admission_charge, fees_pending, selectedDays, discount_value, discount_type } = body;

        if (!studentId || total_fees === undefined || fees_pending === undefined) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        let activeSubjectKey: string | null = null;
        if (batchId) {
            const batch = await db.batch.findUnique({
                where: { id: batchId },
                select: { subject: true, isActive: true },
            });
            if (!batch) return new NextResponse("Batch not found", { status: 404 });
            if (!batch.isActive) return new NextResponse("Cannot enroll a student in an inactive batch", { status: 400 });

            activeSubjectKey = normalizeSubjectKey(batch.subject);
            const duplicate = await db.admission.findFirst({
                where: {
                    studentId,
                    status: "ACTIVE",
                    activeSubjectKey,
                },
                include: { batch: { select: { name: true, subject: true } } },
            });
            if (duplicate) {
                return new NextResponse(
                    `Student is already enrolled in the ${duplicate.batch?.subject || "selected"} subject (${duplicate.batch?.name || "another batch"}). Resolve the existing enrollment before adding another batch.`,
                    { status: 409 },
                );
            }
        }

        const admissionCharge = admission_charge ? parseFloat(admission_charge) : 0;
        const admission = await db.admission.create({
            data: {
                studentId,
                batchId: batchId || null, // Optional for Home Tutor
                total_fees: parseFloat(total_fees), // Batch fee (used for recurring)
                admission_charge: admissionCharge, // One-time admission charge
                // The ledger starts with the full charge; any initial payment is recorded
                // separately through /api/payments/admission-charge.
                admission_charge_pending: admissionCharge,
                fees_pending: parseFloat(fees_pending), // Pending batch fees only
                selectedDays: selectedDays ? parseInt(selectedDays) : null, // For days-wise fees
                discount_value: discount_value ? parseFloat(discount_value) : 0, // Fixed discount amount
                discount_type: discount_type || null, // Optional discount reason
                activeSubjectKey,
            }
        });

        const canonicalPending = await recalculateAdmissionBalance(admission.id);
        if (canonicalPending !== null) admission.fees_pending = canonicalPending;

        // Note: Recurring fees for MONTHLY/QUARTERLY batches are tracked through
        // Payment records with coveredMonths arrays, not through a separate RecurringFeePeriod model.
        // The first period payment should be created via the payments API when the user makes a payment.

        return NextResponse.json(admission);

    } catch (error) {
        console.log("[ADMISSIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
