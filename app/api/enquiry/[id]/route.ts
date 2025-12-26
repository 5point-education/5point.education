import { db } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

import { EnquiryStatus, LostReason, Role } from "@prisma/client";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = params;

        const enquiry = await db.enquiry.findUnique({
            where: {
                id,
            }
        });

        if (!enquiry) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(enquiry);
    } catch (error) {
        console.log("[ENQUIRY_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}


export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.RECEPTIONIST)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = params;
        const values = await req.json();
        const { status, lost_reason, follow_up_date } = values;

        // Validation for LOST status
        if (status === EnquiryStatus.LOST && !lost_reason) {
            return new NextResponse("Lost reason is required when marking enquiry as lost", { status: 400 });
        }

        // Prepare update data
        const updateData: any = {
            status,
        };

        if (lost_reason) {
            updateData.lost_reason = lost_reason as LostReason;
        }

        if (follow_up_date) {
            updateData.follow_up_date = new Date(follow_up_date);
        }

        const enquiry = await db.enquiry.update({
            where: {
                id,
            },
            data: updateData,
        });

        return NextResponse.json(enquiry);
    } catch (error) {
        console.log("[ENQUIRY_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
