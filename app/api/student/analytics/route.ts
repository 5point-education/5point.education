import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";


export async function GET(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || user.user_metadata.role !== Role.STUDENT) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 1. Get Student Profile ID
        const studentProfile = await db.studentProfile.findUnique({
            where: { userId: user.id }
        });

        if (!studentProfile) {
            return new NextResponse("Student profile not found", { status: 404 });
        }


        // 2. Fetch Analytics (Inlined logic)
        const scores = await (db as any).examScore.findMany({
            where: { studentId: studentProfile.id },
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
                weakChapters: [],
                performanceTrend: [],
                subjectPerformance: []
            });
        }

        // 1. Weak Chapters (Lowest %)
        const chapterPerformance = scores.map((s: any) => ({
            chapterName: s.chapter.name,
            examName: s.chapter.exam.name,
            percentage: (s.marks / s.chapter.max_marks) * 100,
            marks: s.marks,
            max: s.chapter.max_marks
        }));

        const weakChapters = [...chapterPerformance]
            .sort((a: any, b: any) => a.percentage - b.percentage)
            .slice(0, 5);

        // 2. Trend (Exam vs Score %)
        const examMap = new Map<string, { totalObtained: number, totalMax: number, date: Date, name: string }>();

        scores.forEach((s: any) => {
            const examId = s.chapter.examId;
            if (!examMap.has(examId)) {
                examMap.set(examId, {
                    totalObtained: 0,
                    totalMax: 0,
                    date: s.chapter.exam.date,
                    name: s.chapter.exam.name
                });
            }
            const entry = examMap.get(examId)!;
            entry.totalObtained += s.marks;
            entry.totalMax += s.chapter.max_marks;
        });

        const performanceTrend = Array.from(examMap.values())
            .map(e => ({
                examName: e.name,
                date: e.date,
                percentage: e.totalMax > 0 ? (e.totalObtained / e.totalMax) * 100 : 0
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        return NextResponse.json({
            weakChapters,
            performanceTrend,
        });

    } catch (error) {
        console.log("[STUDENT_ANALYTICS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
