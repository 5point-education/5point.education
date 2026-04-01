"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap,
  Loader2,
  CalendarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
}

interface Batch {
  id: string;
  name: string;
  subject: string;
  teacher?: { name: string; email?: string } | null;
  teacherId?: string;
  schedule: string;
}

interface CalendarEvent {
  id: string;
  batchId: string;
  batchName: string;
  subject: string;
  teacherName: string;
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
  colorIndex: number;
}

const DAY_LABELS_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const ACCENT_BORDERS = [
  "border-l-blue-500",
  "border-l-amber-500",
  "border-l-rose-500",
  "border-l-emerald-500",
  "border-l-violet-500",
  "border-l-cyan-500",
];

const ACCENT_BG = [
  "bg-blue-50/90 dark:bg-blue-950/40",
  "bg-amber-50/90 dark:bg-amber-950/40",
  "bg-rose-50/90 dark:bg-rose-950/40",
  "bg-emerald-50/90 dark:bg-emerald-950/40",
  "bg-violet-50/90 dark:bg-violet-950/40",
  "bg-cyan-50/90 dark:bg-cyan-950/40",
];

/** 8:00 – 20:00 window for the grid */
const GRID_START_MIN = 8 * 60;
const GRID_END_MIN = 20 * 60;

function parseScheduleItems(schedule: string): ScheduleItem[] | null {
  if (!schedule?.trim()) return null;
  try {
    const parsed = JSON.parse(schedule);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter(
        (item: ScheduleItem) =>
          item &&
          typeof item.day === "string" &&
          item.day.trim() !== "" &&
          item.startTime &&
          item.endTime
      );
    }
  } catch {
    /* legacy string */
  }
  return null;
}

function normalizeDayIndex(day: string): number {
  const d = day.trim().toLowerCase();
  const map: Record<string, number> = {
    monday: 0,
    mon: 0,
    tuesday: 1,
    tue: 1,
    wednesday: 2,
    wed: 2,
    thursday: 3,
    thu: 3,
    thur: 3,
    friday: 4,
    fri: 4,
    saturday: 5,
    sat: 5,
    sunday: 6,
    sun: 6,
  };
  return map[d] ?? -1;
}

function timeToMinutes(t: string): number {
  const trimmed = t.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return 9 * 60;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ap = match[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function minutesToLabel(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${min.toString().padStart(2, "0")} ${ap}`;
}

function startOfWeekMonday(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildEventsFromBatches(
  batches: Batch[],
  colorMap: Map<string, number>
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  let colorCounter = 0;

  for (const batch of batches) {
    const items = parseScheduleItems(batch.schedule);
    if (!items) continue;

    for (const item of items) {
      const dayIndex = normalizeDayIndex(item.day);
      if (dayIndex < 0) continue;

      let startM = timeToMinutes(item.startTime);
      let endM = timeToMinutes(item.endTime);
      if (endM <= startM) endM = startM + 60;
      startM = Math.max(GRID_START_MIN, startM);
      endM = Math.min(GRID_END_MIN, Math.max(endM, startM + 15));

      let ci = colorMap.get(batch.id);
      if (ci === undefined) {
        ci = colorCounter++ % ACCENT_BORDERS.length;
        colorMap.set(batch.id, ci);
      }

      events.push({
        id: `${batch.id}-${dayIndex}-${item.startTime}-${item.endTime}`,
        batchId: batch.id,
        batchName: batch.name,
        subject: batch.subject,
        teacherName: batch.teacher?.name ?? "—",
        dayIndex,
        startMinutes: startM,
        endMinutes: endM,
        colorIndex: ci,
      });
    }
  }
  return events;
}

export default function StudentSchedulePage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "month" | "agenda">("week");
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selectedMonthDate, setSelectedMonthDate] = useState(() => new Date());

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const events = useMemo(() => {
    const colorMap = new Map<string, number>();
    return buildEventsFromBatches(batches, colorMap);
  }, [batches]);

  const weekStart = useMemo(() => startOfWeekMonday(weekAnchor), [weekAnchor]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const today = new Date();
  
  const legacySchedules = useMemo(() => {
    return batches.filter((b) => !parseScheduleItems(b.schedule));
  }, [batches]);

  const agendaItems = useMemo(() => {
    const list: { day: string; batch: Batch; items: ScheduleItem[] }[] = [];
    for (const b of batches) {
      const items = parseScheduleItems(b.schedule);
      if (items?.length) {
        list.push({
          day: items.map((i) => `${i.day.slice(0, 3)} ${i.startTime}-${i.endTime}`).join(" · "),
          batch: b,
          items,
        });
      }
    }
    return list.sort((a, b) => a.batch.name.localeCompare(b.batch.name));
  }, [batches]);

  const monthMatrix = useMemo(() => {
    const y = weekAnchor.getFullYear();
    const m = weekAnchor.getMonth();
    const first = new Date(y, m, 1);
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const start = new Date(first);
    start.setDate(first.getDate() - startPad);

    const weeks: Date[][] = [];
    let cur = new Date(start);
    for (let w = 0; w < 6; w++) {
      const row: Date[] = [];
      for (let d = 0; d < 7; d++) {
        row.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(row);
    }
    return { weeks, month: m, year: y };
  }, [weekAnchor]);

  const eventsByDayIndex = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    events.forEach((e) => {
      map[e.dayIndex].push(e);
    });
    Object.keys(map).forEach((k) => {
      map[Number(k)].sort((a, b) => a.startMinutes - b.startMinutes);
    });
    return map;
  }, [events]);

  const goPrevWeek = () => {
    const n = new Date(weekAnchor);
    n.setDate(n.getDate() - 7);
    setWeekAnchor(n);
  };

  const goNextWeek = () => {
    const n = new Date(weekAnchor);
    n.setDate(n.getDate() + 7);
    setWeekAnchor(n);
  };

  const goPrevMonth = () => {
    const d = new Date(weekAnchor);
    d.setMonth(d.getMonth() - 1);
    setWeekAnchor(d);
  };

  const goNextMonth = () => {
    const d = new Date(weekAnchor);
    d.setMonth(d.getMonth() + 1);
    setWeekAnchor(d);
  };

  const goToday = () => setWeekAnchor(new Date());

  const rangeLabel = `${weekDays[0].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${weekDays[6].toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  const monthTitle = weekAnchor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FB] dark:bg-background pt-8 sm:pt-10">
      <div className="mx-auto max-w-[1600px] px-4 pb-6 sm:px-6 lg:px-8">
        {/* Compact Top Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-foreground">
              My Schedule
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track your upcoming classes and sessions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Tabs
              value={view}
              onValueChange={(v) => setView(v as typeof view)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid h-10 w-full grid-cols-3 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/50 dark:bg-card dark:ring-border">
                <TabsTrigger value="week" className="rounded-lg px-3 text-[11px] sm:text-xs tracking-wide">Week</TabsTrigger>
                <TabsTrigger value="month" className="rounded-lg px-3 text-[11px] sm:text-xs tracking-wide">Month</TabsTrigger>
                <TabsTrigger value="agenda" className="rounded-lg px-3 text-[11px] sm:text-xs tracking-wide">Agenda</TabsTrigger>
              </TabsList>
            </Tabs>

            {view !== "agenda" && (
              <div className="flex h-10 items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-border dark:bg-card">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={view === "week" ? goPrevWeek : goPrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex min-w-[150px] items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {view === "week" ? rangeLabel : monthTitle}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={view === "week" ? goNextWeek : goNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-border" />
                <Button variant="ghost" size="sm" className="h-8 rounded-lg px-3 text-xs font-semibold text-[#2D46B9] hover:text-[#2D46B9]" onClick={goToday}>
                  Today
                </Button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-24 shadow-sm ring-1 ring-slate-200/60 dark:bg-card dark:ring-border">
            <Loader2 className="h-10 w-10 animate-spin text-[#2D46B9]" />
            <p className="mt-4 text-sm font-medium text-slate-500">Loading your schedule…</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-24 shadow-sm ring-1 ring-slate-200/60 dark:bg-card dark:ring-border">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-muted/50">
              <GraduationCap className="h-8 w-8 text-slate-400" />
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
              No classes currently scheduled
            </p>
            <p className="mt-1 text-sm text-slate-500">
              You aren't enrolled in any active batches.
            </p>
          </div>
        ) : (
          <>
            {view === "week" && (
              <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 dark:bg-card dark:ring-border sm:p-6">
                <div className="flex flex-col gap-6">
                  {DAY_ORDER.map((_, dayIdx) => {
                    const dayEvents = eventsByDayIndex[dayIdx] ?? [];
                    const dateObj = weekDays[dayIdx];
                    const isToday = isSameDay(dateObj, today);

                    return (
                      <div
                        key={dayIdx}
                        className="flex flex-col gap-4 border-b border-slate-100 pb-6 last:border-0 dark:border-border/60 sm:flex-row"
                      >
                        {/* Day Label Sidebar */}
                        <div className="w-20 shrink-0 pt-2">
                          <div
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              isToday ? "text-[#2D46B9] dark:text-primary" : "text-slate-400"
                            )}
                          >
                            {DAY_LABELS_SHORT[dayIdx]}
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 text-2xl font-bold tabular-nums",
                              isToday
                                ? "text-[#2D46B9] dark:text-primary"
                                : "text-slate-800 dark:text-foreground"
                            )}
                          >
                            {dateObj.getDate()}
                          </div>
                          {isToday && (
                            <div className="mt-1.5 h-1 w-4 rounded-full bg-[#2D46B9] dark:bg-primary" />
                          )}
                        </div>

                        {/* Events Flex Container */}
                        <div className="flex flex-1 flex-wrap content-start items-start gap-4">
                          {dayEvents.length === 0 ? (
                            <div className="flex h-[88px] w-full max-w-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 dark:border-border dark:bg-muted/20">
                              <CalendarOff className="mb-1.5 h-5 w-5 text-slate-300" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                No sessions
                              </span>
                            </div>
                          ) : (
                            dayEvents.map((ev) => {
                              const ci = ev.colorIndex % ACCENT_BORDERS.length;
                              const now = new Date();
                              const isNowSlot =
                                dayIdx === (now.getDay() === 0 ? 6 : now.getDay() - 1) &&
                                isSameDay(dateObj, today) &&
                                now.getHours() * 60 + now.getMinutes() >= ev.startMinutes &&
                                now.getHours() * 60 + now.getMinutes() < ev.endMinutes;

                              return (
                                <div
                                  key={ev.id}
                                  className={cn(
                                    "w-full max-w-[240px] shrink-0 rounded-xl border border-slate-200/80 p-3 shadow-sm transition hover:shadow-md dark:border-border sm:w-[240px]",
                                    ACCENT_BORDERS[ci],
                                    "border-l-4",
                                    isNowSlot ? ACCENT_BG[ci] : "bg-white dark:bg-card",
                                    isNowSlot &&
                                      "ring-2 ring-[#2D46B9] dark:ring-primary"
                                  )}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                      {minutesToLabel(ev.startMinutes)} –{" "}
                                      {minutesToLabel(ev.endMinutes)}
                                    </div>
                                    {isNowSlot && (
                                      <Badge className="bg-[#2D46B9] px-1.5 text-[9px] uppercase tracking-wider text-white hover:bg-[#2D46B9]">
                                        Now
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-1.5 truncate text-sm font-bold text-slate-900 dark:text-foreground">
                                    {ev.subject}
                                  </div>
                                  <div className="mt-1 flex items-center justify-between">
                                    <div className="truncate pr-2 text-xs font-medium text-slate-600 dark:text-muted-foreground">
                                      {ev.teacherName}
                                    </div>
                                    <div className="shrink-0 truncate rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-muted dark:text-muted-foreground">
                                      {ev.batchName}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "month" && (
              <div className="flex flex-col items-start gap-6 lg:flex-row">
                {/* 2/3 Width Calendar Grid */}
                <div className="flex-1 lg:sticky lg:top-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 dark:bg-card dark:ring-border w-full">
                  <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90 dark:border-border dark:bg-muted/30">
                    {DAY_LABELS_SHORT.map((d) => (
                      <div
                        key={d}
                        className="p-2 sm:p-3 text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  {monthMatrix.weeks.map((row, wi) => (
                    <div
                      key={wi}
                      className="grid grid-cols-7 border-b border-slate-100 last:border-b-0 dark:border-border/60"
                    >
                      {row.map((cellDate) => {
                        const inMonth = cellDate.getMonth() === monthMatrix.month;
                        const isTodayCell = isSameDay(cellDate, today);
                        const isSelected = isSameDay(cellDate, selectedMonthDate);
                        const dow = cellDate.getDay() === 0 ? 6 : cellDate.getDay() - 1;
                        const dayEvents = events.filter((e) => e.dayIndex === dow);

                        return (
                          <div
                            key={cellDate.toISOString()}
                            onClick={() => setSelectedMonthDate(cellDate)}
                            className={cn(
                              "relative min-h-[70px] sm:min-h-[110px] cursor-pointer border-r border-slate-100 p-1 sm:p-2 transition-colors last:border-r-0 hover:bg-slate-50 dark:border-border/50 dark:hover:bg-muted/30",
                              !inMonth && "bg-slate-50/30 text-slate-400 dark:bg-muted/10",
                              isTodayCell && "bg-blue-50/30 dark:bg-primary/5",
                              isSelected && "bg-blue-50/80 ring-1 ring-inset ring-[#2D46B9] dark:bg-primary/20 dark:ring-primary/50"
                            )}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between items-center gap-0.5">
                              <span
                                className={cn(
                                  "text-xs sm:text-sm font-bold",
                                  inMonth
                                    ? "text-slate-900 dark:text-foreground"
                                    : "text-slate-400 dark:text-slate-600",
                                  isTodayCell && "text-[#2D46B9] dark:text-primary"
                                )}
                              >
                                {cellDate.getDate()}
                              </span>
                              {isTodayCell && (
                                <>
                                  <span className="hidden sm:flex h-4 items-center rounded bg-[#2D46B9] px-1 text-[8px] font-bold uppercase tracking-wider text-white">
                                    Today
                                  </span>
                                  <div className="sm:hidden h-1.5 w-1.5 rounded-full bg-[#2D46B9] dark:bg-primary" />
                                </>
                              )}
                            </div>

                            <div className="mt-1.5 sm:mt-2.5 flex flex-col items-center justify-center gap-0 sm:gap-0.5">
                              {dayEvents.length > 0 && inMonth && (
                                <>
                                  <span
                                    className={cn(
                                      "text-sm sm:text-xl font-black",
                                      isSelected
                                        ? "text-[#2D46B9] dark:text-primary"
                                        : "text-slate-700 dark:text-slate-200"
                                    )}
                                  >
                                    {dayEvents.length}
                                  </span>
                                  <span className="hidden sm:block text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                    Class{dayEvents.length !== 1 ? "es" : ""}
                                  </span>
                                  <div className="sm:hidden mt-0.5 h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-500" />
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* 1/3 Width Agenda Sidebar */}
                <div className="flex w-full shrink-0 flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60 dark:bg-card dark:ring-border lg:w-[320px] xl:w-[380px]">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Selected Agenda
                  </h3>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-foreground">
                      {selectedMonthDate.toLocaleDateString("en-US", {
                        weekday: "long",
                      })}
                    </h2>
                    <span className="text-sm font-semibold text-slate-500">
                      {selectedMonthDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    {(() => {
                      const dow =
                        selectedMonthDate.getDay() === 0 ? 6 : selectedMonthDate.getDay() - 1;
                      const selectedEvents = events
                        .filter((e) => e.dayIndex === dow)
                        .sort((a, b) => a.startMinutes - b.startMinutes);

                      if (selectedEvents.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 dark:border-border dark:bg-muted/30">
                            <span className="text-sm font-medium text-slate-400">
                              No sessions scheduled
                            </span>
                          </div>
                        );
                      }

                      return selectedEvents.map((ev) => {
                        const ci = ev.colorIndex % ACCENT_BORDERS.length;
                        return (
                          <div
                            key={ev.id}
                            className={cn(
                              "relative rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-all hover:bg-white hover:shadow-sm dark:border-border dark:bg-muted/20 dark:hover:bg-card",
                              ACCENT_BORDERS[ci],
                              "border-l-4"
                            )}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500">
                              <span>
                                {minutesToLabel(ev.startMinutes)} -{" "}
                                {minutesToLabel(ev.endMinutes)}
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-bold text-slate-900 dark:text-foreground">
                              {ev.subject}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between">
                              <span className="truncate pr-2 text-xs font-medium text-slate-600 dark:text-muted-foreground">
                                {ev.teacherName}
                              </span>
                              <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-200/50 dark:bg-background dark:ring-border">
                                {ev.batchName}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {view === "agenda" && (
              <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 dark:bg-card dark:ring-border sm:p-6">
                {agendaItems.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <Filter className="h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm font-medium text-slate-600">
                      No structured schedule entries
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      You have no upcoming scheduled sessions.
                    </p>
                  </div>
                ) : (
                  agendaItems.map(({ batch, day, items }) => (
                    <div
                      key={batch.id}
                      className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-border dark:bg-muted/20 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2D46B9]/10 text-[#2D46B9] dark:bg-primary/15 dark:text-primary">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-foreground">
                            {batch.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{batch.subject}</p>
                          <p className="mt-1 text-xs text-slate-600">
                            {batch.teacher?.name ?? "Teacher TBD"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <Badge variant="secondary" className="mb-1 rounded-lg font-normal">
                          {items.length} slot{items.length !== 1 ? "s" : ""}
                        </Badge>
                        <p className="max-w-md text-xs text-slate-600 dark:text-muted-foreground">
                          {day}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Legacy plain-text schedules */}
            {legacySchedules.length > 0 && (
              <div className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <CalendarDays className="h-5 w-5" />
                  <span className="font-semibold">Additional Schedule Info</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {legacySchedules.map((b) => (
                    <li
                      key={b.id}
                      className="rounded-lg bg-white/80 px-3 py-2 text-sm dark:bg-background/80"
                    >
                      <span className="font-medium">{b.name}</span>
                      <span className="text-muted-foreground"> — </span>
                      <span className="font-mono text-xs">{b.schedule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
