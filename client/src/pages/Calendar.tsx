import { useQuery } from "@tanstack/react-query";
import { calendarApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/TopBar";
import { STATUS_LABELS, STATUS_COLORS, formatDate, isOverdue } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ListTodo,
  User,
  Building2,
} from "lucide-react";
import { useState, useMemo, memo, useCallback, useTransition } from "react";
import { Link } from "react-router-dom";

// ── Helpers ──────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isToday(day: number, month: Date, offset: number): boolean {
  const now = new Date();
  return (
    day === now.getDate() &&
    month.getMonth() === now.getMonth() &&
    month.getFullYear() === now.getFullYear()
  );
}

function getEventsForDay(
  day: number,
  eventsByDay: Record<number, CalendarEvent[]>,
): CalendarEvent[] {
  return eventsByDay[day] || [];
}

// ── Calendar Day Cell (memoized) ─────────────────────────

interface CalendarDayCellProps {
  day: number | null;
  isBlank: boolean;
  events: CalendarEvent[];
  isTodayDate: boolean;
  month: Date;
  className?: string;
}

const CalendarDayCell = memo(function CalendarDayCell({
  day,
  isBlank,
  events,
  isTodayDate,
}: CalendarDayCellProps) {
  if (isBlank || day === null) {
    return <div className="bg-muted/20 min-h-[90px] sm:min-h-[110px]" />;
  }

  const visible = events.slice(0, 3);
  const extra = events.length - 3;

  return (
    <div className="bg-card min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col gap-0.5 transition-colors hover:bg-accent/30 group">
      {/* Day number */}
      <div className="flex items-center justify-between mb-0.5">
        <span
          className={`inline-flex items-center justify-center text-sm font-bold leading-none w-7 h-7 rounded-full ${
            isTodayDate
              ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
              : "text-foreground"
          }`}
        >
          {day}
        </span>
        {events.length > 3 && (
          <span className="text-[10px] font-medium text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
            {extra}+
          </span>
        )}
      </div>

      {/* Task indicators */}
      <div className="flex-1 space-y-0.5 min-h-0">
        {visible.map((event) => {
          const overdue = isOverdue(event.date, event.status);
          return (
            <Link
              key={event.id}
              to={`/tasks/${event.id}`}
              className={`
                group/task relative block text-[10px] sm:text-[11px] leading-tight px-1.5 py-0.5 rounded truncate
                transition-colors
                ${
                  overdue
                    ? "bg-red-50 text-red-700 hover:bg-red-100 border-l-2 border-l-red-400"
                    : "bg-primary/5 text-primary hover:bg-primary/10 border-l-2 border-l-primary/40"
                }
              `}
              title={`${event.title} — ${event.client}\n${STATUS_LABELS[event.status] || event.status}`}
            >
              {event.form}
              {/* Tooltip on hover */}
              <span className="
                pointer-events-none absolute z-50 left-0 bottom-full mb-1.5
                opacity-0 group-hover/task:opacity-100 transition-opacity
                bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border
                px-3 py-2 w-56
              ">
                <p className="font-semibold truncate">{event.title || event.form}</p>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Building2 size={10} /> {event.client}
                </p>
                {event.assignee && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    <User size={10} /> {event.assignee}
                  </p>
                )}
                <p className="text-muted-foreground flex items-center gap-1">
                  <CalendarIcon size={10} /> {formatDate(event.date)}
                </p>
                <Badge className={`mt-1 ${STATUS_COLORS[event.status]}`}>
                  {STATUS_LABELS[event.status] || event.status}
                </Badge>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
});

// ── Skeleton ──────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 rounded-lg bg-muted" />
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted" />
          <div className="h-8 w-20 rounded-lg bg-muted" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 bg-muted/50" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted/10" />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────

export default function Calendar() {
  const [offset, setOffset] = useState(0);
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null);

  // Memoize date range
  const { startDate, endDate, currentMonth, monthLabel } = useMemo(() => {
    const now = new Date();
    const cm = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const sd = cm.toISOString().split("T")[0];
    const ed = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
      .toISOString()
      .split("T")[0];
    const ml = cm.toLocaleDateString("en-PH", {
      month: "long",
      year: "numeric",
    });
    return { startDate: sd, endDate: ed, currentMonth: cm, monthLabel: ml };
  }, [offset]);

  const {
    data: events = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["calendar", startDate, endDate],
    queryFn: () => calendarApi.list(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });

  // Calendar grid
  const { days, leadingBlanks, trailingBlanks } = useMemo(() => {
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    ).getDate();
    const firstDayOfWeek = currentMonth.getDay();
    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
    const trail = totalCells - firstDayOfWeek - daysInMonth;
    return {
      days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      leadingBlanks: Array.from({ length: firstDayOfWeek }, () => null),
      trailingBlanks: Array.from({ length: trail }, () => null),
    };
  }, [currentMonth]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        const day = new Date(event.date).getDate();
        if (!acc[day]) acc[day] = [];
        acc[day].push(event);
        return acc;
      },
      {} as Record<number, typeof events>,
    );
  }, [events]);

  const [, startTransition] = useTransition();

  // Navigate
  const goToPrev = useCallback(() => {
    startTransition(() => {
      setAnimDir("right");
      setOffset((o) => o - 1);
    });
  }, [startTransition]);
  const goToNext = useCallback(() => {
    startTransition(() => {
      setAnimDir("left");
      setOffset((o) => o + 1);
    });
  }, [startTransition]);
  const goToToday = useCallback(() => {
    startTransition(() => {
      setOffset(0);
      setAnimDir(null);
    });
  }, [startTransition]);

  // Upcoming: all events sorted by date, limit 10
  const upcoming = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [events]);

  return (
    <div className="h-full overflow-y-auto">
      <TopBar title="Calendar" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {isLoading ? (
          <CalendarSkeleton />
        ) : (
          <div className="flex flex-col xl:flex-row gap-6">
            {/* ─── Calendar ─── */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPrev}
                    className="p-2 rounded-lg hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={goToNext}
                    className="p-2 rounded-lg hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Next month"
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {monthLabel}
                </h2>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="gap-1.5"
                >
                  <CalendarIcon size={15} />
                  Today
                </Button>
              </div>

              {/* Calendar Grid */}
              <Card className="shadow-sm border-border/60 overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-7 gap-px bg-border/60">
                    {/* Weekday headers */}
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="bg-muted/40 px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60"
                      >
                        {day}
                      </div>
                    ))}

                    {/* Day cells with animation */}
                    <div
                      key={monthLabel}
                      className="contents"
                    >
                      {[...leadingBlanks, ...days, ...trailingBlanks].map(
                        (day, i) => (
                          <CalendarDayCell
                            key={i}
                            day={day}
                            isBlank={day === null}
                            events={day ? getEventsForDay(day, eventsByDay) : []}
                            isTodayDate={
                              day !== null ? isToday(day, currentMonth, offset) : false
                            }
                            month={currentMonth}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Sidebar – Upcoming Deadlines ─── */}
            <div className="w-full xl:w-80 shrink-0">
              <Card className="shadow-sm border-border/60 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ListTodo size={16} className="text-primary" />
                      Upcoming Deadlines
                    </CardTitle>
                    {isFetching && (
                      <Loader2
                        size={14}
                        className="animate-spin text-muted-foreground"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  {upcoming.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="p-3 rounded-full bg-muted mb-3">
                        <CalendarIcon
                          size={24}
                          className="text-muted-foreground"
                        />
                      </div>
                      <p className="text-sm font-medium">No deadlines</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        No tasks found for this month.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcoming.map((event) => {
                        const overdue = isOverdue(event.date, event.status);
                        return (
                          <Link
                            key={event.id}
                            to={`/tasks/${event.id}`}
                            className={`
                              block p-3 rounded-lg border transition-all
                              hover:shadow-sm hover:-translate-y-0.5
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                              ${
                                overdue
                                  ? "bg-red-50/60 border-red-200 hover:border-red-300"
                                  : "bg-card border-border/60 hover:border-border"
                              }
                            `}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                                  {overdue && (
                                    <AlertCircle
                                      size={13}
                                      className="text-destructive shrink-0"
                                    />
                                  )}
                                  {event.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 size={11} />
                                    {event.client}
                                  </span>
                                  {event.assignee && (
                                    <span className="flex items-center gap-1">
                                      <User size={11} />
                                      {event.assignee}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ArrowUpRight
                                size={14}
                                className="shrink-0 text-muted-foreground/40 mt-0.5"
                              />
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                              <span
                                className={`text-xs font-medium ${
                                  overdue
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {overdue ? "Overdue — " : ""}
                                {formatDate(event.date)}
                              </span>
                              <Badge
                                className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[event.status]}`}
                              >
                                {STATUS_LABELS[event.status] || event.status}
                              </Badge>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {upcoming.length > 0 && (
                    <Link
                      to="/tasks"
                      className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-2 border-t border-border/40"
                    >
                      View all tasks
                      <ArrowUpRight size={12} />
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Type import for the memoized cell
import type { CalendarEvent } from "@/types";
