"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import {
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  IndianRupee
} from "lucide-react";
import { format } from "date-fns";

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

  const [timeOfDay, setTimeOfDay] = useState("day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay("morning");
    else if (hour < 18) setTimeOfDay("afternoon");
    else setTimeOfDay("evening");

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

  // Parse Schedule safely
  let scheduleItems: any[] = [];
  try {
    const parsed = JSON.parse(data.overview.nextClass);
    if (Array.isArray(parsed)) scheduleItems = parsed;
    else scheduleItems = [{ day: "General", time: data.overview.nextClass }];
  } catch {
    scheduleItems = [{ day: "Info", time: data.overview.nextClass }];
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 bg-slate-50/50 min-h-screen">

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* LEFT MAIN COLUMN */}
        <div className="xl:col-span-3 space-y-6">

          {/* 1. Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-[#2563eb] p-8 text-white shadow-xl shadow-blue-200">
            <div className="relative z-10 flex flex-col justify-center h-full max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
                Good {timeOfDay}, Student! 👋
              </h1>
              <p className="text-blue-100 text-lg md:text-xl font-light leading-relaxed">
                You've completed <span className="font-semibold text-white">{data.overview.totalExams} exams</span> so far.
                Keep pushing your limits!
              </p>
            </div>

            {/* Abstract Illustration Elements */}
            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4">
              <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFFFFF" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.4C93.5,8.4,82.2,21.1,70.9,32.2C59.6,43.3,48.3,52.8,36.4,60.6C24.5,68.4,12,74.5,-0.3,75C-12.6,75.5,-25.1,70.4,-36.4,63.1C-47.7,55.8,-57.8,46.3,-66.2,35.1C-74.6,23.9,-81.3,11,-80.4,-1.5C-79.5,-13.9,-71,-25.9,-61.4,-36.3C-51.8,-46.7,-41.1,-55.5,-29.4,-64.1C-17.7,-72.7,-5,-81.1,5.9,-91.3L16.8,-101.5L44.7,-76.4Z" transform="translate(100 100)" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 2. Performance Chart (Takes 2/3) */}
            <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-transparent">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-slate-800">Overall Performance</CardTitle>
                  <CardDescription>Score trajectory over time</CardDescription>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold shadow-sm">
                  Avg: {data.overview.averageScore}%
                </div>
              </CardHeader>
              <CardContent className="pl-0">
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="percentage"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 3. Statistics Stack (Takes 1/3) */}
            <div className="flex flex-col gap-4">

              {/* Stat 1: Pending Fees */}
              <Card className="flex-1 border-none shadow-sm rounded-2xl flex items-center p-4 hover:shadow-md transition-shadow">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mr-4 ${data.overview.pendingFees > 0 ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'}`}>
                  <IndianRupee className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {data.overview.pendingFees > 0 ? `₹${data.overview.pendingFees}` : 'Clear'}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">
                    {data.overview.pendingFees > 0 ? 'Pending Fees' : 'Dues Cleared'}
                  </p>
                </div>
              </Card>
              {/* Stat 2: Total Exams */}
              <Card className="flex-1 border-none shadow-sm rounded-2xl flex items-center p-4 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mr-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{data.overview.totalExams}</p>
                  <p className="text-sm text-slate-500 font-medium">Total Exams</p>
                </div>
              </Card>

              {/* Stat 3: Average Score */}
              <Card className="flex-1 border-none shadow-sm rounded-2xl flex items-center p-4 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mr-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{data.overview.averageScore}%</p>
                  <p className="text-sm text-slate-500 font-medium">Average Score</p>
                </div>
              </Card>
            </div>

          </div>



        </div>

        {/* RIGHT SIDEBAR COLUMN */}
        <div className="xl:col-span-1 space-y-6">

          {/* 5. Upcoming Classes Widget */}
          <Card className="border-none shadow-sm rounded-3xl bg-white h-auto">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center justify-between">
                <span>Upcoming Classes</span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500 font-normal">{scheduleItems.length} active</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {scheduleItems.map((item: any, idx) => (
                <div key={idx} className="flex flex-col p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-indigo-900">{item.day}</span>

                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                    {item.time ? item.time : (item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : "Time check required")}
                  </div>
                </div>
              ))}

              <button className="w-full py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-xl transition-colors mt-2">
                View Full Schedule
              </button>
            </CardContent>
          </Card>

          {/* 6. Recent Results Widget */}
          <Card className="border-none shadow-sm rounded-3xl bg-white">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center justify-between">
                <span>Recent Results</span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500 font-normal">History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {data.recentResults.slice(0, 5).map((result) => {
                const percentage = (result.score / result.totalMarks) * 100;
                return (
                  <div key={result.id} className="flex items-center justify-between p-1">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${percentage >= 80 ? 'bg-green-100 text-green-600' : percentage >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{result.examName}</p>
                        <p className="text-xs text-slate-500">{result.subject}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{percentage.toFixed(0)}%</p>
                      <p className="text-[10px] text-slate-400">{format(new Date(result.date), "MMM dd")}</p>
                    </div>
                  </div>
                )
              })}
              <div className="pt-2">
                <p className="text-center text-xs text-slate-400">Average Score: <span className="text-slate-700 font-semibold">{data.overview.averageScore}%</span></p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
