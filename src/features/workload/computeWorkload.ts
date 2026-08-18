import type { Task } from "@/types/domain";

export type WorkloadAssumptions = {
  dailyCapacityMinutes: number;
  includeWeekends: boolean;
};

export const DEFAULT_WORKLOAD_ASSUMPTIONS: WorkloadAssumptions = {
  dailyCapacityMinutes: 3 * 60,
  includeWeekends: false,
};

export type DailyWorkloadPoint = {
  date: string;
  plannedMinutes: number;
  atRisk: boolean;
};

export type WorkloadSummary = {
  totalRemainingMinutes: number;
  tasksWithoutEstimate: number;
  tasksWithoutDueDate: number;
  dailyBreakdown: DailyWorkloadPoint[];
  message: string;
};

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function enumerateDays(start: Date, end: Date, includeWeekends: boolean): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (cursor <= last) {
    if (includeWeekends || !isWeekend(cursor)) {
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function computeWorkload(
  tasks: Task[],
  assumptions: WorkloadAssumptions = DEFAULT_WORKLOAD_ASSUMPTIONS,
  today: Date = new Date()
): WorkloadSummary {
  const unfinished = tasks.filter((t) => t.status !== "done");

  const tasksWithoutEstimate = unfinished.filter(
    (t) => t.due_date && (t.estimated_minutes === null || t.estimated_minutes === undefined)
  ).length;
  const tasksWithoutDueDate = unfinished.filter((t) => !t.due_date).length;

  const eligible = unfinished.filter(
    (t) => t.due_date && t.estimated_minutes !== null && t.estimated_minutes !== undefined
  );

  const dailyMinutesMap = new Map<string, number>();

  for (const task of eligible) {
    const due = new Date(task.due_date as string);
    const days = enumerateDays(today, due, assumptions.includeWeekends);
    if (days.length === 0) {
      const key = today.toISOString().slice(0, 10);
      dailyMinutesMap.set(key, (dailyMinutesMap.get(key) ?? 0) + (task.estimated_minutes ?? 0));
      continue;
    }
    const perDay = (task.estimated_minutes ?? 0) / days.length;
    for (const day of days) {
      const key = day.toISOString().slice(0, 10);
      dailyMinutesMap.set(key, (dailyMinutesMap.get(key) ?? 0) + perDay);
    }
  }

  const dailyBreakdown: DailyWorkloadPoint[] = Array.from(dailyMinutesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, plannedMinutes]) => ({
      date,
      plannedMinutes: Math.round(plannedMinutes),
      atRisk: plannedMinutes > assumptions.dailyCapacityMinutes,
    }));

  const totalRemainingMinutes = eligible.reduce((sum, t) => sum + (t.estimated_minutes ?? 0), 0);

  const message = buildMessage(totalRemainingMinutes, eligible.length, dailyBreakdown);

  return {
    totalRemainingMinutes,
    tasksWithoutEstimate,
    tasksWithoutDueDate,
    dailyBreakdown,
    message,
  };
}

function buildMessage(
  totalMinutes: number,
  taskCount: number,
  dailyBreakdown: DailyWorkloadPoint[]
): string {
  if (taskCount === 0) {
    return "Aucune tâche estimée avec échéance pour le moment : impossible de calculer une charge fiable.";
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalLabel = minutes === 0 ? `${hours} h` : `${hours} h ${minutes.toString().padStart(2, "0")}`;

  const nearestDueDays = dailyBreakdown.length;
  if (nearestDueDays === 0) {
    return `Tu as environ ${totalLabel} de travail à réaliser, sans jour disponible avant l'échéance la plus proche.`;
  }

  const perDayMinutes = totalMinutes / nearestDueDays;
  const perDayHours = Math.floor(perDayMinutes / 60);
  const perDayRestMinutes = Math.round(perDayMinutes % 60);
  const perDayLabel =
    perDayRestMinutes === 0
      ? `${perDayHours} h`
      : `${perDayHours} h ${perDayRestMinutes.toString().padStart(2, "0")}`;

  return `Tu as environ ${totalLabel} de travail à réaliser sur les prochains jours : prévois environ ${perDayLabel} par jour.`;
}
