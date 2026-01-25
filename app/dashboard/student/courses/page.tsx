
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklySchedule } from "@/components/student/WeeklySchedule";
import { BookOpen, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Batch {
  id: string;
  name: string;
  subject: string;
  schedule: string;
  teacher: {
    name: string;
    email: string;
  };
}

export default function StudentCoursesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch("/api/student/batches");
      if (response.ok) {
        const data = await response.json();
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

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="p-4 bg-primary/10 rounded-full">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">No Courses Found</h2>
        <p className="text-muted-foreground max-w-sm">
          You are not enrolled in any batches yet. Please contact reception or an administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-20 md:pt-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">View your enrolled batches and schedules</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {batches.map((batch) => (
          <Card key={batch.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 p-3 md:p-6 pb-3 md:pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                      {batch.subject}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg md:text-2xl">{batch.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white px-3 py-1.5 rounded-full border shadow-sm">
                  <UserIcon className="h-4 w-4" />
                  <span className="text-xs md:text-sm">{batch.teacher.name}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Weekly Schedule</h3>
              <WeeklySchedule scheduleString={batch.schedule} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
