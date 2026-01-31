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
        const { studentId, batchId, total_fees, admission_charge, admission_charge_pending, fees_pending, selectedDays, discount_value, discount_type } = body;

        if (!studentId || total_fees === undefined || fees_pending === undefined) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const admission = await db.admission.create({
            data: {
                studentId,
                batchId: batchId || null, // Optional for Home Tutor
                total_fees: parseFloat(total_fees), // Batch fee (used for recurring)
                admission_charge: admission_charge ? parseFloat(admission_charge) : 0, // One-time admission charge
                admission_charge_pending: admission_charge_pending ? parseFloat(admission_charge_pending) : 0, // Pending admission charge
                fees_pending: parseFloat(fees_pending), // Pending batch fees only
                selectedDays: selectedDays ? parseInt(selectedDays) : null, // For days-wise fees
                discount_value: discount_value ? parseFloat(discount_value) : 0, // Fixed discount amount
                discount_type: discount_type || null, // Optional discount reason
            }
        });

        // Note: Recurring fees for MONTHLY/QUARTERLY batches are tracked through
        // Payment records with coveredMonths arrays, not through a separate RecurringFeePeriod model.
        // The first period payment should be created via the payments API when the user makes a payment.

        return NextResponse.json(admission);

    } catch (error) {
        console.log("[ADMISSIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
