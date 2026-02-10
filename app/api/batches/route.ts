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
        const { name, subject, classLevel, board, teacherId, schedule, capacity, feeModel, feeAmount, installments, daysWiseFeesEnabled, daysWiseFees } = body;

        if (!name || !subject || !teacherId || !schedule ) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const batchData: any = {
            name,
            subject,
            classLevel: classLevel || null,
            board: board || null,
            teacherId,
            schedule,
            feeModel: feeModel || null,
            feeAmount: feeAmount ? parseFloat(feeAmount) : null,
            installments: installments || null,
            daysWiseFeesEnabled: daysWiseFeesEnabled || false,
            daysWiseFees: daysWiseFees || null,
        };
        
        if (capacity) {
            batchData.capacity = parseInt(capacity);
        } else {
            batchData.capacity = null;
        }

        const batch = await db.batch.create({
            data: batchData,
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
        const { id, name, subject, classLevel, board, teacherId, schedule, capacity, isActive, feeModel, feeAmount, installments, daysWiseFeesEnabled, daysWiseFees, startDate, endDate } = body;

        if (!id) {
            return new NextResponse("Batch ID is required", { status: 400 });
        }

        // Get current batch to check if we're archiving
        const currentBatch = await db.batch.findUnique({
            where: { id },
            include: {
                admissions: true
            }
        });

        if (!currentBatch) {
            return new NextResponse("Batch not found", { status: 404 });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (subject !== undefined) updateData.subject = subject;
        if (classLevel !== undefined) updateData.classLevel = classLevel || null;
        if (board !== undefined) updateData.board = board || null;
        if (teacherId !== undefined) updateData.teacherId = teacherId;
        if (schedule !== undefined) updateData.schedule = schedule;
        if (capacity !== undefined) updateData.capacity = capacity ? parseInt(capacity) : null;
        if (feeModel !== undefined) updateData.feeModel = feeModel || null;
        if (feeAmount !== undefined) updateData.feeAmount = feeAmount ? parseFloat(feeAmount) : null;
        if (installments !== undefined) updateData.installments = installments;
        if (daysWiseFeesEnabled !== undefined) updateData.daysWiseFeesEnabled = daysWiseFeesEnabled;
        if (daysWiseFees !== undefined) updateData.daysWiseFees = daysWiseFees;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

        // Handle archiving: if isActive is being set to false, set endDate if not already set
        if (isActive !== undefined) {
            updateData.isActive = isActive;
            
            // If archiving (setting to false) and endDate not already set, set it to today
            if (isActive === false && !currentBatch.endDate && endDate === undefined) {
                updateData.endDate = new Date();
            }
        }

        const batch = await db.batch.update({
            where: { id },
            data: updateData,
        });

        // If batch was archived, update all active admissions to COMPLETED
        if (isActive === false && currentBatch.isActive) {
            await db.admission.updateMany({
                where: {
                    batchId: id,
                    status: "ACTIVE"
                },
                data: {
                    status: "COMPLETED",
                    endDate: batch.endDate || new Date()
                }
            });
        }

        return NextResponse.json(batch);

    } catch (error) {
        console.log("[BATCHES_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
