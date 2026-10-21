"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEntry, EventCalendar, UpcomingEvent } from "@/lib/content";

// The events page's calendar: a month grid, or a week agenda that shows
// every title and time in the week at once (the default on phones, where
// the month grid only has room for dots). Every occurrence is worked out at
// build time (getEventCalendar in lib/content.ts); this pages through
// months or weeks, applies the list's filters, and opens an event's
// details in a dialog.
//
// Timed entries are shown in the VIEWER's timezone — times and days both,
// so two events an hour apart never look simultaneous, and a 6pm Pacific
// event lands on the next morning for someone in Europe. That's only safe
// because this component never prerenders: the events page starts on the
// list and switches here after mount (EventList's useViewFromHash), so the
// browser's timezone can't disagree with server HTML. All-day entries stay
// on their own dates. Calendar dates are "YYYY-MM-DD" strings, handled with
// UTC getters so the grid itself never shifts.

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MAX_CHIPS = 3;
const DAY_MS = 86_400_000;
/** Tailwind's `sm` breakpoint: below it, the calendar opens on the week view. */
const PHONE_QUERY = "(max-width: 639px)";

type Mode = "month" | "week";

/** A calendar entry placed in the viewer's timezone. */
interface PlacedEntry {
  slug: string;
  /** Viewer-local date the entry shows on. */
  date: string;
  /** "6pm", or undefined for all-day. */
  startLabel?: string;
  /** "6pm–7:30pm", or undefined for all-day. */
  rangeLabel?: string;
  /** Sort key: all-day first, then by start instant. */
  sortKey: number;
}

function viewerZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Viewer-local "YYYY-MM-DD" for an instant. */
function localDate(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Compact viewer-local clock time: "6pm", "12:50pm". */
function clock(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const minute = get("minute");
  return `${get("hour")}${minute === "00" ? "" : `:${minute}`}${get("dayPeriod").toLowerCase()}`;
}

/**
 * The viewer's timezone for the note under the grid, e.g. "Eastern Time" or
 * "Central European Time" — the generic name, which stays true across a DST
 * change inside the months on screen (an abbreviation like "EDT" wouldn't).
 */
function zoneName(timeZone: string): string {
  return (
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longGeneric" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value ?? timeZone
  );
}

function place(entries: CalendarEntry[], timeZone: string): PlacedEntry[] {
  return entries
    .map((entry) => {
      if (!entry.start) return { slug: entry.slug, date: entry.date, sortKey: -Infinity };
      const start = new Date(entry.start);
      const startLabel = clock(start, timeZone);
      return {
        slug: entry.slug,
        date: localDate(start, timeZone),
        startLabel,
        rangeLabel: entry.end ? `${startLabel}–${clock(new Date(entry.end), timeZone)}` : startLabel,
        sortKey: start.getTime(),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.sortKey - b.sortKey);
}

function parseDay(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate(), weekday: d.getUTCDay() };
}

function longDate(date: string) {
  const { month, day, weekday } = parseDay(date);
  return `${WEEKDAY_LONG[weekday]}, ${MONTH_NAMES[month]} ${day}`;
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** The Sunday a date's week starts on — weeks run Sunday-Saturday, like the month grid. */
function weekStartOf(date: string): string {
  return addDays(date, -parseDay(date).weekday);
}

/** "Oct 18 – 24, 2026", "Oct 25 – Nov 1, 2026", "Dec 27, 2026 – Jan 2, 2027". */
function weekLabel(start: string): string {
  const a = parseDay(start);
  const b = parseDay(addDays(start, 6));
  const short = (m: number) => MONTH_NAMES[m].slice(0, 3);
  if (a.year !== b.year) return `${short(a.month)} ${a.day}, ${a.year} – ${short(b.month)} ${b.day}, ${b.year}`;
  if (a.month !== b.month) return `${short(a.month)} ${a.day} – ${short(b.month)} ${b.day}, ${b.year}`;
  return `${short(a.month)} ${a.day} – ${b.day}, ${b.year}`;
}

/** The month's days, padded with nulls to start on Sunday and fill the last week. */
function monthCells(monthStart: string): (string | null)[] {
  const { year, month, weekday } = parseDay(monthStart);
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(weekday).fill(null);
  for (let day = 1; day <= days; day++) {
    cells.push(new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function EventCalendarView({
  events,
  calendar,
  renderEvent,
}: {
  events: UpcomingEvent[];
  calendar: EventCalendar;
  renderEvent: (event: UpcomingEvent) => React.ReactNode;
}) {
  // Safe to read window here: this component only ever renders in the
  // browser (see the note at the top of the file).
  const [mode, setMode] = useState<Mode>(() => (window.matchMedia(PHONE_QUERY).matches ? "week" : "month"));
  const [monthIndex, setMonthIndex] = useState(0);
  const [weekIndex, setWeekIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const timeZone = useMemo(() => viewerZone(), []);
  const today = useMemo(() => localDate(new Date(), timeZone), [timeZone]);
  const placed = useMemo(() => place(calendar.entries, timeZone), [calendar.entries, timeZone]);
  // Weeks from this one through the one holding the last day of the last
  // month the calendar covers.
  const firstWeek = weekStartOf(today);
  const lastMonth = parseDay(calendar.months[calendar.months.length - 1]);
  const lastDay = new Date(Date.UTC(lastMonth.year, lastMonth.month + 1, 0)).toISOString().slice(0, 10);
  const weekCount = Math.round((Date.parse(weekStartOf(lastDay)) - Date.parse(firstWeek)) / (7 * DAY_MS)) + 1;

  const bySlug = new Map(events.map((event) => [event.slug, event]));
  const byDay = new Map<string, PlacedEntry[]>();
  for (const entry of placed) {
    if (!bySlug.has(entry.slug)) continue; // filtered out
    byDay.set(entry.date, [...(byDay.get(entry.date) ?? []), entry]);
  }

  const monthStart = calendar.months[monthIndex];
  const { year, month } = parseDay(monthStart);
  const monthPrefix = monthStart.slice(0, 7);
  const monthHasEvents = [...byDay.keys()].some((date) => date.startsWith(monthPrefix));
  const weekStart = addDays(firstWeek, weekIndex * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekHasEvents = weekDays.some((date) => byDay.has(date));

  const goToMonth = (index: number) => {
    setMonthIndex(index);
    setSelectedDay(null);
  };
  // Switching views keeps you near the same dates: month -> the first week
  // of that month you can see (or this week); week -> that week's month.
  const switchMode = (next: Mode) => {
    if (next === mode) return;
    if (next === "week") {
      const target = monthIndex === 0 ? firstWeek : weekStartOf(monthStart);
      setWeekIndex(Math.max(0, Math.round((Date.parse(target) - Date.parse(firstWeek)) / (7 * DAY_MS))));
    } else {
      const index = calendar.months.indexOf(`${weekStart.slice(0, 7)}-01`);
      setMonthIndex(index === -1 ? 0 : index);
    }
    setSelectedDay(null);
    setMode(next);
  };
  const openEvent = openSlug ? bySlug.get(openSlug) : undefined;
  const selectedEntries = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  const atStart = mode === "month" ? monthIndex === 0 : weekIndex === 0;
  const atEnd = mode === "month" ? monthIndex === calendar.months.length - 1 : weekIndex === weekCount - 1;
  const step = (delta: number) => (mode === "month" ? goToMonth(monthIndex + delta) : setWeekIndex(weekIndex + delta));

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50" aria-live="polite">
          {mode === "month" ? `${MONTH_NAMES[month]} ${year}` : weekLabel(weekStart)}
        </h2>
        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} onChange={switchMode} />
          <NavButton disabled={atStart} onClick={() => step(-1)} label={`Previous ${mode}`}>
            ‹
          </NavButton>
          <NavButton disabled={atEnd} onClick={() => step(1)} label={`Next ${mode}`}>
            ›
          </NavButton>
        </div>
      </div>

      {mode === "week" ? (
        <WeekAgenda
          days={weekDays}
          byDay={byDay}
          bySlug={bySlug}
          today={today}
          onOpenEvent={setOpenSlug}
        />
      ) : (
        <>
        <div className="mt-4 grid grid-cols-7 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800" style={{ gap: "1px" }}>
          {WEEKDAY_SHORT.map((name) => (
            <div
              key={name}
              className="bg-zinc-50 py-1.5 text-center text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {name}
            </div>
          ))}
          {monthCells(monthStart).map((date, i) =>
            date === null ? (
              <div key={`pad-${i}`} className="bg-zinc-50 dark:bg-zinc-900/60" />
            ) : (
              <DayCell
                key={date}
                date={date}
                entries={byDay.get(date) ?? []}
                bySlug={bySlug}
                isToday={date === today}
                isPast={date < today}
                isSelected={date === selectedDay}
                onSelectDay={() => setSelectedDay(date === selectedDay ? null : date)}
                onOpenEvent={setOpenSlug}
              />
            ),
          )}
        </div>

        {!monthHasEvents && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            {events.length === 0 ? "No events match these filters." : "Nothing listed this month."}
          </p>
        )}

        {selectedDay && (
          <section className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{longDate(selectedDay)}</h3>
            {selectedEntries.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">Nothing on this day.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1">
                {selectedEntries.map((entry) => (
                  <li key={entry.slug}>
                    <button
                      type="button"
                      onClick={() => setOpenSlug(entry.slug)}
                      className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <span className="text-zinc-500 dark:text-zinc-400">{entry.rangeLabel ?? "All day"}</span>
                      <span className="ml-2 text-zinc-950 dark:text-zinc-50">{bySlug.get(entry.slug)?.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        </>
      )}

      {mode === "week" && !weekHasEvents && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
          {events.length === 0 ? "No events match these filters." : "Nothing listed this week."}
        </p>
      )}

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
        Times are in your timezone ({zoneName(timeZone)}). Recurring events whose
        dates vary show only their next confirmed date.
      </p>

      <EventDialog event={openEvent} onClose={() => setOpenSlug(null)}>
        {openEvent && renderEvent(openEvent)}
      </EventDialog>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  const option = (value: Mode, label: string) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={mode === value}
      className={
        mode === value
          ? "rounded px-2 py-0.5 text-xs font-medium text-zinc-950 bg-white shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
          : "rounded px-2 py-0.5 text-xs text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
      }
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Calendar range" className="flex rounded-md bg-zinc-100 p-0.5 dark:bg-zinc-900">
      {option("month", "Month")}
      {option("week", "Week")}
    </div>
  );
}

/**
 * Seven days with every event's time and full title. Stacked on phones, so
 * nothing truncates; side by side as columns from `sm` up, titles wrapping.
 */
function WeekAgenda({
  days,
  byDay,
  bySlug,
  today,
  onOpenEvent,
}: {
  days: string[];
  byDay: Map<string, PlacedEntry[]>;
  bySlug: Map<string, UpcomingEvent>;
  today: string;
  onOpenEvent: (slug: string) => void;
}) {
  return (
    <ol className="mt-4 flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid sm:grid-cols-7 dark:border-zinc-800 dark:bg-zinc-800" style={{ gap: "1px" }}>
      {days.map((date) => {
        const { day, weekday } = parseDay(date);
        const entries = byDay.get(date) ?? [];
        const isToday = date === today;
        const isPast = date < today;
        return (
          <li key={date} className="flex min-w-0 flex-col bg-white p-2 sm:min-h-40 dark:bg-zinc-950" aria-label={longDate(date)}>
            <div className={`flex items-baseline gap-1.5 text-xs ${isPast ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-500 dark:text-zinc-400"}`}>
              <span className="font-medium">{WEEKDAY_SHORT[weekday]}</span>
              <span
                className={
                  isToday
                    ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : ""
                }
              >
                {day}
              </span>
              {isToday && <span className="sm:hidden">Today</span>}
            </div>
            {entries.length === 0 ? (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">{isPast ? "" : "Nothing listed"}</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1">
                {entries.map((entry) => (
                  <li key={entry.slug}>
                    <button
                      type="button"
                      onClick={() => onOpenEvent(entry.slug)}
                      className="w-full rounded px-1.5 py-1 text-left text-sm leading-snug hover:bg-zinc-100 sm:bg-zinc-100 sm:text-xs sm:hover:bg-zinc-200 dark:hover:bg-zinc-900 sm:dark:bg-zinc-800 sm:dark:hover:bg-zinc-700"
                    >
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">{entry.rangeLabel ?? "All day"}</span>
                      <span className="text-zinc-900 hyphens-auto [overflow-wrap:break-word] dark:text-zinc-100">{bySlug.get(entry.slug)?.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function NavButton({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="h-8 w-8 rounded-md border border-zinc-200 text-lg leading-none text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {children}
    </button>
  );
}

function DayCell({
  date,
  entries,
  bySlug,
  isToday,
  isPast,
  isSelected,
  onSelectDay,
  onOpenEvent,
}: {
  date: string;
  entries: PlacedEntry[];
  bySlug: Map<string, UpcomingEvent>;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  onSelectDay: () => void;
  onOpenEvent: (slug: string) => void;
}) {
  const { day } = parseDay(date);
  const hidden = entries.length - MAX_CHIPS;
  const label = `${longDate(date)}: ${entries.length === 0 ? "no events" : `${entries.length} event${entries.length === 1 ? "" : "s"}`}`;
  return (
    <div
      className={`flex min-h-16 flex-col gap-1 p-1 sm:min-h-24 ${
        isSelected ? "bg-zinc-100 dark:bg-zinc-900" : "bg-white dark:bg-zinc-950"
      }`}
    >
      {/* The day number selects the day (and is the only control on phones,
          where the chips below are hidden in favour of dots). */}
      <button
        type="button"
        onClick={onSelectDay}
        aria-label={label}
        aria-pressed={isSelected}
        className={`flex items-center gap-1 self-stretch rounded px-1 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
          isPast ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        <span
          className={
            isToday
              ? "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
              : ""
          }
        >
          {day}
        </span>
        {entries.length > 0 && (
          <span className="flex gap-0.5 sm:hidden" aria-hidden>
            {entries.slice(0, 3).map((entry) => (
              <span key={entry.slug} className="h-1.5 w-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400" />
            ))}
          </span>
        )}
      </button>
      <ul className="hidden flex-col gap-0.5 sm:flex">
        {entries.slice(0, MAX_CHIPS).map((entry) => (
          <li key={entry.slug}>
            <button
              type="button"
              onClick={() => onOpenEvent(entry.slug)}
              title={bySlug.get(entry.slug)?.title}
              className="block w-full truncate rounded bg-zinc-100 px-1.5 py-0.5 text-left text-xs text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {entry.startLabel && (
                <span className="text-zinc-500 dark:text-zinc-400">{entry.startLabel} </span>
              )}
              {bySlug.get(entry.slug)?.title}
            </button>
          </li>
        ))}
        {hidden > 0 && (
          <li>
            <button
              type="button"
              onClick={onSelectDay}
              className="px-1.5 text-left text-xs text-zinc-500 hover:underline dark:text-zinc-400"
            >
              +{hidden} more
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

/** An event's details in a native modal <dialog>: Esc and the backdrop close it. */
function EventDialog({
  event,
  onClose,
  children,
}: {
  event: UpcomingEvent | undefined;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (event && !dialog.open) dialog.showModal();
    if (!event && dialog.open) dialog.close();
  }, [event]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close(); // backdrop
      }}
      aria-label={event?.title}
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-lg border border-zinc-200 bg-white p-0 text-left shadow-xl backdrop:bg-zinc-950/50 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="max-h-[85vh] overflow-y-auto p-5">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="rounded-md px-2 text-xl leading-none text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
