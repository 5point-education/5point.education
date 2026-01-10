"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

export default function BatchAnalyticsPage({ params }: { params: any }) {
    const [data, setData] = useState<{ weakChaptersBatch: any[], totalExams: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/batches/${params.id}/analytics`)
            .then(res => res.json())
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [params.id]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!data) return <div>Failed to load data</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Batch Analytics</h1>
            <p className="text-muted-foreground">Performance insights for this batch</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Weakest Chapters</CardTitle>
                        <CardDescription>Chapters with the lowest average percentage across the batch</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.weakChaptersBatch} layout="vertical" margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="avgPercentage" fill="#ef4444" name="Avg Score %" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
