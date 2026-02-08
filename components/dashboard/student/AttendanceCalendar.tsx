"use client";

import { useState, useMemo } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
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

// Predefined color palette for subjects - vibrant and distinct colors
const SUBJECT_COLORS = [
    { bg: "bg-violet-100", border: "border-violet-200", text: "text-violet-800", dot: "bg-violet-500" },
    { bg: "bg-blue-100", border: "border-blue-200", text: "text-blue-800", dot: "bg-blue-500" },
    { bg: "bg-emerald-100", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
    { bg: "bg-amber-100", border: "border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
    { bg: "bg-rose-100", border: "border-rose-200", text: "text-rose-800", dot: "bg-rose-500" },
    { bg: "bg-cyan-100", border: "border-cyan-200", text: "text-cyan-800", dot: "bg-cyan-500" },
    { bg: "bg-orange-100", border: "border-orange-200", text: "text-orange-800", dot: "bg-orange-500" },
    { bg: "bg-teal-100", border: "border-teal-200", text: "text-teal-800", dot: "bg-teal-500" },
    { bg: "bg-indigo-100", border: "border-indigo-200", text: "text-indigo-800", dot: "bg-indigo-500" },
    { bg: "bg-pink-100", border: "border-pink-200", text: "text-pink-800", dot: "bg-pink-500" },
    { bg: "bg-lime-100", border: "border-lime-200", text: "text-lime-800", dot: "bg-lime-500" },
    { bg: "bg-fuchsia-100", border: "border-fuchsia-200", text: "text-fuchsia-800", dot: "bg-fuchsia-500" },
];

// Hash function to consistently map subject names to color indices
function hashSubject(subject: string): number {
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
        const char = subject.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % SUBJECT_COLORS.length;
}

export default function AttendanceCalendar({ attendance }: AttendanceCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    // Get unique subjects and their colors
    const subjectColorMap = useMemo(() => {
        const subjects = [...new Set(attendance.map(r => r.batch.subject))];
        const colorMap: Record<string, typeof SUBJECT_COLORS[0]> = {};
        subjects.forEach(subject => {
            colorMap[subject] = SUBJECT_COLORS[hashSubject(subject)];
        });
        return colorMap;
    }, [attendance]);

    // Get list of unique subjects for legend
    const uniqueSubjects = useMemo(() => {
        return [...new Set(attendance.map(r => r.batch.subject))].sort();
    }, [attendance]);

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

            {/* Subject Legend */}
            {uniqueSubjects.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/30">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Subjects:</span>
                    {uniqueSubjects.map((subject) => {
                        const colors = subjectColorMap[subject];
                        return (
                            <div key={subject} className="flex items-center gap-1">
                                <div className={cn("w-2.5 h-2.5 rounded-full", colors.dot)} />
                                <span className={cn("text-[10px] font-medium", colors.text)}>{subject}</span>
                            </div>
                        );
                    })}
                    <div className="flex items-center gap-2 ml-auto text-[10px] text-slate-500">
                        <div className="flex items-center gap-0.5">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Present</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span>Absent</span>
                        </div>
                    </div>
                </div>
            )}

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
                {calendarDays.map((day) => {
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

                            <div className="flex-1 flex flex-col gap-0.5 mt-0.5 overflow-y-auto max-h-[65px] custom-scrollbar">
                                {dayRecords.map((record) => {
                                    const colors = subjectColorMap[record.batch.subject];
                                    return (
                                        <div
                                            key={record.id}
                                            className={cn(
                                                "text-[9px] p-0.5 px-1 rounded border leading-tight flex flex-col gap-0 shadow-sm",
                                                colors.bg,
                                                colors.border,
                                                colors.text
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="font-bold truncate">{record.batch.subject}</span>
                                                {record.status ? (
                                                    <CheckCircle className="h-2.5 w-2.5 shrink-0 text-green-600" />
                                                ) : (
                                                    <XCircle className="h-2.5 w-2.5 shrink-0 text-red-600" />
                                                )}
                                            </div>
                                            <span className="opacity-75 text-[9px] truncate">
                                                {record.batch.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
