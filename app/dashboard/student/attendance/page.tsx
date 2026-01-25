"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import AttendanceCalendar from "@/components/dashboard/student/AttendanceCalendar";
import { format } from "date-fns";

interface AttendanceRecord {
    id: string;
    date: string;
    status: boolean;
    batch: {
        name: string;
        subject: string;
    };
}

interface AttendanceStats {
    total: number;
    present: number;
    absent: number;
    percentage: string;
}

interface AttendanceData {
    attendance: AttendanceRecord[];
    stats: AttendanceStats;
}

export default function StudentAttendancePage() {
    const [data, setData] = useState<AttendanceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttendanceData();
    }, []);

    const fetchAttendanceData = async () => {
        try {
            const response = await fetch("/api/student/attendance");
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error("Error fetching attendance data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96">Loading...</div>;
    }

    if (!data) {
        return <div className="text-center py-8">No attendance data available</div>;
    }

    return (
        <div className="space-y-4 pt-20 md:pt-0">
            <div>
                <h1 className="text-2xl font-bold">My Attendance</h1>
                <p className="text-muted-foreground">Track your class attendance and punctuality</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-600">Total Classes</span>
                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <CalendarIcon className="h-3 w-3 text-blue-600" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{data.stats.total}</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Scheduled classes</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-600">Present</span>
                            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{data.stats.present}</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Classes attended</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-600">Absent</span>
                            <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="h-3 w-3 text-red-600" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{data.stats.absent}</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Classes missed</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-indigo-600">Attendance Rate</span>
                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-indigo-600">%</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-800">{data.stats.percentage}%</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Overall rate</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AttendanceCalendar attendance={data.attendance} />
        </div>
    );
}
