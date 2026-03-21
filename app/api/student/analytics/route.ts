import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { AdmissionStatus, Role } from "@prisma/client";

export async function GET(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user || user.user_metadata.role !== Role.STUDENT) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 1. Get Student Profile & Active Batch
        const studentProfile = await db.studentProfile.findUnique({
            where: { userId: user.id },
            include: {
                admissions: {
                    where: { status: AdmissionStatus.ACTIVE },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: { batch: true }
                }
            }
        });

        if (!studentProfile) {
            return new NextResponse("Student profile not found", { status: 404 });
        }

        // 2. Fetch All Scores (Inlined logic)
        const scores = await (db as any).examScore.findMany({
            where: { studentId: studentProfile.id },
            include: {
                chapter: {
                    include: {
                        exam: {
                            include: { batch: true }
                        }
                    }
                }
            }
        });

        if (scores.length === 0) {
            return NextResponse.json({
                weakChapters: [],
                performanceTrend: [],
                subjectPerformance: [],
                upcomingSchedule: studentProfile.admissions[0]?.batch?.schedule || "No active schedule"
            });
        }

        // --- Logic: Weak Chapters ---
        // Filter out chapters with very low max marks (e.g., < 10) to avoid skewed data from mini-tests
        const SIGNIFICANT_MARKS_THRESHOLD = 5;

        const chapterPerformance = scores.map((s: any) => ({
            chapterId: s.chapter.id,
            chapterName: s.chapter.name,
            examName: s.chapter.exam.name,
            subject: s.chapter.exam.batch?.subject || "General",
            percentage: s.chapter.max_marks > 0 ? (s.marks / s.chapter.max_marks) * 100 : 0,
            marks: s.marks,
            max: s.chapter.max_marks
        }));

        const weakChapters = [...chapterPerformance]
            .filter(c => c.max > SIGNIFICANT_MARKS_THRESHOLD)
            .sort((a, b) => a.percentage - b.percentage)
            .slice(0, 5); // Bottom 5

        // --- Logic: Subject Mastery ---
        const subjectMap = new Map<string, { obtained: number, total: number }>();

        scores.forEach((s: any) => {
            const subject = s.chapter.exam.batch?.subject || "General";
            if (!subjectMap.has(subject)) {
                subjectMap.set(subject, { obtained: 0, total: 0 });
            }
            const entry = subjectMap.get(subject)!;
            entry.obtained += s.marks;
            entry.total += s.chapter.max_marks;
        });

        const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, data]) => ({
            subject,
            percentage: data.total > 0 ? Math.round((data.obtained / data.total) * 100) : 0,
            totalExams: scores.filter((s: any) => (s.chapter.exam.batch?.subject || "General") === subject).length // Rough count of chapter-exams
        }));

        // --- Logic: Performance Trend ---
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
                percentage: e.totalMax > 0 ? Number(((e.totalObtained / e.totalMax) * 100).toFixed(1)) : 0
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return NextResponse.json({
            weakChapters,
            performanceTrend,
            subjectPerformance,
            upcomingSchedule: studentProfile.admissions[0]?.batch?.schedule || "No active schedule"
        });

    } catch (error) {
        console.log("[STUDENT_ANALYTICS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
