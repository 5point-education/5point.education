"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">My Attendance</h1>
                <p className="text-muted-foreground">Track your class attendance and punctuality</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription className="text-blue-600 font-medium">Total Classes</CardDescription>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <CardTitle className="text-4xl font-bold text-slate-800 mt-2">{data.stats.total}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Total scheduled classes</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription className="text-green-600 font-medium">Present</CardDescription>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-4xl font-bold text-slate-800 mt-2">{data.stats.present}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Classes attended</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription className="text-red-600 font-medium">Absent</CardDescription>
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <XCircle className="h-4 w-4 text-red-600" />
                            </div>
                        </div>
                        <CardTitle className="text-4xl font-bold text-slate-800 mt-2">{data.stats.absent}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Classes missed</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription className="text-indigo-600 font-medium">Attendance Rate</CardDescription>
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-xs font-bold text-indigo-600">%</span>
                            </div>
                        </div>
                        <CardTitle className="text-4xl font-bold text-slate-800 mt-2">{data.stats.percentage}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Overall attendance</p>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance List */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                    <CardDescription>Detailed log of your class attendance</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="font-semibold text-slate-700">Date</TableHead>
                                <TableHead className="font-semibold text-slate-700">Batch</TableHead>
                                <TableHead className="font-semibold text-slate-700">Subject</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.attendance.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No attendance records found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.attendance.map((record) => (
                                    <TableRow key={record.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium text-slate-700">
                                            {format(new Date(record.date), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell>{record.batch.name}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                                {record.batch.subject}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1 ${record.status
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {record.status ? (
                                                    <>
                                                        <CheckCircle className="h-3 w-3" /> Present
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="h-3 w-3" /> Absent
                                                    </>
                                                )}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
