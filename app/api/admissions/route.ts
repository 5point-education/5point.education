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
        const { studentId, batchId, total_fees, fees_pending } = body;

        if (!studentId || total_fees === undefined || fees_pending === undefined) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const admission = await db.admission.create({
            data: {
                studentId,
                batchId: batchId || null, // Optional for Home Tutor
                total_fees: parseFloat(total_fees),
                fees_pending: parseFloat(fees_pending),
            }
        });

        // Also update the StudentProfile with the batch/service info if needed?
        // Schema doesn't duplicate it heavily, but StudentProfile has service_type. 
        // Admission links to Batch. 
        // We assume StudentProfile is already created with correct generic info.

        return NextResponse.json(admission);

    } catch (error) {
        console.log("[ADMISSIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
