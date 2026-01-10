
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { studentId: string } }) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        let studentId = params.studentId;

        if (studentId === 'me') {
            const studentProfile = await db.studentProfile.findUnique({
                where: { userId: user.id }
            });
            if (!studentProfile) {
                return new NextResponse("Student Profile not found", { status: 404 });
            }
            studentId = studentProfile.id;
        }

        // Fetch all scores for the student
        const scores = await db.examScore.findMany({
            where: { studentId },
            include: {
                chapter: {
                    include: {
                        exam: true
                    }
                }
            }
        });

        // 1. Calculate Weak Chapters
        // Normalize scores to percentage
        const chapterPerformance = scores.map(score => ({
            chapterId: score.chapter.id,
            chapterName: score.chapter.name,
            examName: score.chapter.exam.name,
            marksObtained: score.marks,
            maxMarks: score.chapter.max_marks,
            percentage: (score.marks / score.chapter.max_marks) * 100
        }));

        // Sort by percentage ascending
        const weakChapters = [...chapterPerformance]
            .sort((a, b) => a.percentage - b.percentage)
            .slice(0, 5); // Bottom 5

        // 2. Performance Trend (Over Exams)
        // Group by Exam
        const examMap = new Map();

        scores.forEach(score => {
            const examId = score.chapter.examId;
            if (!examMap.has(examId)) {
                examMap.set(examId, {
                    examId,
                    examName: score.chapter.exam.name,
                    date: score.chapter.exam.date,
                    totalObtained: 0,
                    totalMax: 0
                });
            }
            const entry = examMap.get(examId);
            entry.totalObtained += score.marks;
            entry.totalMax += score.chapter.max_marks;
        });

        const trend = Array.from(examMap.values())
            .map((e: any) => ({
                examName: e.examName,
                date: e.date,
                percentage: e.totalMax > 0 ? (e.totalObtained / e.totalMax) * 100 : 0
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return NextResponse.json({
            weakChapters,
            trend
        });

    } catch (error) {
        console.log("[ANALYTICS_STUDENT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
