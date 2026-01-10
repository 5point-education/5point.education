
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const scores = await db.examScore.findMany({
            where: {
                chapter: {
                    examId: params.id
                }
            },
            include: {
                student: {
                    include: {
                        user: true
                    }
                }
            }
        });

        return NextResponse.json(scores);
    } catch (error) {
        console.log("[EXAM_SCORES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { scores } = body; // scores: { studentId, chapterId, marks }[]

        if (!scores || !Array.isArray(scores)) {
            return new NextResponse("Invalid data format", { status: 400 });
        }

        // Use transaction to bulk upsert
        await db.$transaction(
            scores.map((score: any) =>
                db.examScore.upsert({
                    where: {
                        chapterId_studentId: {
                            chapterId: score.chapterId,
                            studentId: score.studentId
                        }
                    },
                    update: {
                        marks: Number(score.marks)
                    },
                    create: {
                        chapterId: score.chapterId,
                        studentId: score.studentId,
                        marks: Number(score.marks)
                    }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log("[EXAM_SCORES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
