"use client";

import AttendanceComponent from "@/components/Attendance/AttendanceComponent";

export default function AttendancePage() {
  return (
    <AttendanceComponent 
      title="Take Attendance"
      description="Mark attendance for your assigned batches"
      batchApiEndpoint="/api/teacher/batches"
    />
  );
}