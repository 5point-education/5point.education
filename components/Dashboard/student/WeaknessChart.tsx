"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, BookOpen, Sparkles } from "lucide-react";

interface WeakChapter {
    chapterId: string;
    chapterName: string;
    examName: string;
    subject: string;
    percentage: number;
}

interface WeaknessChartProps {
    data: WeakChapter[];
}

export default function WeaknessChart({ data }: WeaknessChartProps) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="h-full border-none shadow-lg bg-gradient-to-b from-white to-red-50/20">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-800">Focus Areas</CardTitle>
                        <CardDescription>Chapters needing attention based on recent exams</CardDescription>
                    </div>
                    <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {data.map((chapter) => (
                    <div key={chapter.chapterId} className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-700">{chapter.chapterName}</span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {chapter.examName} • {chapter.subject}
                                </span>
                            </div>
                            <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md text-sm">
                                {chapter.percentage.toFixed(0)}%
                            </span>
                        </div>
                        <Progress value={chapter.percentage} className="h-2.5 bg-red-100 [&>div]:bg-red-500 rounded-full" />
                    </div>
                ))}
                {data.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                            <Sparkles className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">No Weakness Detected!</h3>
                        <p className="text-muted-foreground text-sm max-w-[250px]">
                            Great job! You haven't scored below the threshold in any recent chapters.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
