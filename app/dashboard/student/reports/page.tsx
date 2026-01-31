"use client";

import { BarChart3, GraduationCap, Calendar, BookOpen } from "lucide-react";
import { ReportsHub, ReportLinkCard } from "@/components/dashboard/reports";

/**
 * Student reports – details only, no redundant sections or copy.
 * Uses shared ReportsHub for layout; subscription can be gated here later.
 */
export default function StudentReportsPage() {
  return (
    <ReportsHub
      title="Reports"
      description="Your performance and records."
    >
      <div className="space-y-2">
        <ReportLinkCard
          id="analytics"
          title="Performance analytics"
          href="/dashboard/student/analytics"
          icon={BarChart3}
        />
        <ReportLinkCard
          id="results"
          title="Results"
          href="/dashboard/student/results"
          icon={GraduationCap}
        />
        <ReportLinkCard
          id="attendance"
          title="Attendance"
          href="/dashboard/student/attendance"
          icon={Calendar}
        />
        <ReportLinkCard
          id="courses"
          title="My courses"
          href="/dashboard/student/courses"
          icon={BookOpen}
        />
      </div>
    </ReportsHub>
  );
}
