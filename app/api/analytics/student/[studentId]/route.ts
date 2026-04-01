import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { checkSubscriptionAccess } from "@/lib/subscription-guard";
import { subDays } from "date-fns";

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

            // Check subscription access for the student's own analytics
            const access = await checkSubscriptionAccess(studentProfile.id);
            if (!access.hasAccess) {
                return NextResponse.json(
                    {
                        error: "subscription_required",
                        status: access.status,
                        message: access.status === "expired"
                            ? "Your subscription has expired. Contact the reception to renew."
                            : "You need an active subscription to access analytics. Contact the reception.",
                    },
                    { status: 403 }
                );
            }
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

        // ───── Parse query params ─────
        const url = new URL(req.url);
        const timeRange = url.searchParams.get("timeRange") ?? "all";
        const subjectParam = url.searchParams.get("subject") ?? "all";

        // Compute the date cutoff for time range
        let dateCutoff: Date | null = null;
        const now = new Date();
        if (timeRange === "7d") dateCutoff = subDays(now, 7);
        else if (timeRange === "30d") dateCutoff = subDays(now, 30);
        else if (timeRange === "90d") dateCutoff = subDays(now, 90);

        // ───── Fetch student scores ─────
        const scores = await db.examScore.findMany({
            where: {
                studentId,
                ...(dateCutoff ? { chapter: { exam: { date: { gte: dateCutoff } } } } : {}),
            },
            include: {
                chapter: {
                    include: {
                        exam: { include: { batch: true } },
                    },
                },
            },
        });

        const getSubject = (s: (typeof scores)[0]) => s.chapter.exam.batch?.subject ?? "General";

        // Optional subject filter
        const filteredScores = subjectParam === "all"
            ? scores
            : scores.filter((s) => getSubject(s) === subjectParam);

        // ───── Chapter performance ─────
        const chapterWise = filteredScores.map((score) => ({
            chapterId: score.chapter.id,
            chapterName: score.chapter.name,
            examName: score.chapter.exam.name,
            subject: getSubject(score),
            date: score.chapter.exam.date,
            marksObtained: score.marks,
            maxMarks: score.chapter.max_marks,
            percentage: score.chapter.max_marks > 0 ? (score.marks / score.chapter.max_marks) * 100 : 0,
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Group by chapter name to average mastery across all exams testing the same chapter
        const chapterMasteryMap = new Map<string, { subject: string, obtained: number, total: number }>();
        filteredScores.forEach((score) => {
            const normalizedName = score.chapter.name.toLowerCase().trim();
            if (!chapterMasteryMap.has(normalizedName)) {
                // Initialize the chapter group
                chapterMasteryMap.set(normalizedName, { subject: getSubject(score), obtained: 0, total: 0 });
            }
            const stat = chapterMasteryMap.get(normalizedName)!;
            stat.obtained += score.marks;
            stat.total += score.chapter.max_marks;
        });

        const unifiedChapters = Array.from(chapterMasteryMap.entries())
            .filter(([_, stat]) => stat.total >= 5) // ensure sufficient max marks to judge mastery
            .map(([name, stat]) => {
                // Capitalize properly for UI presentation
                const titleCase = name.replace(/\b\w/g, char => char.toUpperCase());
                return {
                    chapterId: name,
                    chapterName: titleCase,
                    subject: stat.subject,
                    percentage: stat.total > 0 ? (stat.obtained / stat.total) * 100 : 0,
                };
            });

        // Separate strong (>= 60) and priority focus (< 60) so chapters don't overlap, even globally
        const strongChapters = [...unifiedChapters]
            .filter((c) => c.percentage >= 60)
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5);

        const weakChapters = [...unifiedChapters]
            .filter((c) => c.percentage < 60)
            .sort((a, b) => a.percentage - b.percentage)
            .slice(0, 5);

        // ───── Exam trend ─────
        const examMap = new Map<string, { examName: string; date: Date; totalObtained: number; totalMax: number }>();
        filteredScores.forEach((score) => {
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
                percentage: e.totalMax > 0 ? Math.round((e.totalObtained / e.totalMax) * 100 * 10) / 10 : 0,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // ───── Subject performance ─────
        const subjectMap = new Map<string, { obtained: number; total: number }>();
        filteredScores.forEach((score) => {
            const sub = getSubject(score);
            if (!subjectMap.has(sub)) subjectMap.set(sub, { obtained: 0, total: 0 });
            const entry = subjectMap.get(sub)!;
            entry.obtained += score.marks;
            entry.total += score.chapter.max_marks;
        });
        const subjectPerformance = Array.from(subjectMap.entries()).map(([name, data]) => ({
            subject: name,
            percentage: data.total > 0 ? Math.round((data.obtained / data.total) * 100) : 0,
        }));

        // ───── Aggregate Stats ─────
        let totalObtained = 0;
        let totalMax = 0;
        filteredScores.forEach((score) => {
            totalObtained += score.marks;
            totalMax += score.chapter.max_marks;
        });

        const overallAvgScore = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 10) / 10 : 0;

        // Distinct exams attempted
        const examsCompleted = new Set(filteredScores.map((s) => s.chapter.examId)).size;

        // Best subject
        const bestSubject = subjectPerformance.length > 0
            ? subjectPerformance.reduce((best, sp) => sp.percentage > best.percentage ? sp : best, subjectPerformance[0])
            : null;

        // Consistency: compute standard deviation of per-exam percentages
        const examPercentages = trend.map((t) => t.percentage);
        let consistencyLabel = "N/A";
        if (examPercentages.length >= 2) {
            const mean = examPercentages.reduce((a, b) => a + b, 0) / examPercentages.length;
            const variance = examPercentages.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / examPercentages.length;
            const stdDev = Math.sqrt(variance);
            if (stdDev <= 8) consistencyLabel = "High Consistency";
            else if (stdDev <= 15) consistencyLabel = "Moderate";
            else consistencyLabel = "Low";
        }

        // Week-over-week change: compare the most recent exam's percentage to the one before
        let weekOverWeekChange: number | null = null;
        if (trend.length >= 2) {
            const latest = trend[trend.length - 1].percentage;
            const prev = trend[trend.length - 2].percentage;
            weekOverWeekChange = Math.round((latest - prev) * 10) / 10;
        }

        // ───── Per-Batch Peer Ranking ─────
        const studentAdmissions = await db.admission.findMany({
            where: { studentId, status: "ACTIVE" },
            select: { batchId: true },
        });
        const studentBatchIds = studentAdmissions
            .map((a) => a.batchId)
            .filter((id): id is string => id !== null);

        type BatchRanking = { subject: string; rank: number; total: number };
        const batchRankings: BatchRanking[] = [];

        if (studentBatchIds.length > 0) {
            // Fetch batch info
            const batches = await db.batch.findMany({
                where: { id: { in: studentBatchIds } },
                select: { id: true, subject: true },
            });

            // Process each batch separately
            for (const batch of batches) {
                // Get all students in this batch
                const batchAdmissions = await db.admission.findMany({
                    where: { batchId: batch.id, status: "ACTIVE" },
                    select: { studentId: true },
                });
                const batchStudentIds = Array.from(new Set(batchAdmissions.map((a) => a.studentId)));

                // Get all scores for this batch's exams
                const batchScores = await db.examScore.findMany({
                    where: {
                        studentId: { in: batchStudentIds },
                        chapter: {
                            exam: {
                                batchId: batch.id,
                                ...(dateCutoff ? { date: { gte: dateCutoff } } : {}),
                            },
                        },
                    },
                    include: {
                        chapter: true,
                    },
                });

                // Compute per-student percentage within this batch
                const studentTotals = new Map<string, { obtained: number; total: number }>();
                batchScores.forEach((bs) => {
                    if (!studentTotals.has(bs.studentId)) studentTotals.set(bs.studentId, { obtained: 0, total: 0 });
                    const entry = studentTotals.get(bs.studentId)!;
                    entry.obtained += bs.marks;
                    entry.total += bs.chapter.max_marks;
                });

                const ranked = Array.from(studentTotals.entries())
                    .map(([id, data]) => ({
                        studentId: id,
                        percentage: data.total > 0 ? (data.obtained / data.total) * 100 : 0,
                    }))
                    .sort((a, b) => b.percentage - a.percentage);

                const rankIndex = ranked.findIndex((r) => r.studentId === studentId);
                if (rankIndex >= 0) {
                    batchRankings.push({
                        subject: batch.subject,
                        rank: rankIndex + 1,
                        total: batchStudentIds.length,
                    });
                }
            }
        }

        // ───── Batch Average Trend ─────
        let batchAverageTrend: { examName: string; date: Date; percentage: number }[] = [];

        if (studentBatchIds.length > 0) {
            // Get all exams in the student's batches
            const batchExams = await db.exam.findMany({
                where: {
                    batchId: { in: studentBatchIds },
                    ...(dateCutoff ? { date: { gte: dateCutoff } } : {}),
                },
                include: {
                    chapters: {
                        include: {
                            scores: true,
                        },
                    },
                },
            });

            batchAverageTrend = batchExams
                .map((exam) => {
                    // Group scores by student for this exam
                    const studentTotals = new Map<string, { obtained: number; max: number }>();
                    exam.chapters.forEach((chapter) => {
                        chapter.scores.forEach((score) => {
                            if (!studentTotals.has(score.studentId)) {
                                studentTotals.set(score.studentId, { obtained: 0, max: 0 });
                            }
                            const entry = studentTotals.get(score.studentId)!;
                            entry.obtained += score.marks;
                            entry.max += chapter.max_marks;
                        });
                    });

                    if (studentTotals.size === 0) return null;

                    const avgPercentage = Array.from(studentTotals.values()).reduce((sum, st) => {
                        return sum + (st.max > 0 ? (st.obtained / st.max) * 100 : 0);
                    }, 0) / studentTotals.size;

                    return {
                        examName: exam.name,
                        date: exam.date,
                        percentage: Math.round(avgPercentage * 10) / 10,
                    };
                })
                .filter((e): e is NonNullable<typeof e> => e !== null)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }

        // ───── All Subject Names (for filter dropdown) ─────
        // Use all scores (not filtered by subject) to build subject list
        const allSubjects = Array.from(new Set(scores.map((s) => getSubject(s))));

        // ───── Student Name (for admin/teacher views) ─────
        let studentName: string | null = null;
        if (params.studentId !== "me") {
            const student = await db.studentProfile.findUnique({
                where: { id: studentId },
                include: { user: { select: { name: true } } },
            });
            studentName = student?.user?.name ?? null;
        }

        return NextResponse.json({
            // Existing
            weakChapters,
            strongChapters,
            chapterWise,
            trend,
            subjectPerformance,
            studentName,
            // New
            allSubjects,
            stats: {
                overallAvgScore,
                examsCompleted,
                examsTarget: 50,
                consistencyLabel,
                weekOverWeekChange,
                bestSubject,
                batchRankings,
            },
            batchAverageTrend,
        });
    } catch (err) {
        console.log("[ANALYTICS_STUDENT_GET]", err);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
