"use client";

import AttendanceComponent from "@/components/Attendance/AttendanceComponent";

export default function AttendancePage() {
  return (
    <div className="pt-14 md:pt-0">
      <AttendanceComponent
        title="Take Attendance"
        description="Mark attendance for your assigned batches"
        batchApiEndpoint="/api/teacher/batches"
      />
    </div>
  );
}