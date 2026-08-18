import { FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { ErrorState } from "@/components/shared/ErrorState";
import { TaskComments } from "@/features/comments/TaskComments";
import type { Task } from "@/types/domain";
import { TASK_PRIORITIES } from "@/types/domain";
import { TASK_COLOR_SWATCHES } from "./TASK_COLORS";
import type { NewTaskInput } from "@/features/tasks/useTasks";
import { cn } from "@/lib/utils/cn";

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSubmit: (input: NewTaskInput) => Promise<{ error: string | null }>;
  onDelete?: (taskId: string) => Promise<{ error: string | null }>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [color, setColor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      const taskWithColor = task as Task & { color?: string | null };
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority as Task["priority"]);
      setDueDate(task.due_date ?? "");
      setColor(taskWithColor.color ?? "");
      setEstimatedHours(
        task.estimated_minutes !== null && task.estimated_minutes !== undefined
          ? String(task.estimated_minutes / 60)
          : ""
      );
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setColor("");
      setEstimatedHours("");
    }
    setError(null);
  }, [task, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);

    const estimatedMinutes = estimatedHours ? Math.round(parseFloat(estimatedHours) * 60) : null;

    const { error } = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || null,
      estimatedMinutes,
      color: color || null,
    });

    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!task || !onDelete) return;
    const confirmed = window.confirm("Supprimer définitivement cette tâche ?");
    if (!confirmed) return;
    const { error } = await onDelete(task.id);
    if (error) {
      setError(error);
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
          <DialogDescription>
            Les durées sont saisies en heures ; elles sont stockées en minutes. La description
            accepte le Markdown.
          </DialogDescription>
        </DialogHeader>

        {error && <ErrorState message={error} />}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Titre</Label>
            <Input id="task-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-description">Description (Markdown)</Label>
            <MarkdownEditor id="task-description" value={description} onChange={setDescription} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Priorité</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-due-date">Échéance</Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-estimate">Temps estimé (en heures)</Label>
            <Input
              id="task-estimate"
              type="number"
              min="0"
              step="0.25"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
            />
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium leading-none">Couleur de la carte</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur de la carte">
              {TASK_COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.value || "none"}
                  type="button"
                  role="radio"
                  aria-checked={color === swatch.value}
                  aria-label={swatch.label}
                  title={swatch.label}
                  onClick={() => setColor(swatch.value)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    color === swatch.value ? "scale-110 border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: swatch.value || "transparent" }}
                >
                  {!swatch.value && (
                    <span className="flex h-full w-full items-center justify-center rounded-full border border-dashed text-[10px] text-muted-foreground">
                      Ø
                    </span>
                  )}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-between pt-2">
            {task && onDelete ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Supprimer
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>

        {task && <TaskComments taskId={task.id} />}
      </DialogContent>
    </Dialog>
  );
}
