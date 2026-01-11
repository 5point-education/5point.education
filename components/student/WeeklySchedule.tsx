
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {schedule.map((item, index) => (
        <Card key={index} className="shadow-sm">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold">{item.day}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <span>
                {item.startTime} - {item.endTime}
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
