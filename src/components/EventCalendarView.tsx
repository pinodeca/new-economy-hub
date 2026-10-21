"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEntry, EventCalendar, UpcomingEvent } from "@/lib/content";

// A month grid of upcoming events. Every occurrence is worked out at build
// time (getEventCalendar in lib/content.ts); this pages through months,
// applies the list's filters, and opens an event's details in a dialog.
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
  const [monthIndex, setMonthIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const timeZone = useMemo(() => viewerZone(), []);
  const today = useMemo(() => localDate(new Date(), timeZone), [timeZone]);
  const placed = useMemo(() => place(calendar.entries, timeZone), [calendar.entries, timeZone]);

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
  const goToMonth = (index: number) => {
    setMonthIndex(index);
    setSelectedDay(null);
  };
  const openEvent = openSlug ? bySlug.get(openSlug) : undefined;
  const selectedEntries = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50" aria-live="polite">
          {MONTH_NAMES[month]} {year}
        </h2>
        <div className="flex gap-2">
          <NavButton disabled={monthIndex === 0} onClick={() => goToMonth(monthIndex - 1)} label="Previous month">
            ‹
          </NavButton>
          <NavButton
            disabled={monthIndex === calendar.months.length - 1}
            onClick={() => goToMonth(monthIndex + 1)}
            label="Next month"
          >
            ›
          </NavButton>
        </div>
      </div>

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
