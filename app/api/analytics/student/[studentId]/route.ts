import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(req: Request, { params }: { params: { studentId: string } }) {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const role = (user.user_metadata?.role as string) ?? "";
        let studentId = params.studentId;

        if (studentId === "me") {
            if (role !== Role.STUDENT) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
            const studentProfile = await db.studentProfile.findUnique({
                where: { userId: user.id },
            });
            if (!studentProfile) {
                return new NextResponse("Student Profile not found", { status: 404 });
            }
            studentId = studentProfile.id;
        } else {
            // Viewing another student: only teachers can do this, and only for their batches
            if (role === Role.TEACHER) {
                const teacherBatchIds = await db.batch.findMany({
                    where: { teacherId: user.id },
                    select: { id: true },
                });
                const batchIdSet = new Set(teacherBatchIds.map((b) => b.id));
                const admission = await db.admission.findFirst({
                    where: {
                        studentId,
                        batchId: { in: Array.from(batchIdSet) },
                        status: "ACTIVE",
                    },
                });
                if (!admission) {
                    return new NextResponse("You can only view analytics for students in your batches", { status: 403 });
                }
            } else if (role === Role.STUDENT) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
            // Admin/reception can view any student (no extra check)
        }

        const scores = await db.examScore.findMany({
            where: { studentId },
            include: {
                chapter: {
                    include: {
                        exam: { include: { batch: true } },
                    },
                },
            },
        });

        const subject = (s: (typeof scores)[0]) => s.chapter.exam.batch?.subject ?? "General";

        const chapterPerformance = scores.map((score) => ({
            chapterId: score.chapter.id,
            chapterName: score.chapter.name,
            examName: score.chapter.exam.name,
            subject: subject(score),
            date: score.chapter.exam.date,
            marksObtained: score.marks,
            maxMarks: score.chapter.max_marks,
            percentage: score.chapter.max_marks > 0 ? (score.marks / score.chapter.max_marks) * 100 : 0,
        }));

        const weakChapters = [...chapterPerformance]
            .filter((c) => c.maxMarks >= 5)
            .sort((a, b) => a.percentage - b.percentage)
            .slice(0, 5);

        const strongChapters = [...chapterPerformance]
            .filter((c) => c.maxMarks >= 5)
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5);

        const chapterWise = [...chapterPerformance].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const examMap = new Map<string, { examName: string; date: Date; totalObtained: number; totalMax: number }>();
        scores.forEach((score) => {
            const examId = score.chapter.examId;
            if (!examMap.has(examId)) {
                examMap.set(examId, {
                    examName: score.chapter.exam.name,
                    date: score.chapter.exam.date,
                    totalObtained: 0,
                    totalMax: 0,
                });
            }
            const entry = examMap.get(examId)!;
            entry.totalObtained += score.marks;
            entry.totalMax += score.chapter.max_marks;
        });

        const trend = Array.from(examMap.values())
            .map((e) => ({
                examName: e.examName,
                date: e.date,
                percentage: e.totalMax > 0 ? (e.totalObtained / e.totalMax) * 100 : 0,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const subjectMap = new Map<string, { obtained: number; total: number }>();
        scores.forEach((score) => {
            const sub = subject(score);
            if (!subjectMap.has(sub)) subjectMap.set(sub, { obtained: 0, total: 0 });
            const entry = subjectMap.get(sub)!;
            entry.obtained += score.marks;
            entry.total += score.chapter.max_marks;
        });
        const subjectPerformance = Array.from(subjectMap.entries()).map(([name, data]) => ({
            subject: name,
            percentage: data.total > 0 ? Math.round((data.obtained / data.total) * 100) : 0,
        }));

        let studentName: string | null = null;
        if (params.studentId !== "me") {
            const student = await db.studentProfile.findUnique({
                where: { id: studentId },
                include: { user: { select: { name: true } } },
            });
            studentName = student?.user?.name ?? null;
        }

        return NextResponse.json({
            weakChapters,
            strongChapters,
            chapterWise,
            trend,
            subjectPerformance,
            studentName,
        });
    } catch (err) {
        console.log("[ANALYTICS_STUDENT_GET]", err);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
