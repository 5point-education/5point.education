"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StudentListTable from "@/components/dashboard/StudentListTable";

interface Batch {
  id: string;
  name: string;
  subject: string;
  schedule: string;
  capacity: number;
  studentCount: number;
  teacherName: string;
}

export default function TeacherStudentListPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch("/api/teacher/batches");
        if (response.ok) {
          const data = await response.json();

          // The data from the API already matches our interface
          setBatches(data);
        } else {
          console.error("Failed to fetch batches");
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Students</h1>
        <p className="text-muted-foreground">View and manage students in your assigned batches</p>
      </div>


      {loading ? (
        <div className="text-center py-8">Loading your batches...</div>
      ) : (
        <StudentListTable
          batches={batches}
          role="teacher"
        />
      )}
    </div>
  );
}