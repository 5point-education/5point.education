"use client";

import { useEffect, useState } from "react";
import WeaknessChart from "./WeaknessChart";
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
            <div className="w-full h-[200px] mb-8">
                <Skeleton className="h-full w-full rounded-xl" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="w-full mb-8">
            <div className="h-full min-h-[250px]">
                <WeaknessChart data={data.weakChapters} />
            </div>
        </div>
    );
}
