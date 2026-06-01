
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

        // 1. Upsert all individual chapter scores
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

        // 2. Aggregate scores and update the Result table for each student
        // Get unique students involved in this update
        const studentIds = Array.from(new Set(scores.map((s: any) => s.studentId))) as string[];

        // We can do this in parallel or a second transaction
        await db.$transaction(async (tx) => {
            for (const studentId of studentIds) {
                // Calculate total score for this student for this exam
                const totalScore = await tx.examScore.aggregate({
                    where: {
                        studentId: studentId,
                        chapter: {
                            examId: params.id
                        }
                    },
                    _sum: {
                        marks: true
                    }
                });

                const finalScore = totalScore._sum.marks || 0;

                // Upsert the Result record
                await tx.result.upsert({
                    where: {
                        examId_studentId: {
                            examId: params.id,
                            studentId: studentId
                        }
                    },
                    create: {
                        examId: params.id,
                        studentId: studentId,
                        score: finalScore,
                        remarks: null // Default to null for new results
                    },
                    update: {
                        score: finalScore
                        // We do NOT update remarks here, preserving any existing remarks
                    }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log("[EXAM_SCORES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
