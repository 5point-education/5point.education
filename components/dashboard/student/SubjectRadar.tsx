"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts";
import { Target } from "lucide-react";

interface SubjectData {
    subject: string;
    percentage: number;
    totalExams: number;
}

interface SubjectRadarProps {
    data: SubjectData[];
}

export default function SubjectRadar({ data }: SubjectRadarProps) {
    if (!data || data.length < 3) return null; // Radar needs at least 3 points to look good

    return (
        <Card className="h-full border-none shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-800">Subject Mastery</CardTitle>
                        <CardDescription>Comparative performance across subjects</CardDescription>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Target className="h-5 w-5 text-blue-600" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Score %"
                                dataKey="percentage"
                                stroke="#2563eb"
                                strokeWidth={3}
                                fill="#3b82f6"
                                fillOpacity={0.3}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    padding: '12px'
                                }}
                                formatter={(value: number) => [`${value}%`, 'Score']}
                                labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
