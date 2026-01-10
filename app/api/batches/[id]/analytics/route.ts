import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || (user.user_metadata.role !== Role.TEACHER && user.user_metadata.role !== Role.ADMIN)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const exams = await db.exam.findMany({
            where: { batchId: params.id },
            include: {
                chapters: {
                    include: {
                        scores: true
                    }
                }
            }
        });

        const chapterStats: { id: string; name: string; examName: string; totalPct: number; count: number }[] = [];

        exams.forEach(exam => {
            exam.chapters.forEach(ch => {
                let totalPct = 0;
                let count = 0;
                ch.scores.forEach(s => {
                    totalPct += (s.marks / ch.max_marks) * 100;
                    count++;
                });
                if (count > 0) {
                    chapterStats.push({
                        id: ch.id,
                        name: ch.name,
                        examName: exam.name,
                        totalPct: totalPct,
                        count: count,
                    });
                }
            });
        });

        const weakChaptersBatch = chapterStats
            .map(s => ({ ...s, avgPercentage: s.totalPct / s.count }))
            .sort((a, b) => a.avgPercentage - b.avgPercentage)
            .slice(0, 5);

        return NextResponse.json({
            weakChaptersBatch,
            totalExams: exams.length
        });
    } catch (error) {
        console.log("[BATCH_ANALYTICS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
