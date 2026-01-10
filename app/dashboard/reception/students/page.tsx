"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import StudentListTable from "@/components/Dashboard/StudentListTable";

interface Batch {
  id: string;
  name: string;
  subject: string;
  schedule: string;
  capacity: number;
  teacherName: string;
}

export default function ReceptionStudentListPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch("/api/batches");
        if (response.ok) {
          const data = await response.json();
          
          // Transform the data to match the expected interface
          const transformedBatches = data.map((batch: any) => ({
            id: batch.id,
            name: batch.name,
            subject: batch.subject,
            schedule: batch.schedule,
            capacity: batch.capacity,
            teacherName: batch.teacher.name
          }));
          
          setBatches(transformedBatches);
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
        <h1 className="text-3xl font-bold">Student Management</h1>
        <p className="text-muted-foreground">View and manage all students across batches</p>
      </div>

      {/* <Card> */}
        {/* <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            Browse students across all batches in the system
          </CardDescription>
        </CardHeader> */}
        {/* <CardContent> */}
          {loading ? (
            <div className="text-center py-8">Loading batches...</div>
          ) : (
            <StudentListTable 
              batches={batches} 
              role="receptionist" 
            />
          )}
        {/* </CardContent> */}
      {/* </Card> */}
    </div>
  );
}