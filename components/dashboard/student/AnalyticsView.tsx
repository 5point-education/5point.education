"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
    Loader2, Lock, Crown, Clock, AlertTriangle,
    Star, CheckSquare, BarChart3, Target, TrendingUp, TrendingDown,
    Sigma, Atom, FlaskConical, BookOpen, Brain, Award, Info,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

/* ──────────────────────── Types ──────────────────────── */

type ChapterRow = {
    chapterId: string;
    chapterName: string;
    examName: string;
    subject: string;
    date: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
};

type BatchRanking = { subject: string; rank: number; total: number };

type Stats = {
    overallAvgScore: number;
    examsCompleted: number;
    examsTarget: number;
    consistencyLabel: string;
    weekOverWeekChange: number | null;
    bestSubject: { subject: string; percentage: number } | null;
    batchRankings: BatchRanking[];
};

type TrendPoint = { examName: string; date: string; percentage: number };
type SubjectPerf = { subject: string; percentage: number };

type AnalyticsData = {
    weakChapters: ChapterRow[];
    strongChapters: ChapterRow[];
    chapterWise: ChapterRow[];
    trend: TrendPoint[];
    subjectPerformance: SubjectPerf[];
    studentName: string | null;
    allSubjects: string[];
    stats: Stats;
    batchAverageTrend: TrendPoint[];
};

type SubscriptionError = {
    error: string;
    status: string;
    message: string;
} | null;

/* ──────────────────────── Helpers ──────────────────────── */

/** Pick a small icon that hints at the subject */
function SubjectIcon({ subject, className }: { subject: string; className?: string }) {
    const s = subject.toLowerCase();
    if (s.includes("math") || s.includes("algebra") || s.includes("calcul"))
        return <Sigma className={className} />;
    if (s.includes("phys") || s.includes("nuclear") || s.includes("particle"))
        return <Atom className={className} />;
    if (s.includes("chem") || s.includes("organic") || s.includes("molecular"))
        return <FlaskConical className={className} />;
    if (s.includes("logic") || s.includes("ethic") || s.includes("reason"))
        return <Brain className={className} />;
    return <BookOpen className={className} />;
}

/* Custom tooltip for the area chart */
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl bg-white px-4 py-3 shadow-lg border border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-1.5">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2 text-sm">
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.stroke ?? p.color }}
                    />
                    <span className="text-slate-700 font-medium">{p.name}:</span>
                    <span className="font-semibold text-slate-900">{p.value?.toFixed(1)}%</span>
                </div>
            ))}
        </div>
    );
}

/* ──────────────────────── Main Component ──────────────────────── */

export function AnalyticsView() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [subjectFilter, setSubjectFilter] = useState("all");
    const [timeRange, setTimeRange] = useState("all");
    const [subscriptionError, setSubscriptionError] = useState<SubscriptionError>(null);
    const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (timeRange !== "all") params.set("timeRange", timeRange);
            if (subjectFilter !== "all") params.set("subject", subjectFilter);
            const qs = params.toString();

            const res = await fetch(`/api/analytics/student/me${qs ? `?${qs}` : ""}`);
            if (res.status === 403) {
                const json = await res.json();
                if (json.error === "subscription_required") {
                    setSubscriptionError(json);
                    // also fetch subscription info
                    try {
                        const subRes = await fetch("/api/student/subscription");
                        if (subRes.ok) setSubscriptionInfo(await subRes.json());
                    } catch { }
                    return;
                }
            }
            if (res.ok) {
                const json: AnalyticsData = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    }, [timeRange, subjectFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /* ───── Loading ───── */
    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    /* ───── Subscription Lock ───── */
    if (subscriptionError) {
        const sub = subscriptionInfo?.subscription;
        return (
            <div className="space-y-8 max-w-3xl mx-auto py-16">
                <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                    <CardContent className="p-8 md:p-12 text-center">
                        <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                            <Lock className="h-10 w-10 text-red-500 dark:text-red-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-3">
                            Analytics Access Restricted
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-base max-w-lg mx-auto mb-8">
                            {subscriptionError.message}
                        </p>

                        {sub && (
                            <div className="inline-flex flex-col items-center gap-3 p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
                                <div className="flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-amber-500" />
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                        {sub.tierName} Plan
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium dark:bg-red-900/40 dark:text-red-400">
                                        Expired
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        Started: {format(new Date(sub.startDate), 'MMM d, yyyy')}
                                    </span>
                                    {sub.endDate && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            Expired: {format(new Date(sub.endDate), 'MMM d, yyyy')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 max-w-md mx-auto">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800 dark:text-amber-300 text-left">
                                    Please visit the <strong>reception desk</strong> to renew your subscription and regain access to performance analytics, chapter insights, and exam trends.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    /* ───── No data ───── */
    if (!data) {
        return <div className="text-center py-20 text-muted-foreground">No analytics data available.</div>;
    }

    const {
        stats,
        trend,
        subjectPerformance,
        strongChapters,
        weakChapters,
        chapterWise,
        allSubjects,
        batchAverageTrend,
    } = data;

    /* Merge student trend & batch trend for the combined chart */
    const mergedTrend = trend.map((t) => {
        const batch = batchAverageTrend.find((b) => b.examName === t.examName);
        return {
            examName: t.examName,
            yourProgress: t.percentage,
            average: batch?.percentage ?? null,
        };
    });

    /* ───── Render ───── */
    return (
        <div className="space-y-7 max-w-[1280px] mx-auto">
            {/* ═══ Header + Filters ═══ */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">
                        Academic Performance
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Deep dive into your learning progress and competitive standing.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Subject filter */}
                    <div className="space-y-1">
                        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Subject</span>
                        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                            <SelectTrigger className="w-[170px] h-9 rounded-lg bg-white border-slate-200 text-sm shadow-sm">
                                <SelectValue placeholder="All Disciplines" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Disciplines</SelectItem>
                                {allSubjects.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Time range filter */}
                    <div className="space-y-1">
                        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Time Range</span>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[150px] h-9 rounded-lg bg-white border-slate-200 text-sm shadow-sm">
                                <SelectValue placeholder="All Time" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                                <SelectItem value="90d">Last 90 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* ═══ Stat Cards ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Overall Avg */}
                <StatCard
                    label="Overall Avg Score"
                    value={`${stats.overallAvgScore}%`}
                    subtitle={
                        stats.weekOverWeekChange !== null
                            ? `${stats.weekOverWeekChange >= 0 ? "↗" : "↘"} ${stats.weekOverWeekChange >= 0 ? "+" : ""}${stats.weekOverWeekChange}% from last exam`
                            : "—"
                    }
                    subtitleColor={
                        stats.weekOverWeekChange !== null
                            ? stats.weekOverWeekChange >= 0 ? "text-emerald-600" : "text-red-500"
                            : "text-slate-400"
                    }
                    icon={<Star className="h-5 w-5" />}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                    tooltip="Weighted average of all your exam scores (total marks obtained ÷ total max marks × 100)."
                />

                {/* Exams Completed */}
                <StatCard
                    label="Exams Completed"
                    value={String(stats.examsCompleted)}
                    subtitle={`Target: ${stats.examsTarget} per quarter`}
                    icon={<CheckSquare className="h-5 w-5" />}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                    tooltip="Total number of distinct exams you have attempted in the selected time period."
                />

                {/* Peer Ranking — per batch */}
                <StatCard
                    label="Peer Ranking"
                    value={
                        stats.batchRankings.length > 0
                            ? (
                                <div className="flex flex-col gap-0.5">
                                    {stats.batchRankings.map((br) => (
                                        <div key={br.subject} className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold text-slate-800">
                                                {br.rank}<span className="text-sm font-normal text-slate-400">/{br.total}</span>
                                            </span>
                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide truncate max-w-[80px]">
                                                {br.subject}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )
                            : "—"
                    }
                    subtitle={
                        stats.batchRankings.length > 0
                            ? `Across ${stats.batchRankings.length} subject${stats.batchRankings.length > 1 ? "s" : ""}`
                            : "—"
                    }
                    icon={<BarChart3 className="h-5 w-5" />}
                    iconBg="bg-orange-50"
                    iconColor="text-orange-500"
                    tooltip="Your rank among all students in each batch/subject. Lower is better — rank 1 means you're the top performer."
                />

                {/* Best Subject */}
                <StatCard
                    label="Best Subject"
                    value={
                        stats.bestSubject
                            ? (
                                <span className="flex items-center gap-2">
                                    <SubjectIcon subject={stats.bestSubject.subject} className="h-5 w-5 text-emerald-500" />
                                    <span className="truncate max-w-[120px]">{stats.bestSubject.subject}</span>
                                </span>
                            )
                            : "—"
                    }
                    subtitle={
                        stats.bestSubject
                            ? (
                                <span className="flex items-center gap-1.5">
                                    <span className="font-semibold text-emerald-600">{stats.bestSubject.percentage}%</span>
                                    <span>accuracy</span>
                                </span>
                            )
                            : "—"
                    }
                    icon={<Award className="h-5 w-5" />}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                    tooltip="The subject where you have the highest overall percentage score."
                />
            </div>

            {/* ═══ Charts Row ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Performance Trend — takes 3/5 */}
                <Card className="lg:col-span-3 rounded-2xl border border-slate-200 shadow-sm bg-white">
                    <CardHeader className="pb-2 px-6 pt-5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-slate-800">Performance Trend</CardTitle>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                    Your Progress
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                    Average
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[280px] px-2 pb-4">
                        {mergedTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mergedTrend} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                                    <defs>
                                        <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="examName"
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        unit="%"
                                        domain={[0, 100]}
                                        tickLine={false}
                                        axisLine={false}
                                        width={36}
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="average"
                                        name="Average"
                                        stroke="#cbd5e1"
                                        strokeWidth={2}
                                        strokeDasharray="6 4"
                                        fill="none"
                                        dot={false}
                                        connectNulls
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="yourProgress"
                                        name="Your Progress"
                                        stroke="#2563eb"
                                        strokeWidth={2.5}
                                        fill="url(#progressGrad)"
                                        activeDot={{ r: 5, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                Not enough exam data for trend.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Subject-wise Accuracy — 2/5 */}
                <Card className="lg:col-span-2 rounded-2xl border border-slate-200 shadow-sm bg-white">
                    <CardHeader className="px-6 pt-5 pb-3">
                        <CardTitle className="text-lg font-semibold text-slate-800">Subject-wise Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-5 space-y-5">
                        {subjectPerformance.length > 0 ? (
                            <>
                                {subjectPerformance
                                    .sort((a, b) => b.percentage - a.percentage)
                                    .map((sp) => (
                                        <div key={sp.subject} className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                                                    {sp.subject}
                                                </span>
                                                <span className={`text-sm font-bold ${sp.percentage >= 80 ? "text-emerald-600" : sp.percentage >= 60 ? "text-blue-600" : "text-amber-600"}`}>
                                                    {sp.percentage}%
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ease-out ${sp.percentage >= 80 ? "bg-blue-600" : sp.percentage >= 60 ? "bg-blue-500" : "bg-blue-400"}`}
                                                    style={{ width: `${Math.min(100, sp.percentage)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </>
                        ) : (
                            <div className="text-sm text-slate-400 text-center py-8">No subject data yet.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ═══ Insights Row ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Strongest Chapters */}
                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white border-l-4 border-l-emerald-400 overflow-hidden">
                    <CardHeader className="px-6 pt-5 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-50">
                                <Star className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold text-slate-800">Strongest Chapters</CardTitle>
                                <CardDescription className="text-xs text-slate-400 mt-0.5">
                                    Excellent performance maintained over time
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-5">
                        {strongChapters.length > 0 ? (
                            <div className="space-y-3 mt-2">
                                {strongChapters.slice(0, 4).map((ch, i) => (
                                    <div
                                        key={ch.chapterId + i}
                                        className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <SubjectIcon subject={ch.subject} className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{ch.chapterName}</span>
                                        </div>
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                            {Math.round(ch.percentage)}% Mastery
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-sm text-slate-400">No data yet.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Priority Focus Areas */}
                <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white border-l-4 border-l-amber-400 overflow-hidden">
                    <CardHeader className="px-6 pt-5 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-50">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold text-slate-800">Priority Focus Areas</CardTitle>
                                <CardDescription className="text-xs text-slate-400 mt-0.5">
                                    Recommended for revision this week
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-5">
                        {weakChapters.length > 0 ? (
                            <div className="space-y-3 mt-2">
                                {weakChapters.slice(0, 4).map((ch, i) => (
                                    <div
                                        key={ch.chapterId + i}
                                        className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <SubjectIcon subject={ch.subject} className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{ch.chapterName}</span>
                                        </div>
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                                            {Math.round(ch.percentage)}% Mastery
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-sm text-slate-400">No data yet.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ═══ Chapter-wise Performance Table ═══ */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden mt-2">
                <CardHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100">
                            <BookOpen className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">
                                Chapter-wise Performance
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 mt-0.5 font-medium">
                                All chapters you have attempted, with scores.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {chapterWise && chapterWise.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                                        <TableHead className="font-semibold text-slate-600 uppercase text-[11px] tracking-wider py-4 pl-6">Chapter</TableHead>
                                        <TableHead className="font-semibold text-slate-600 uppercase text-[11px] tracking-wider py-4">Exam</TableHead>
                                        <TableHead className="font-semibold text-slate-600 uppercase text-[11px] tracking-wider py-4">Subject</TableHead>
                                        <TableHead className="font-semibold text-slate-600 uppercase text-[11px] tracking-wider py-4 whitespace-nowrap">Date</TableHead>
                                        <TableHead className="font-semibold text-slate-600 uppercase text-[11px] tracking-wider py-4 text-right">Marks</TableHead>
                                        <TableHead className="font-semibold text-slate-600 uppercase text-[11px] tracking-wider py-4 pr-6 text-right">%</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {chapterWise.map((row, idx) => (
                                        <TableRow key={`${row.chapterId}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="font-medium text-slate-800 py-3.5 pl-6">
                                                {row.chapterName}
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm py-3.5">
                                                {row.examName}
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                                                    {row.subject}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm py-3.5 whitespace-nowrap">
                                                {format(new Date(row.date), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-700 font-medium text-sm py-3.5">
                                                {row.marksObtained} <span className="text-slate-400 font-normal">/ {row.maxMarks}</span>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-3.5">
                                                <span className={`inline-flex items-center text-sm font-semibold ${row.percentage >= 70 ? 'text-emerald-600' : row.percentage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                                    {row.percentage === Math.round(row.percentage) ? row.percentage : row.percentage.toFixed(1)}%
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-sm text-slate-400 bg-white">
                            No chapter performance data available.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/* ──────────────────────── Stat Card ──────────────────────── */

function StatCard({
    label,
    value,
    subtitle,
    subtitleColor,
    icon,
    iconBg,
    iconColor,
    tooltip,
}: {
    label: string;
    value: React.ReactNode;
    subtitle: React.ReactNode;
    subtitleColor?: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    tooltip?: string;
}) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <Card
            className="rounded-2xl border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{label}</span>
                        {tooltip && (
                            <Info className="h-3 w-3 text-slate-300" />
                        )}
                    </div>
                    <div className={`p-2 rounded-xl ${iconBg}`}>
                        <span className={iconColor}>{icon}</span>
                    </div>
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
                <p className={`text-xs ${subtitleColor ?? "text-slate-400"}`}>{subtitle}</p>
            </CardContent>

            {/* Hover tooltip */}
            {tooltip && showTooltip && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 px-3 py-2.5 rounded-xl bg-slate-800 text-white text-xs leading-relaxed shadow-lg pointer-events-none">
                    {tooltip}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-800" />
                </div>
            )}
        </Card>
    );
}
