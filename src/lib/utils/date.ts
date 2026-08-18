import { format, formatDistanceToNowStrict, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDateFr(isoDate: string | null | undefined): string {
  if (!isoDate) return "Sans échéance";
  return format(new Date(isoDate), "d MMM yyyy", { locale: fr });
}

export function getOverdueLabel(dueDate: string | null | undefined): string | null {
  if (!dueDate) return null;
  const due = startOfDay(new Date(dueDate));
  const today = startOfDay(new Date());
  if (!isBefore(due, today)) return null;
  return `En retard de ${formatDistanceToNowStrict(due, { locale: fr })}`;
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "Non estimé";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m.toString().padStart(2, "0")}`;
}
