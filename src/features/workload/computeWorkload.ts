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

type ScheduledTask = {
  dueDate: Date;
  remaining: number;
};

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

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

/**
 * Répartit la charge en respectant les échéances : chaque jour, on sert en priorité
 * les tâches dont l'échéance est la plus proche (ordonnancement "au plus tôt").
 * Une tâche n'est donc jamais comptabilisée sur des jours qui n'ont aucun rapport
 * avec sa propre échéance, sauf si elle déborde faute de capacité suffisante avant
 * sa date limite (elle est alors reportée sur le jour de l'échéance et signalée
 * comme "à risque").
 */
export function computeWorkload(
  tasks: Task[],
  assumptions: WorkloadAssumptions = DEFAULT_WORKLOAD_ASSUMPTIONS,
  today: Date = new Date()
): WorkloadSummary {
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);

  const unfinished = tasks.filter((t) => t.status !== "done");

  const tasksWithoutEstimate = unfinished.filter(
    (t) => t.due_date && (t.estimated_minutes === null || t.estimated_minutes === undefined)
  ).length;
  const tasksWithoutDueDate = unfinished.filter((t) => !t.due_date).length;

  const scheduled: ScheduledTask[] = unfinished
    .filter((t) => t.due_date && t.estimated_minutes !== null && t.estimated_minutes !== undefined)
    .map((t) => {
      const due = parseLocalDate(t.due_date as string);
      const effectiveDue = due < todayMidnight ? new Date(todayMidnight) : due;
      return { dueDate: effectiveDue, remaining: t.estimated_minutes ?? 0 };
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const totalRemainingMinutes = scheduled.reduce((sum, t) => sum + t.remaining, 0);

  if (scheduled.length === 0) {
    return {
      totalRemainingMinutes: 0,
      tasksWithoutEstimate,
      tasksWithoutDueDate,
      dailyBreakdown: [],
      message: buildMessage(0, 0, []),
    };
  }

  const maxDue = scheduled.reduce(
    (max, t) => (t.dueDate.getTime() > max.getTime() ? t.dueDate : max),
    scheduled[0].dueDate
  );

  const days = enumerateDays(todayMidnight, maxDue, assumptions.includeWeekends);
  if (days.length === 0 || days[0].getTime() !== todayMidnight.getTime()) {
    days.unshift(new Date(todayMidnight));
  }

  const dailyMinutesMap = new Map<string, number>();

  for (const day of days) {
    let capacity = assumptions.dailyCapacityMinutes;
    for (const task of scheduled) {
      if (task.remaining <= 0) continue;
      if (day.getTime() > task.dueDate.getTime()) continue;
      if (capacity <= 0) break;
      const alloc = Math.min(capacity, task.remaining);
      const key = day.toISOString().slice(0, 10);
      dailyMinutesMap.set(key, (dailyMinutesMap.get(key) ?? 0) + alloc);
      task.remaining -= alloc;
      capacity -= alloc;
    }
  }

  // Reliquat qui n'a pas pu être placé avant l'échéance faute de capacité : on le
  // reporte sur le jour de l'échéance elle-même et on marque la période à risque.
  for (const task of scheduled) {
    if (task.remaining > 0) {
      const key = task.dueDate.toISOString().slice(0, 10);
      dailyMinutesMap.set(key, (dailyMinutesMap.get(key) ?? 0) + task.remaining);
      task.remaining = 0;
    }
  }

  const dailyBreakdown: DailyWorkloadPoint[] = Array.from(dailyMinutesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, plannedMinutes]) => ({
      date,
      plannedMinutes: Math.round(plannedMinutes),
      atRisk: plannedMinutes > assumptions.dailyCapacityMinutes,
    }));

  const message = buildMessage(totalRemainingMinutes, scheduled.length, dailyBreakdown);

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
