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
        <Card className="h-full border-none shadow-md bg-white">
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
                <div className="grid grid-cols-1 gap-4">
                    {data.filter(c => c.percentage < 65).map((chapter) => (
                        <div key={chapter.chapterId} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-800 line-clamp-1" title={chapter.chapterName}>{chapter.chapterName}</span>
                                    <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <BookOpen className="h-3 w-3" />
                                        {chapter.subject}
                                    </span>
                                </div>
                                <span className={`font-bold px-2 py-1 rounded-md text-xs ${chapter.percentage < 50 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {chapter.percentage.toFixed(0)}%
                                </span>
                            </div>
                            <Progress value={chapter.percentage} className={`h-2 rounded-full ${chapter.percentage < 50 ? '[&>div]:bg-red-500 bg-red-100' : '[&>div]:bg-yellow-500 bg-yellow-100'}`} />
                            <p className={`text-[10px] mt-2 font-medium flex items-center gap-1 ${chapter.percentage < 50 ? 'text-red-500' : 'text-yellow-600'}`}>
                                <AlertTriangle className="h-3 w-3" />
                                {chapter.percentage < 50 ? 'Critical Attention' : 'Needs Improvement'}
                            </p>
                        </div>
                    ))}
                    {data.filter(c => c.percentage < 65).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center h-full col-span-full">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                                <Sparkles className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">No Major Weaknesses!</h3>
                            <p className="text-muted-foreground text-sm max-w-[250px]">
                                Excellent! All your recent scores are above 65%.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
