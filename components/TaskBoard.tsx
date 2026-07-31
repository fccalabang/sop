"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Role,
  Member,
  Task,
  ChecklistEntry,
  ServiceDay,
  getCurrentWeek,
  getDayFromDate,
  formatDateLabel,
  dayLabel,
} from "@/lib/types";

export default function TaskBoard() {
  const { sun } = useMemo(() => getCurrentWeek(), []);
  const [activeDate, setActiveDate] = useState<string>(sun);
  const day = getDayFromDate(activeDate);

  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<ChecklistEntry[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [workingChecks, setWorkingChecks] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

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
      const loaded = data ?? [];
      setEntries(loaded);

      // Reset local working state to match what's actually saved for this date.
      const map: Record<string, boolean> = {};
      loaded.forEach((e) => {
        map[e.task_id] = e.checked;
      });
      setWorkingChecks(map);
    }
    loadEntries();
  }, [activeDate]);

  function toggleTask(task: Task) {
    setWorkingChecks((prev) => ({ ...prev, [task.id]: !prev[task.id] }));
  }

  const tasksForSelectedRole = tasks.filter(
    (t) => t.role_id === selectedRoleId
  );

  const changedTasks = tasksForSelectedRole.filter((t) => {
    const saved = entries.find((e) => e.task_id === t.id)?.checked ?? false;
    const pending = !!workingChecks[t.id];
    return saved !== pending;
  });

  const hasChanges = changedTasks.length > 0;

  async function handleSubmit() {
    if (!selectedMember || !selectedRoleId || !day || changedTasks.length === 0)
      return;

    setSubmitting(true);
    const payloads = changedTasks.map((t) => {
      const checked = !!workingChecks[t.id];
      return {
        task_id: t.id,
        service_date: activeDate,
        day,
        checked,
        checked_by: checked ? selectedMember.name : null,
        checked_at: checked ? new Date().toISOString() : null,
      };
    });

    const { data, error } = await supabase
      .from("checklist_entries")
      .upsert(payloads, { onConflict: "task_id,service_date" })
      .select();

    setSubmitting(false);

    if (!error && data) {
      setEntries((prev) => {
        const changedIds = new Set((data as ChecklistEntry[]).map((d) => d.task_id));
        const others = prev.filter((e) => !changedIds.has(e.task_id));
        return [...others, ...(data as ChecklistEntry[])];
      });
      setSavedMessage("Saved!");
      setTimeout(() => setSavedMessage(null), 2500);
    } else if (error) {
      setSavedMessage("Something went wrong — try again.");
    }
  }

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
          Service task checklist — Free Christian Church of Alabang
        </p>
      </header>

      {/* Date picker */}
      <div className="mb-6">
        <label className="block font-mono text-xs text-textMuted uppercase tracking-wide mb-2">
          Service date
        </label>
        <input
          type="date"
          value={activeDate}
          onChange={(e) => setActiveDate(e.target.value)}
          className="w-full bg-panel border border-hairline rounded-lg px-4 py-3 text-textPrimary font-body focus:border-gold outline-none"
        />
        {day ? (
          <p className="font-mono text-xs text-gold mt-2 uppercase tracking-wide">
            {dayLabel(day)}, {formatDateLabel(activeDate)}
          </p>
        ) : (
          <p className="font-mono text-xs text-textMuted mt-2">
            Please pick a Wednesday, Saturday, or Sunday — those are the
            monitored service days.
          </p>
        )}
      </div>

      {day && (
        <>
          {/* Name + Role pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block font-mono text-xs text-textMuted uppercase tracking-wide mb-2">
                Who's checking in?
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-panel border border-hairline rounded-lg px-4 py-3 text-textPrimary font-body focus:border-gold outline-none"
              >
                <option value="">Select your name…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs text-textMuted uppercase tracking-wide mb-2">
                Role for this service
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full bg-panel border border-hairline rounded-lg px-4 py-3 text-textPrimary font-body focus:border-gold outline-none"
              >
                <option value="">Select a role…</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Task rundown for selected role */}
          {selectedMember && selectedRoleId ? (
            <div className="bg-panel border border-hairline rounded-xl overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-hairline flex items-center justify-between">
                <span className="font-display font-medium">
                  {roles.find((r) => r.id === selectedRoleId)?.name}
                </span>
                <span className="font-mono text-xs text-textMuted">
                  {tasksForSelectedRole.filter((t) => workingChecks[t.id]).length}{" "}
                  / {tasksForSelectedRole.length} checked
                </span>
              </div>
              {tasksForSelectedRole.length === 0 && (
                <div className="px-5 py-6 text-textMuted text-sm">
                  No tasks assigned to this role yet.
                </div>
              )}
              {tasksForSelectedRole.map((task) => {
                const savedEntry = entries.find((e) => e.task_id === task.id);
                const savedChecked = savedEntry?.checked ?? false;
                const pendingChecked = !!workingChecks[task.id];
                const isDirty = savedChecked !== pendingChecked;
                return (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task)}
                    className="rundown-row w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-panelLight transition-colors"
                  >
                    <span
                      className="cue-light"
                      data-checked={pendingChecked && !isDirty}
                      data-pending={isDirty}
                    />
                    <span
                      className={`flex-1 ${
                        pendingChecked
                          ? "text-textMuted line-through"
                          : "text-textPrimary"
                      }`}
                    >
                      {task.description}
                    </span>
                    {isDirty && (
                      <span className="font-mono text-[11px] text-gold shrink-0">
                        not saved
                      </span>
                    )}
                    {!isDirty && savedChecked && savedEntry?.checked_by && (
                      <span className="font-mono text-[11px] text-live shrink-0">
                        ✓ {savedEntry.checked_by}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Submit bar */}
              <div className="px-5 py-4 border-t border-hairline flex items-center justify-between gap-4">
                <span className="font-mono text-xs text-textMuted">
                  {hasChanges
                    ? `${changedTasks.length} change${
                        changedTasks.length === 1 ? "" : "s"
                      } not saved yet`
                    : savedMessage ?? "All changes saved"}
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!hasChanges || submitting}
                  className={`font-mono text-xs uppercase tracking-wide px-5 py-2.5 rounded-lg transition-colors ${
                    hasChanges && !submitting
                      ? "bg-gold text-ink hover:opacity-90"
                      : "bg-panelLight text-textMuted cursor-not-allowed"
                  }`}
                >
                  {submitting ? "Saving…" : "Submit"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-panel border border-hairline rounded-xl px-5 py-6 text-textMuted text-sm mb-8">
              Select your name and a role above to see the task list for{" "}
              {dayLabel(day)}.
            </div>
          )}

          {/* Team status board */}
          <div className="mt-8">
            <h2 className="font-mono text-xs text-textMuted uppercase tracking-wide mb-3">
              Team status — {dayLabel(day)}
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
        </>
      )}

      <div className="mt-8 text-center">
        <a
          href="/history"
          className="font-mono text-xs text-gold hover:underline uppercase tracking-wide"
        >
          View past services →
        </a>
      </div>
    </div>
  );
}
