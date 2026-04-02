"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, ClipboardCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
}

interface Batch {
  id: string;
  name: string;
  subject: string;
  schedule: string; // JSON string
  capacity: number;
  studentCount: number;
  upcomingExams: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch("/api/teacher/batches");
      const data = await response.json();
      setBatches(data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseSchedule = (scheduleStr: string): ScheduleItem[] => {
    try {
      if (!scheduleStr) return [];
      const parsed = JSON.parse(scheduleStr);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      return [];
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const totalStudents = batches.reduce((sum, batch) => sum + batch.studentCount, 0);
  const totalBatches = batches.length;
  const pendingExams = batches.reduce((sum, b) => sum + b.upcomingExams, 0);

  return (
    <div className="space-y-8 p-6 md:p-8 pt-20 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back. Here&apos;s an overview of your classes.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-none border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBatches}</div>
            <p className="text-xs text-muted-foreground mt-1">Active classes</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all batches</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Exams</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExams}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled assessments</p>
          </CardContent>
        </Card>
      </div>

      {/* My Classes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-semibold tracking-tight">My Classes</h2>
        </div>

        <div className="border rounded-xl bg-card shadow-sm overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Clock className="h-5 w-5 mr-2 animate-spin" /> Loading classes...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-muted/30">
                  <TableHead className="w-[200px] font-medium">Batch Name</TableHead>
                  <TableHead className="font-medium">Subject</TableHead>
                  <TableHead className="w-[300px] font-medium">Schedule</TableHead>
                  <TableHead className="font-medium">Students</TableHead>
                  <TableHead className="text-right font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No batches assigned yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => {
                    const schedule = parseSchedule(batch.schedule);

                    return (
                      <TableRow key={batch.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-foreground">{batch.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal text-muted-foreground bg-muted/50 hover:bg-muted/50">
                            {batch.subject}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5 py-1">
                            {schedule.length > 0 ? (
                              schedule.map((item, idx) => (
                                <div key={idx} className="flex items-center text-xs text-muted-foreground gap-2">
                                  <span className="font-medium text-foreground w-[70px]">{item.day}</span>
                                  <span className="bg-primary/5 px-2 py-0.5 rounded text-[11px] font-medium text-mute-foreground/70 dark:text-primary">
                                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No schedule set</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{batch.studentCount}</span>

                            Students
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 transition-opacity">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 text-xs font-medium"
                              onClick={() => router.push(`/dashboard/teacher/students?batchId=${batch.id}`)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-medium"
                              onClick={() => router.push(`/dashboard/teacher/exam?batchId=${batch.id}`)}
                            >
                              Exams
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
