"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import {
  BookOpen,
  TrendingUp,
  DollarSign,
  Calendar,
  Sparkles,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format } from "date-fns";
import AnalyticsOverview from "@/components/dashboard/student/AnalyticsOverview";

interface DashboardData {
  overview: {
    totalExams: number;
    averageScore: number;
    pendingFees: number;
    nextClass: string;
  };
  performanceData: Array<{
    examName: string;
    score: number;
    totalMarks: number;
    date: string;
  }>;
  recentResults: Array<{
    id: string;
    examName: string;
    subject: string;
    score: number;
    totalMarks: number;
    remarks: string;
    date: string;
  }>;
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/student/dashboard");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-slate-700">Unable to load dashboard data</h3>
        <p className="text-slate-500 mt-2">Please try refreshing the page</p>
      </div>
    );
  }

  const chartData = data.performanceData.map((item) => ({
    name: item.examName,
    score: item.score,
    percentage: parseFloat(((item.score / item.totalMarks) * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Student Dashboard
            </h1>
            <p className="text-blue-100 mt-2 text-lg">
              Welcome back! Here's your academic performance overview.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="font-medium">Keep it up!</span>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
      </div>

      {/* Analytics Overview Section */}
      <AnalyticsOverview />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:-translate-y-1 transition-all duration-300 border-none shadow-lg bg-gradient-to-br from-white to-slate-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BookOpen className="h-24 w-24 text-blue-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                <BookOpen className="h-4 w-4" />
              </span>
              Total Exams
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-slate-800 mt-2 relative z-10">
              {data.overview.totalExams}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600 font-medium">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              <span>Lifetime exams</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:-translate-y-1 transition-all duration-300 border-none shadow-lg bg-gradient-to-br from-white to-slate-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-24 w-24 text-emerald-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </span>
              Average Score
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-slate-800 mt-2 relative z-10">
              {data.overview.averageScore}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500">
              <span>Across all subjects</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:-translate-y-1 transition-all duration-300 border-none shadow-lg bg-gradient-to-br from-white to-slate-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="h-24 w-24 text-violet-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-violet-100 text-violet-600">
                <Calendar className="h-4 w-4" />
              </span>
              Batch Schedule
            </CardDescription>
            <div className="min-h-[40px] flex items-center mt-2">
              <CardTitle className="text-xl font-bold text-slate-800 leading-tight relative z-10">
                {(() => {
                  try {
                    const schedule = JSON.parse(data.overview.nextClass);
                    if (Array.isArray(schedule)) {
                      return schedule.map((s: any) => s.day.slice(0, 3)).join(", ");
                    }
                    return data.overview.nextClass;
                  } catch {
                    return data.overview.nextClass;
                  }
                })()}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500">
              {(() => {
                try {
                  const schedule = JSON.parse(data.overview.nextClass);
                  if (Array.isArray(schedule) && schedule.length > 0) {
                    return <span>{schedule.length} Weekly Classes</span>;
                  }
                  return <span>Active timings</span>;
                } catch {
                  return <span>Active timings</span>;
                }
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:-translate-y-1 transition-all duration-300 border-none shadow-lg bg-gradient-to-br from-white to-slate-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="h-24 w-24 text-rose-600" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 font-medium flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                <DollarSign className="h-4 w-4" />
              </span>
              Pending Fees
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-slate-800 mt-2 relative z-10">
              ₹{data.overview.pendingFees.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.overview.pendingFees > 0 ? (
              <div className="flex items-center text-sm text-rose-600 font-medium">
                <XCircle className="h-4 w-4 mr-1" />
                <span>Action Required</span>
              </div>
            ) : (
              <div className="flex items-center text-sm text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                <span>All clear</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <Card className="lg:col-span-2 border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">Performance Trend</CardTitle>
                <CardDescription>Your exam scores timeline over the academic year</CardDescription>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '12px'
                    }}
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#1d4ed8' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card className="lg:col-span-1 border-none shadow-lg h-full flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-xl font-bold text-slate-800">Recent Results</CardTitle>
            <CardDescription>Latest exam outcomes</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Subject</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentResults.slice(0, 6).map((result) => {
                    const percentage = (result.score / result.totalMarks) * 100;
                    let gradeColor = "text-slate-600";
                    if (percentage >= 80) gradeColor = "text-emerald-600";
                    else if (percentage >= 60) gradeColor = "text-yellow-600";
                    else if (percentage < 40) gradeColor = "text-rose-600";

                    return (
                      <TableRow key={result.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 line-clamp-1">{result.examName}</span>
                            <span className="text-xs text-slate-500">{format(new Date(result.date), "MMM dd")} • {result.subject}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className={`font-bold ${gradeColor}`}>
                              {percentage.toFixed(0)}%
                            </span>
                            <span className="text-xs text-slate-400">
                              {result.score}/{result.totalMarks}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {data.recentResults.length > 6 && (
              <div className="p-4 border-t border-slate-100 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">
                  View All Results
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
