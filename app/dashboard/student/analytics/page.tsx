"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function StudentAnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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

    const { weakChapters, trend } = data;

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Analytics</h1>
                <p className="text-muted-foreground">Track your performance and identify areas for improvement.</p>
            </div>

            {/* Performance Trend */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <CardTitle>Performance Trend</CardTitle>
                    </div>
                    <CardDescription>Your percentage score across all exams over time.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {trend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="examName"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    unit="%"
                                    domain={[0, 100]}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Score"]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="percentage"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            Not enough exam data to show trend.
                        </div>
                    )}
                </CardContent>
            </Card>

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
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>{ch.chapterName} <span className="text-muted-foreground font-normal">({ch.examName})</span></span>
                                            <span className="text-orange-600">{ch.percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-orange-400 rounded-full"
                                                style={{ width: `${ch.percentage}%` }}
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

                {/* Could add Strongest Chapters here or just recent activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Your latest exam submissions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Reusing trend data for a simple list */}
                        <ul className="space-y-4">
                            {[...trend].reverse().slice(0, 5).map((exam: any, i) => (
                                <li key={i} className="flex justify-between items-center pb-2 border-b last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-sm">{exam.examName}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(exam.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="font-bold text-sm">
                                        {exam.percentage?.toFixed(1)}%
                                    </div>
                                </li>
                            ))}
                            {trend.length === 0 && <p className="text-sm text-muted-foreground">No exams taken yet.</p>}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
