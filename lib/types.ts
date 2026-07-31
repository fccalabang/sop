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

export type ServiceDay = "SAT" | "SUN";

export type ChecklistEntry = {
  id: string;
  task_id: string;
  service_date: string; // ISO date, e.g. 2026-08-01
  day: ServiceDay;
  checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
};

/** Returns the upcoming (or current) Saturday and Sunday as ISO date strings. */
export function getCurrentWeekend(): { sat: string; sun: string } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 6 = Sat
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  let satOffset: number;
  if (day === 6) satOffset = 0; // today is Saturday
  else if (day === 0) satOffset = -1; // today is Sunday, Sat was yesterday
  else satOffset = 6 - day; // upcoming Saturday

  const sat = new Date(now);
  sat.setDate(now.getDate() + satOffset);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);

  return { sat: toISODate(sat), sun: toISODate(sun) };
}

export function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
