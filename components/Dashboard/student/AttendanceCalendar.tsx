"use client";

import { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
    id: string;
    date: string;
    status: boolean;
    batch: {
        name: string;
        subject: string;
        schedule?: string;
    };
}

interface AttendanceCalendarProps {
    attendance: AttendanceRecord[];
}

export default function AttendanceCalendar({ attendance }: AttendanceCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    // Generate days for the grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Group attendance by date string (YYYY-MM-DD) for easier lookup
    const attendanceByDate = attendance.reduce((acc, record) => {
        const dateKey = format(new Date(record.date), "yyyy-MM-dd");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(record);
        return acc;
    }, {} as Record<string, AttendanceRecord[]>);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-slate-800">
                        {format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <div className="flex items-center bg-white rounded-md border border-slate-200 shadow-sm">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-slate-800"
                            onClick={prevMonth}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="w-[1px] h-3 bg-slate-200"></div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-slate-800"
                            onClick={nextMonth}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-7 px-2">
                    View Today
                </Button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center">
                {weekDays.map((day) => (
                    <div key={day} className="py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr bg-slate-100 gap-[1px]">
                {calendarDays.map((day, dayIdx) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayRecords = attendanceByDate[dateKey] || [];
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    return (
                        <div
                            key={day.toString()}
                            className={cn(
                                "min-h-[110px] bg-white p-1 flex flex-col gap-1 transition-colors hover:bg-slate-50/50",
                                !isCurrentMonth && "bg-slate-50/30 text-slate-400"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <span
                                    className={cn(
                                        "text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full",
                                        isToday(day)
                                            ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                                            : "text-slate-600"
                                    )}
                                >
                                    {format(day, "d")}
                                </span>
                                {dayRecords.length > 0 && (
                                    <span className="text-[8px] text-slate-400 font-medium">
                                        {dayRecords.length}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col gap-0.5 mt-0.5 overflow-y-auto max-h-[45px] custom-scrollbar">
                                {dayRecords.map((record) => (
                                    <div
                                        key={record.id}
                                        className={cn(
                                            "text-[9px] p-0.5 px-1 rounded border leading-tight flex flex-col gap-0 shadow-sm",
                                            record.status
                                                ? "bg-green-50 border-green-100 text-green-800"
                                                : "bg-red-50 border-red-100 text-red-800"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="font-bold truncate">{record.batch.subject}</span>
                                            {record.status ? (
                                                <CheckCircle className="h-2.5 w-2.5 shrink-0 opacity-70" />
                                            ) : (
                                                <XCircle className="h-2.5 w-2.5 shrink-0 opacity-70" />
                                            )}
                                        </div>
                                        <span className="opacity-75 text-[9px] truncate">
                                            {record.batch.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
