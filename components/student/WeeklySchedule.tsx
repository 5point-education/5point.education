
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
}

interface WeeklyScheduleProps {
  scheduleString: string;
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function WeeklySchedule({ scheduleString }: WeeklyScheduleProps) {
  let schedule: ScheduleItem[] = [];
  try {
    schedule = JSON.parse(scheduleString);
  } catch (e) {
    console.error("Invalid schedule format", e);
    return <div className="text-red-500">Invalid schedule data</div>;
  }

  // Sort schedule by day
  schedule.sort((a, b) => {
    return DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day);
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {schedule.map((item, index) => (
        <Card key={index} className="shadow-sm">
          <CardContent className="p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold text-sm">{item.day}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {item.startTime}-{item.endTime}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
      {schedule.length === 0 && (
        <div className="col-span-full text-muted-foreground text-sm italic">
          No schedule available.
        </div>
      )}
    </div>
  );
}
