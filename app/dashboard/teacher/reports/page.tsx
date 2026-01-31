"use client";

import { useEffect, useState } from "react";
import { Loader2, BookOpen, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsHub, ReportLinkCard } from "@/components/dashboard/reports";

interface Batch {
  id: string;
  name: string;
  subject: string;
  schedule?: string;
  capacity?: number;
  studentCount?: number;
  teacherName?: string;
}

interface Student {
  studentId: string;
  name: string;
  email: string;
  phone: string;
  parentName: string | null;
  joinDate: string;
  batches?: { id: string; name: string; subject: string; isActive: boolean }[];
}

export default function TeacherReportsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [batchRes, studentRes] = await Promise.all([
          fetch("/api/teacher/batches"),
          fetch("/api/teacher/students"),
        ]);
        if (batchRes.ok) setBatches(await batchRes.json());
        if (studentRes.ok) setStudents(await studentRes.json());
      } catch (e) {
        console.error("Failed to fetch reports data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const batchList = batches.filter((b) => b.id);

  return (
    <ReportsHub
      title="Reports"
      description="Batch and student analytics in one place."
    >
      <Tabs defaultValue="batch" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Batch analytics
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="batch" className="mt-6">
          {batchList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No batches assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {batchList.map((batch) => (
                <ReportLinkCard
                  key={batch.id}
                  id={batch.id}
                  title={batch.name}
                  description={batch.subject}
                  href={`/dashboard/teacher/batch/${batch.id}/analytics`}
                  icon={BookOpen}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="students" className="mt-6">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students in your batches yet.</p>
          ) : (
            <div className="space-y-2">
              {students.map((s) => (
                <ReportLinkCard
                  key={s.studentId}
                  id={s.studentId}
                  title={s.name}
                  href={`/dashboard/teacher/students/${s.studentId}/analytics`}
                  icon={Users}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ReportsHub>
  );
}
