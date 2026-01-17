"use client";

import { useEffect, useState } from "react";
import WeaknessChart from "./WeaknessChart";
import SubjectRadar from "./SubjectRadar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function AnalyticsOverview() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/student/analytics")
            .then((res) => res.json())
            .then((data) => setData(data))
            .catch((err) => console.error("Failed to load analytics", err))
            .finally(() => setLoading(false));
    }, []);
    console.log(data)
    if (loading) {
        return (
            <div className="grid md:grid-cols-2 gap-6 h-80">
                <Skeleton className="h-full w-full rounded-xl" />
                <Skeleton className="h-full w-full rounded-xl" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="h-full min-h-[350px]">
                <WeaknessChart data={data.weakChapters} />
            </div>
            <div className="h-full min-h-[350px]">
                {data.subjectPerformance && data.subjectPerformance.length >= 3 ? (
                    <SubjectRadar data={data.subjectPerformance} />
                ) : (
                    <Card className="h-full flex items-center justify-center p-6 bg-slate-50 border-dashed border-2 border-slate-200 shadow-none">
                        <CardContent className="text-center">
                            <div className="bg-slate-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                            </div>
                            <h3 className="text-slate-900 font-medium mb-1">Gathering Insights</h3>
                            <p className="text-muted-foreground text-sm">Take more exams to unlock detailed subject analysis.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
