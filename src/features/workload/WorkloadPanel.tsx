import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/types/domain";
import { useWorkload } from "./useWorkload";
import { formatMinutes } from "@/lib/utils/date";

export function WorkloadPanel({ tasks, onClose }: { tasks: Task[]; onClose?: () => void }) {
  const { summary, assumptions } = useWorkload(tasks);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Charge de travail estimée</CardTitle>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Masquer la charge de travail"
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">{summary.message}</p>

        {summary.dailyBreakdown.length > 0 && (
          <div className="space-y-1">
            {summary.dailyBreakdown.map((day) => (
              <div key={day.date} className="flex items-center justify-between text-sm">
                <span>
                  {new Date(day.date).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span className="flex items-center gap-2">
                  {formatMinutes(Math.round(day.plannedMinutes))}
                  {day.atRisk && <Badge variant="destructive">Période à risque</Badge>}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium">Hypothèses de calcul :</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li>
              Capacité quotidienne réaliste : {formatMinutes(assumptions.dailyCapacityMinutes)}
              (seuil configurable).
            </li>
            <li>
              Week-ends {assumptions.includeWeekends ? "inclus" : "exclus"} du calcul des jours
              disponibles.
            </li>
            <li>{summary.tasksWithoutEstimate} tâche(s) avec échéance ignorée(s) car sans estimation.</li>
            <li>{summary.tasksWithoutDueDate} tâche(s) sans échéance, non comptabilisée(s) ici.</li>
            <li>Cette estimation est indicative, pas une donnée certaine.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
