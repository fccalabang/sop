export type Role = {
  id: string;
  name: string;
  sort_order: number;
};

export type Member = {
  id: string;
  name: string;
  role_id: string;
};

export type Task = {
  id: string;
  role_id: string;
  description: string;
  sort_order: number;
};

export type ServiceDay = "WED" | "SAT" | "SUN";

export type ChecklistEntry = {
  id: string;
  task_id: string;
  service_date: string; // ISO date, e.g. 2026-08-01
  day: ServiceDay;
  checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
};

export function dayLabel(day: ServiceDay): string {
  if (day === "WED") return "Wednesday";
  if (day === "SAT") return "Saturday";
  return "Sunday";
}

/** Returns WED/SAT/SUN if the given ISO date falls on one of those days, else null. */
export function getDayFromDate(iso: string): ServiceDay | null {
  const d = new Date(iso + "T00:00:00");
  const dow = d.getDay();
  if (dow === 3) return "WED";
  if (dow === 6) return "SAT";
  if (dow === 0) return "SUN";
  return null;
}

/** Returns the upcoming (or current) Wednesday, Saturday, and Sunday as ISO date strings. */
export function getCurrentWeek(): { wed: string; sat: string; sun: string } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 6 = Sat
  // Use local date components, not toISOString() (which converts to UTC and
  // can roll the date back by one in timezones ahead of UTC, e.g. UTC+8).
  const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  let satOffset: number;
  if (day === 6) satOffset = 0; // today is Saturday
  else if (day === 0) satOffset = -1; // today is Sunday, Sat was yesterday
  else satOffset = 6 - day; // upcoming Saturday

  const sat = new Date(now);
  sat.setDate(now.getDate() + satOffset);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);

  // Nearest Wednesday: today if today is Wednesday, otherwise the next one.
  const wedOffset = (3 - day + 7) % 7;
  const wed = new Date(now);
  wed.setDate(now.getDate() + wedOffset);

  return {
    wed: toISODate(wed),
    sat: toISODate(sat),
    sun: toISODate(sun),
  };
}

export function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
