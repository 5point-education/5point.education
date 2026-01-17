import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const batches = await db.batch.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                teacher: {
                    select: {
                        name: true
                    }
                },
                _count: {
                    select: {
                        admissions: true
                    }
                }
            }
        });

        return NextResponse.json(batches);

    } catch (error) {
        console.log("[BATCHES_GET]", error);
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
        const { name, subject, teacherId, schedule, capacity, feeModel, feeAmount, installments, daysWiseFeesEnabled, daysWiseFees } = body;

        if (!name || !subject || !teacherId || !schedule || !capacity) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const batch = await db.batch.create({
            data: {
                name,
                subject,
                teacherId,
                schedule,
                capacity: parseInt(capacity),
                feeModel: feeModel || null,
                feeAmount: feeAmount ? parseFloat(feeAmount) : null,
                installments: installments || null,
                daysWiseFeesEnabled: daysWiseFeesEnabled || false,
                daysWiseFees: daysWiseFees || null,
            },
        });

        return NextResponse.json(batch);

    } catch (error) {
        console.log("[BATCHES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
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
        const { id, name, subject, teacherId, schedule, capacity, isActive, feeModel, feeAmount, installments, daysWiseFeesEnabled, daysWiseFees } = body;

        if (!id) {
            return new NextResponse("Batch ID is required", { status: 400 });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (subject !== undefined) updateData.subject = subject;
        if (teacherId !== undefined) updateData.teacherId = teacherId;
        if (schedule !== undefined) updateData.schedule = schedule;
        if (capacity !== undefined) updateData.capacity = parseInt(capacity);
        if (isActive !== undefined) updateData.isActive = isActive;
        if (feeModel !== undefined) updateData.feeModel = feeModel || null;
        if (feeAmount !== undefined) updateData.feeAmount = feeAmount ? parseFloat(feeAmount) : null;
        if (installments !== undefined) updateData.installments = installments;
        if (daysWiseFeesEnabled !== undefined) updateData.daysWiseFeesEnabled = daysWiseFeesEnabled;
        if (daysWiseFees !== undefined) updateData.daysWiseFees = daysWiseFees;

        const batch = await db.batch.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(batch);

    } catch (error) {
        console.log("[BATCHES_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
