"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, AlertTriangle, Trophy, BookOpen, ArrowLeft } from "lucide-react";
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

export default function TeacherStudentAnalyticsPage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/student/${studentId}`);
        if (res.status === 403) {
          setError("You can only view analytics for students in your batches.");
          setData(null);
          return;
        }
        if (!res.ok) {
          setError("Failed to load analytics.");
          setData(null);
          return;
        }
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to fetch student analytics", e);
        setError("Failed to load analytics.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/teacher/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Link>
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        No analytics data available for this student.
      </div>
    );
  }

  const weakChapters = data.weakChapters ?? [];
  const strongChapters = data.strongChapters ?? [];
  const chapterWise: ChapterRow[] = data.chapterWise ?? [];
  const trend = data.trend ?? [];
  const subjectPerformance = data.subjectPerformance ?? [];
  const studentName = data.studentName ?? "Student";

  const filteredChapterWise =
    subjectFilter === "all"
      ? chapterWise
      : chapterWise.filter((c: ChapterRow) => c.subject === subjectFilter);
  const subjects = Array.from(new Set(chapterWise.map((c: ChapterRow) => c.subject)));

  const hasSubjectChart = subjectPerformance.length > 0;
  const chartRowClass = hasSubjectChart
    ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
    : "";

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href="/dashboard/teacher/students" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Students
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Analytics for {studentName}</h1>
          <p className="text-muted-foreground">Chapter-wise and exam performance.</p>
        </div>
      </div>

      {/* Charts row: side by side on large screens, same height */}
      <div className={chartRowClass}>
        <Card className={hasSubjectChart ? "" : "lg:col-span-2"}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Performance Trend</CardTitle>
            </div>
            <CardDescription>Score % across exams over time.</CardDescription>
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
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No exam data yet.</div>
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
              <CardDescription>Average score per subject.</CardDescription>
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
                  <Bar dataKey="percentage" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <CardTitle>Needs Improvement</CardTitle>
            </div>
            <CardDescription>Chapters with lowest scores.</CardDescription>
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
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${Math.min(100, ch.percentage ?? 0)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">No data.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-500" />
              <CardTitle>Strong Chapters</CardTitle>
            </div>
            <CardDescription>Highest-scoring chapters.</CardDescription>
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
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, ch.percentage ?? 0)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">No data.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Chapter-wise Performance
              </CardTitle>
              <CardDescription>All attempted chapters with scores.</CardDescription>
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
                      <TableCell className="text-muted-foreground">{format(new Date(row.date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right font-mono">{row.marksObtained} / {row.maxMarks}</TableCell>
                      <TableCell className="text-right font-medium">{row.percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
