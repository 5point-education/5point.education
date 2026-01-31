"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, AlertTriangle, Trophy, BookOpen } from "lucide-react";
import { format } from "date-fns";

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

export default function StudentAnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [subjectFilter, setSubjectFilter] = useState<string>("all");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/analytics/student/me");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (!data) {
        return <div className="text-center py-20 text-muted-foreground">No analytics data available.</div>;
    }

    const weakChapters = data.weakChapters ?? [];
    const strongChapters = data.strongChapters ?? [];
    const chapterWise: ChapterRow[] = data.chapterWise ?? [];
    const trend = data.trend ?? [];
    const subjectPerformance = data.subjectPerformance ?? [];

    const filteredChapterWise =
        subjectFilter === "all"
            ? chapterWise
            : chapterWise.filter((c: ChapterRow) => c.subject === subjectFilter);
    const subjects = Array.from(new Set(chapterWise.map((c: ChapterRow) => c.subject)));
    const hasSubjectChart = subjectPerformance.length > 0;
    const chartRowClass = hasSubjectChart ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "";

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Analytics</h1>
                <p className="text-muted-foreground">Track your performance and identify areas for improvement.</p>
            </div>

            {/* Charts side by side on large screens */}
            <div className={chartRowClass}>
                <Card className={hasSubjectChart ? "" : "lg:col-span-2"}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <CardTitle>Performance Trend</CardTitle>
                        </div>
                        <CardDescription>Your percentage score across all exams over time.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        {trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="examName" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis unit="%" domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                        formatter={(value: number) => [`${value.toFixed(1)}%`, "Score"]}
                                    />
                                    <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={2.5} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                Not enough exam data to show trend.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {hasSubjectChart && (
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                <CardTitle>By Subject</CardTitle>
                            </div>
                            <CardDescription>Your average score per subject.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={subjectPerformance}
                                    margin={{ top: 8, right: 8, left: 0, bottom: 16 }}
                                    barSize={28}
                                    barCategoryGap={24}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                                    <YAxis unit="%" domain={[0, 100]} tickLine={false} width={32} />
                                    <Tooltip formatter={(value: number) => [`${value}%`, "Avg"]} />
                                    <Bar dataKey="percentage" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weakest Chapters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <CardTitle>Needs Improvement</CardTitle>
                        </div>
                        <CardDescription>Chapters with your lowest percentage scores.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {weakChapters.length > 0 ? (
                            <div className="space-y-4">
                                {weakChapters.map((ch: any, i: number) => (
                                    <div key={ch.chapterId ?? i} className="space-y-1">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>{ch.chapterName} <span className="text-muted-foreground font-normal">({ch.examName})</span></span>
                                            <span className="text-orange-600">{(ch.percentage ?? 0).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-orange-400 rounded-full"
                                                style={{ width: `${Math.min(100, ch.percentage ?? 0)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">No data available.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Strong Chapters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-emerald-500" />
                            <CardTitle>Strong Chapters</CardTitle>
                        </div>
                        <CardDescription>Chapters where you scored highest.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {strongChapters.length > 0 ? (
                            <div className="space-y-4">
                                {strongChapters.map((ch: any, i: number) => (
                                    <div key={ch.chapterId ?? i} className="space-y-1">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>{ch.chapterName} <span className="text-muted-foreground font-normal">({ch.examName})</span></span>
                                            <span className="text-emerald-600">{(ch.percentage ?? 0).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-400 rounded-full"
                                                style={{ width: `${Math.min(100, ch.percentage ?? 0)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">No data available.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Chapter-wise Performance Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Chapter-wise Performance
                            </CardTitle>
                            <CardDescription>All chapters you have attempted, with scores.</CardDescription>
                        </div>
                        {subjects.length > 1 && (
                            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All subjects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All subjects</SelectItem>
                                    {subjects.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredChapterWise.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">No chapter-wise data yet.</div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Chapter</TableHead>
                                        <TableHead>Exam</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Marks</TableHead>
                                        <TableHead className="text-right">%</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredChapterWise.map((row: ChapterRow, i: number) => (
                                        <TableRow key={row.chapterId + row.examName + i}>
                                            <TableCell className="font-medium">{row.chapterName}</TableCell>
                                            <TableCell className="text-muted-foreground">{row.examName}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{row.subject}</span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(row.date), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {row.marksObtained} / {row.maxMarks}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {row.percentage.toFixed(1)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent exams */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Exams</CardTitle>
                    <CardDescription>Your latest exam submissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {[...trend].reverse().slice(0, 5).map((exam: any, i: number) => (
                            <li key={i} className="flex justify-between items-center pb-2 border-b last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium text-sm">{exam.examName}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(exam.date), "MMM d, yyyy")}</p>
                                </div>
                                <div className="font-bold text-sm">{exam.percentage?.toFixed(1)}%</div>
                            </li>
                        ))}
                        {trend.length === 0 && <p className="text-sm text-muted-foreground">No exams taken yet.</p>}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
