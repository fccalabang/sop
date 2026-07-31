"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Role,
  Member,
  Task,
  ChecklistEntry,
  ServiceDay,
  getCurrentWeekend,
  formatDateLabel,
} from "@/lib/types";

export default function TaskBoard() {
  const { sat, sun } = useMemo(() => getCurrentWeekend(), []);
  const [day, setDay] = useState<ServiceDay>("SAT");
  const activeDate = day === "SAT" ? sat : sun;

  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<ChecklistEntry[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  useEffect(() => {
    async function loadStatic() {
      const [{ data: r }, { data: m }, { data: t }] = await Promise.all([
        supabase.from("roles").select("*").order("sort_order"),
        supabase.from("members").select("*").order("name"),
        supabase.from("tasks").select("*").order("sort_order"),
      ]);
      setRoles(r ?? []);
      setMembers(m ?? []);
      setTasks(t ?? []);
      setLoading(false);
    }
    loadStatic();
  }, []);

  useEffect(() => {
    async function loadEntries() {
      const { data } = await supabase
        .from("checklist_entries")
        .select("*")
        .eq("service_date", activeDate);
      setEntries(data ?? []);
    }
    loadEntries();
  }, [activeDate]);

  async function toggleTask(task: Task) {
    if (!selectedMember) return;
    const existing = entries.find((e) => e.task_id === task.id);
    const nextChecked = !existing?.checked;

    const payload = {
      task_id: task.id,
      service_date: activeDate,
      day,
      checked: nextChecked,
      checked_by: nextChecked ? selectedMember.name : null,
      checked_at: nextChecked ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("checklist_entries")
      .upsert(payload, { onConflict: "task_id,service_date" })
      .select()
      .single();

    if (!error && data) {
      setEntries((prev) => {
        const others = prev.filter((e) => e.task_id !== task.id);
        return [...others, data as ChecklistEntry];
      });
    }
  }

  const tasksForSelectedRole = tasks.filter(
    (t) => t.role_id === selectedMember?.role_id
  );

  const roleCompletion = roles.map((role) => {
    const roleTasks = tasks.filter((t) => t.role_id === role.id);
    const done = roleTasks.filter((t) =>
      entries.find((e) => e.task_id === t.id && e.checked)
    ).length;
    return { role, done, total: roleTasks.length };
  });

  if (loading) {
    return (
      <div className="p-8 text-textMuted font-mono text-sm">
        Loading rundown…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Masthead */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-gold font-mono text-xs tracking-widest uppercase mb-2">
          <span className="cue-light" data-checked="true" />
          On Air Prep
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
          Media Team Rundown
        </h1>
        <p className="text-textMuted text-sm mt-1">
          Weekend service checklist — Free Christian Church of Alabang
        </p>
      </header>

      {/* Day tabs */}
      <div className="flex gap-2 mb-6">
        {(["SAT", "SUN"] as ServiceDay[]).map((d) => {
          const dateForTab = d === "SAT" ? sat : sun;
          const active = d === day;
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                active
                  ? "border-gold bg-panelLight"
                  : "border-hairline bg-panel hover:bg-panelLight"
              }`}
            >
              <div className="font-mono text-xs text-textMuted uppercase tracking-wide">
                {d === "SAT" ? "Saturday" : "Sunday"}
              </div>
              <div className="font-display font-medium">
                {formatDateLabel(dateForTab)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Name picker */}
      <div className="mb-6">
        <label className="block font-mono text-xs text-textMuted uppercase tracking-wide mb-2">
          Who's checking in?
        </label>
        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="w-full bg-panel border border-hairline rounded-lg px-4 py-3 text-textPrimary font-body focus:border-gold outline-none"
        >
          <option value="">Select your name…</option>
          {members.map((m) => {
            const role = roles.find((r) => r.id === m.role_id);
            return (
              <option key={m.id} value={m.id}>
                {m.name} — {role?.name ?? "Unassigned"}
              </option>
            );
          })}
        </select>
      </div>

      {/* Task rundown for selected member */}
      {selectedMember ? (
        <div className="bg-panel border border-hairline rounded-xl overflow-hidden mb-8">
          <div className="px-5 py-3 border-b border-hairline flex items-center justify-between">
            <span className="font-display font-medium">
              {roles.find((r) => r.id === selectedMember.role_id)?.name}
            </span>
            <span className="font-mono text-xs text-textMuted">
              {tasksForSelectedRole.filter((t) =>
                entries.find((e) => e.task_id === t.id && e.checked)
              ).length}{" "}
              / {tasksForSelectedRole.length} done
            </span>
          </div>
          {tasksForSelectedRole.length === 0 && (
            <div className="px-5 py-6 text-textMuted text-sm">
              No tasks assigned to this role yet.
            </div>
          )}
          {tasksForSelectedRole.map((task) => {
            const entry = entries.find((e) => e.task_id === task.id);
            const checked = !!entry?.checked;
            return (
              <button
                key={task.id}
                onClick={() => toggleTask(task)}
                className="rundown-row w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-panelLight transition-colors"
              >
                <span className="cue-light" data-checked={checked} />
                <span
                  className={`flex-1 ${
                    checked ? "text-textMuted line-through" : "text-textPrimary"
                  }`}
                >
                  {task.description}
                </span>
                {checked && entry?.checked_by && (
                  <span className="font-mono text-[11px] text-live shrink-0">
                    ✓ {entry.checked_by}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-panel border border-hairline rounded-xl px-5 py-6 text-textMuted text-sm mb-8">
          Select your name above to see your task list for{" "}
          {day === "SAT" ? "Saturday" : "Sunday"}.
        </div>
      )}

      {/* Team status board */}
      <div>
        <h2 className="font-mono text-xs text-textMuted uppercase tracking-wide mb-3">
          Team status — {day === "SAT" ? "Saturday" : "Sunday"}
        </h2>
        <div className="bg-panel border border-hairline rounded-xl overflow-hidden">
          {roleCompletion.map(({ role, done, total }) => (
            <div
              key={role.id}
              className="rundown-row flex items-center gap-3 px-5 py-3"
            >
              <span
                className="cue-light"
                data-checked={total > 0 && done === total}
              />
              <span className="flex-1 text-sm">{role.name}</span>
              <span className="font-mono text-xs text-textMuted">
                {done}/{total}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <a
          href="/history"
          className="font-mono text-xs text-gold hover:underline uppercase tracking-wide"
        >
          View past weekends →
        </a>
      </div>
    </div>
  );
}
