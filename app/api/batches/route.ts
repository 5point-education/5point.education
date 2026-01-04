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
        const { name, subject, teacherId, schedule, capacity } = body;

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
            },
        });

        return NextResponse.json(batch);

    } catch (error) {
        console.log("[BATCHES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
