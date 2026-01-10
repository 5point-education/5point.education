
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { batchId, name, date, chapters } = body;

        if (!batchId || !name || !date || !chapters || chapters.length === 0) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const total_marks = chapters.reduce((sum: number, ch: any) => sum + Number(ch.max_marks), 0);

        const exam = await db.exam.create({
            data: {
                batchId,
                name,
                date: new Date(date),
                total_marks,
                chapters: {
                    create: chapters.map((ch: any) => ({
                        name: ch.name,
                        max_marks: Number(ch.max_marks),
                        order: ch.order,
                    })),
                },
            },
        });

        // Revalidate the exams list page so the new exam shows up immediately
        revalidatePath(`/dashboard/teacher/batch/${batchId}/exams`);

        return NextResponse.json(exam);
    } catch (error) {
        console.log("[EXAMS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const batchId = searchParams.get("batchId");

        if (!batchId) {
            return new NextResponse("Batch ID missing", { status: 400 });
        }

        const exams = await db.exam.findMany({
            where: { batchId },
            include: {
                chapters: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(exams);
    } catch (error) {
        console.log("[EXAMS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
