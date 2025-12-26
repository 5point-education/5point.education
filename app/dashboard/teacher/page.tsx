"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, ClipboardCheck } from "lucide-react";

interface Batch {
  id: string;
  name: string;
  subject: string;
  schedule: string;
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

  const totalStudents = batches.reduce((sum, batch) => sum + batch.studentCount, 0);
  const totalBatches = batches.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your classes and student assessments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Batches</CardDescription>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">{totalBatches}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Students</CardDescription>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">{totalStudents}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Pending Exams</CardDescription>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">
              {batches.reduce((sum, b) => sum + b.upcomingExams, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* My Classes */}
      <Card>
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
          <CardDescription>View and manage your assigned batches</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No batches assigned
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.name}</TableCell>
                      <TableCell>{batch.subject}</TableCell>
                      <TableCell>{batch.schedule}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{batch.studentCount}</span>
                      </TableCell>
                      <TableCell>
                        <span className={batch.studentCount >= batch.capacity ? "text-red-600" : ""}>
                          {batch.capacity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/teacher/batch/${batch.id}`)}
                          >
                            View Students
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => router.push(`/dashboard/teacher/batch/${batch.id}/exam`)}
                          >
                            Manage Exams
                          </Button>
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
