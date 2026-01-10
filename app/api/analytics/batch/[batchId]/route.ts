
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { batchId: string } }) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const batchId = params.batchId;

        // Fetch all scores for the batch
        // We can go via Exam -> Chapters -> Scores
        const scores = await db.examScore.findMany({
            where: {
                chapter: {
                    exam: {
                        batchId: batchId
                    }
                }
            },
            include: {
                chapter: {
                    include: {
                        exam: true
                    }
                }
            }
        });

        if (scores.length === 0) {
            return NextResponse.json({
                chapterPerformance: [],
                weakChapters: [],
                batchAverage: 0
            });
        }

        // Aggregate by Chapter
        const chapterMap = new Map();

        scores.forEach(score => {
            const chapId = score.chapterId;
            if (!chapterMap.has(chapId)) {
                chapterMap.set(chapId, {
                    chapterId: chapId,
                    chapterName: score.chapter.name,
                    examName: score.chapter.exam.name,
                    maxMarks: score.chapter.max_marks,
                    totalObtained: 0,
                    count: 0
                });
            }
            const entry = chapterMap.get(chapId);
            entry.totalObtained += score.marks;
            entry.count += 1;
        });

        const chapterPerformance = Array.from(chapterMap.values()).map((c: any) => ({
            chapterid: c.chapterId,
            chapterName: c.chapterName,
            examName: c.examName,
            averageScore: c.totalObtained / c.count,
            averagePercentage: (c.totalObtained / c.count / c.maxMarks) * 100
        }));

        // Weak Chapters (Bottom 5 by Avg %)
        const weakChapters = [...chapterPerformance]
            .sort((a, b) => a.averagePercentage - b.averagePercentage)
            .slice(0, 5);

        // Overall Batch Average
        const totalObtained = scores.reduce((sum, s) => sum + s.marks, 0);
        const totalMax = scores.reduce((sum, s) => sum + s.chapter.max_marks, 0);
        const batchAverage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

        return NextResponse.json({
            chapterPerformance, // Can be used for "Chapter-wise breakdown"
            weakChapters,
            batchAverage
        });

    } catch (error) {
        console.log("[ANALYTICS_BATCH_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
