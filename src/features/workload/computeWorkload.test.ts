import { describe, it, expect } from "vitest";
import { computeWorkload } from "./computeWorkload";
import type { Task } from "@/types/domain";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "task-1",
    project_id: "project-1",
    title: "Tâche de test",
    description: null,
    status: "todo",
    priority: "medium",
    position: 0,
    due_date: null,
    estimated_minutes: null,
    completed_at: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("computeWorkload", () => {
  it("ignore les tâches terminées", () => {
    const today = new Date("2026-08-18T00:00:00");
    const tasks = [
      makeTask({ id: "1", status: "done", due_date: "2026-08-19", estimated_minutes: 120 }),
    ];
    const summary = computeWorkload(tasks, undefined, today);
    expect(summary.totalRemainingMinutes).toBe(0);
  });

  it("ignore les tâches sans échéance ou sans estimation et les comptabilise séparément", () => {
    const today = new Date("2026-08-18T00:00:00");
    const tasks = [
      makeTask({ id: "1", due_date: null, estimated_minutes: 60 }),
      makeTask({ id: "2", due_date: "2026-08-20", estimated_minutes: null }),
    ];
    const summary = computeWorkload(tasks, undefined, today);
    expect(summary.totalRemainingMinutes).toBe(0);
    expect(summary.tasksWithoutDueDate).toBe(1);
    expect(summary.tasksWithoutEstimate).toBe(1);
  });

  it("répartit la charge sur les jours ouvrés disponibles jusqu'à l'échéance", () => {
    const today = new Date("2026-08-18T00:00:00");
    const tasks = [makeTask({ id: "1", due_date: "2026-08-21", estimated_minutes: 180 })];
    const summary = computeWorkload(tasks, { dailyCapacityMinutes: 180, includeWeekends: false }, today);
    expect(summary.totalRemainingMinutes).toBe(180);
    expect(summary.dailyBreakdown.length).toBeGreaterThan(0);
    const totalPlanned = summary.dailyBreakdown.reduce((s, d) => s + d.plannedMinutes, 0);
    expect(totalPlanned).toBeCloseTo(180, 0);
  });

  it("signale une période à risque quand la charge quotidienne dépasse le seuil", () => {
    const today = new Date("2026-08-18T00:00:00");
    const tasks = [makeTask({ id: "1", due_date: "2026-08-18", estimated_minutes: 600 })];
    const summary = computeWorkload(tasks, { dailyCapacityMinutes: 180, includeWeekends: false }, today);
    expect(summary.dailyBreakdown.some((d) => d.atRisk)).toBe(true);
  });
});
