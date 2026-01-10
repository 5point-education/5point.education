
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        // body is array of { studentId, chapterId, marks }
        const scores = body;

        await db.$transaction(
            scores.map((score: any) =>
                (db as any).examScore.upsert({
                    where: {
                        chapterId_studentId: {
                            chapterId: score.chapterId,
                            studentId: score.studentId
                        }
                    },
                    update: {
                        marks: score.marks
                    },
                    create: {
                        chapterId: score.chapterId,
                        studentId: score.studentId,
                        marks: score.marks
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
