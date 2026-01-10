"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Loader2, Users, BookOpen, AlertCircle } from "lucide-react";

export default function BatchAnalyticsPage({ params }: { params: { id: string } }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/analytics/batch/${params.id}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch batch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    if (loading) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (!data) {
        return <div className="text-center py-20 text-muted-foreground">No data available.</div>;
    }

    const { chapterPerformance, weakChapters, batchAverage } = data;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Batch Analytics</h1>
                <p className="text-muted-foreground">Overview of batch performance and weak areas.</p>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Batch Avg Score</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{batchAverage.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Across all exams</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weakest Chapter</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">
                            {weakChapters[0]?.chapterName || "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {weakChapters[0] ? `${weakChapters[0].averagePercentage.toFixed(1)}% avg` : "No data"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Analysed Chapters</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{chapterPerformance.length}</div>
                        <p className="text-xs text-muted-foreground">Total chapters tracked</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chapter Performance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Chapter Performance Breakdown</CardTitle>
                    <CardDescription>Average percentage score per chapter across the batch.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    {chapterPerformance.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chapterPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="chapterName"
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                    tick={{ fontSize: 12 }}
                                    interval={0}
                                />
                                <YAxis unit="%" domain={[0, 100]} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Avg Score"]}
                                />
                                <Bar dataKey="averagePercentage" fill="#0f172a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
                    )}
                </CardContent>
            </Card>

            {/* Detailed Table for Weak Chapters */}
            <Card>
                <CardHeader>
                    <CardTitle>Weak Areas (Bottom 5)</CardTitle>
                    <CardDescription>Chapters requiring attention.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {weakChapters.map((ch: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-medium">{ch.chapterName}</p>
                                    <p className="text-sm text-muted-foreground">{ch.examName}</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                        {ch.averagePercentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
