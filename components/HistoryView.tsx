"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Role,
  Task,
  ChecklistEntry,
  ServiceDay,
  formatDateLabel,
  dayLabel,
} from "@/lib/types";

type DateGroup = {
  date: string;
  day: string;
  entries: ChecklistEntry[];
};

export default function HistoryView() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: r }, { data: t }, { data: e }] = await Promise.all([
        supabase.from("roles").select("*").order("sort_order"),
        supabase.from("tasks").select("*").order("sort_order"),
        supabase
          .from("checklist_entries")
          .select("*")
          .order("service_date", { ascending: false }),
      ]);
      setRoles(r ?? []);
      setTasks(t ?? []);

      const byDate = new Map<string, ChecklistEntry[]>();
      (e ?? []).forEach((entry) => {
        const list = byDate.get(entry.service_date) ?? [];
        list.push(entry);
        byDate.set(entry.service_date, list);
      });

      const grouped: DateGroup[] = Array.from(byDate.entries()).map(
        ([date, entries]) => ({
          date,
          day: entries[0]?.day ?? "",
          entries,
        })
      );
      grouped.sort((a, b) => (a.date < b.date ? 1 : -1));
      setGroups(grouped);
      setLoading(false);
    }
    load();
  }, []);

  const selectedGroup = groups.find((g) => g.date === selectedDate);

  if (loading) {
    return (
      <div className="p-8 text-textMuted font-mono text-sm">Loading history…</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-gold font-mono text-xs tracking-widest uppercase mb-2">
          <span className="cue-light" data-checked="true" />
          Archive
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
          Past Services
        </h1>
        <p className="text-textMuted text-sm mt-1">
          Completion history, oldest checks preserved for the record.
        </p>
      </header>

      {groups.length === 0 && (
        <p className="text-textMuted text-sm">
          No history yet — once tasks are checked on the main board, they'll
          show up here.
        </p>
      )}

      {!selectedGroup && (
        <div className="bg-panel border border-hairline rounded-xl overflow-hidden">
          {groups.map((g) => {
            const done = g.entries.filter((e) => e.checked).length;
            return (
              <button
                key={g.date}
                onClick={() => setSelectedDate(g.date)}
                className="rundown-row w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-panelLight transition-colors"
              >
                <span className="flex-1">
                  <span className="font-display font-medium">
                    {formatDateLabel(g.date)}
                  </span>
                  <span className="font-mono text-xs text-textMuted ml-2 uppercase">
                    {dayLabel(g.day as ServiceDay)}
                  </span>
                </span>
                <span className="font-mono text-xs text-textMuted">
                  {done}/{g.entries.length} checked
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selectedGroup && (
        <div>
          <button
            onClick={() => setSelectedDate(null)}
            className="font-mono text-xs text-gold hover:underline uppercase tracking-wide mb-4"
          >
            ← All services
          </button>
          <h2 className="font-display font-medium text-xl mb-4">
            {formatDateLabel(selectedGroup.date)} —{" "}
            {dayLabel(selectedGroup.day as ServiceDay)}
          </h2>
          {roles.map((role) => {
            const roleTasks = tasks.filter((t) => t.role_id === role.id);
            if (roleTasks.length === 0) return null;
            return (
              <div
                key={role.id}
                className="bg-panel border border-hairline rounded-xl overflow-hidden mb-4"
              >
                <div className="px-5 py-3 border-b border-hairline font-display font-medium">
                  {role.name}
                </div>
                {roleTasks.map((task) => {
                  const entry = selectedGroup.entries.find(
                    (e) => e.task_id === task.id
                  );
                  const checked = !!entry?.checked;
                  return (
                    <div
                      key={task.id}
                      className="rundown-row flex items-center gap-3 px-5 py-3"
                    >
                      <span className="cue-light" data-checked={checked} />
                      <span
                        className={`flex-1 text-sm ${
                          checked ? "text-textMuted" : "text-textPrimary"
                        }`}
                      >
                        {task.description}
                      </span>
                      {checked && entry?.checked_by && (
                        <span className="font-mono text-[11px] text-live shrink-0">
                          ✓ {entry.checked_by}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <a
          href="/"
          className="font-mono text-xs text-gold hover:underline uppercase tracking-wide"
        >
          ← Back to this week
        </a>
      </div>
    </div>
  );
}
