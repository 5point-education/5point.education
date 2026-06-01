"use client";

import AttendanceComponent from "@/components/Attendance/AttendanceComponent";

export default function ReceptionAttendancePage() {
  return (
    <AttendanceComponent 
      title="Take Attendance"
      description="Mark attendance for any batch"
      batchApiEndpoint="/api/batches"
    />
  );
}