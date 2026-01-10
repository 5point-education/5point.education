import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.TEACHER && user.user_metadata.role !== Role.ADMIN)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get batches assigned to the current teacher
        const batches = await db.batch.findMany({
            where: {
                teacherId: user.id,
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
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        // Transform the data to match the expected interface
        const transformedBatches = batches.map(batch => ({
            id: batch.id,
            name: batch.name,
            subject: batch.subject,
            schedule: batch.schedule,
            capacity: batch.capacity,
            studentCount: batch._count.admissions,
            teacherName: batch.teacher.name
        }));

        return NextResponse.json(transformedBatches);

    } catch (error) {
        console.log("[TEACHER_BATCHES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}