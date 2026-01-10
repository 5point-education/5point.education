"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, Mail, Phone, Calendar as CalendarIcon, GraduationCap, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function BatchDetailPage({ params }: { params: any }) {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await fetch(`/api/batches/${params.id}/students`);
                if (!response.ok) throw new Error("Failed to load students");
                const data = await response.json();
                setStudents(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [params.id]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Batch Details</h1>
                        <p className="text-muted-foreground">Manage students and perform assessments</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/dashboard/teacher/batch/${params.id}/analytics`)}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Analytics
                    </Button>
                    <Button onClick={() => router.push(`/dashboard/teacher/batch/${params.id}/exams`)}>
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Manage Exams
                    </Button>
                </div>
            </div>

            {/* Student List */}
            <Card>
                <CardHeader>
                    <CardTitle>Enrolled Students</CardTitle>
                    <CardDescription>List of all students currently admitted to this batch</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Parent Name</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No students found in this batch.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    students.map((student) => (
                                        <TableRow key={student.studentId}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-slate-500" />
                                                    </div>
                                                    <span className="font-medium">{student.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {student.email}</span>
                                                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {student.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{student.parentName}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                                    {format(new Date(student.joinDate), "MMM dd, yyyy")}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
