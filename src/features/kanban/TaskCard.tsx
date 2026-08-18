import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/domain";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatDateFr, formatMinutes, getOverdueLabel } from "@/lib/utils/date";
import { TASK_PRIORITIES } from "@/types/domain";

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  medium: "secondary",
  high: "default",
  urgent: "destructive",
};

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const overdueLabel = getOverdueLabel(task.due_date);
  const priorityLabel = TASK_PRIORITIES.find((p) => p.value === task.priority)?.label ?? task.priority;
  const accentColor = (task as Task & { color?: string | null }).color;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-50")}
    >
      <Card
        role="button"
        tabIndex={0}
        aria-label={`Tâche : ${task.title}`}
        onClick={() => onOpen(task)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onOpen(task);
        }}
        className="cursor-grab overflow-hidden active:cursor-grabbing"
        style={accentColor ? { borderLeft: `4px solid ${accentColor}` } : undefined}
        {...attributes}
        {...listeners}
      >
        <CardContent className="space-y-2 p-3">
          <p className="text-sm font-medium">{task.title}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={PRIORITY_VARIANT[task.priority] ?? "outline"}>{priorityLabel}</Badge>
            {overdueLabel ? (
              <Badge variant="destructive">{overdueLabel}</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">{formatDateFr(task.due_date)}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{formatMinutes(task.estimated_minutes)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
