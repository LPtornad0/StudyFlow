import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import type { Task, TaskStatus } from "@/types/domain";
import { TASK_STATUSES } from "@/types/domain";
import type { NewTaskInput } from "@/features/tasks/useTasks";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";

export function KanbanBoard({
  tasks,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
}: {
  tasks: Task[];
  onCreate: (input: NewTaskInput) => Promise<{ error: string | null }>;
  onUpdate: (taskId: string, patch: Partial<NewTaskInput>) => Promise<{ error: string | null }>;
  onDelete: (taskId: string) => Promise<{ error: string | null }>;
  onMove: (taskId: string, status: TaskStatus, position: number) => Promise<{ error: string | null }>;
}) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo");
  const [moveError, setMoveError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns: Record<TaskStatus, Task[]> = {
    todo: tasks.filter((t) => t.status === "todo").sort((a, b) => a.position - b.position),
    in_progress: tasks.filter((t) => t.status === "in_progress").sort((a, b) => a.position - b.position),
    done: tasks.filter((t) => t.status === "done").sort((a, b) => a.position - b.position),
  };

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeTaskItem = tasks.find((t) => t.id === active.id);
    if (!activeTaskItem) return;

    const overStatus = TASK_STATUSES.some((s) => s.value === over.id)
      ? (over.id as TaskStatus)
      : tasks.find((t) => t.id === over.id)?.status;

    if (!overStatus) return;

    const targetColumn = columns[overStatus].filter((t) => t.id !== activeTaskItem.id);
    const overIndex = targetColumn.findIndex((t) => t.id === over.id);
    const newPosition = overIndex >= 0 ? overIndex : targetColumn.length;

    setMoveError(null);
    const { error } = await onMove(activeTaskItem.id, overStatus, newPosition);
    if (error) setMoveError(error);
  }

  function openCreateDialog(status: TaskStatus) {
    setEditingTask(null);
    setCreateStatus(status);
    setDialogOpen(true);
  }

  function openEditDialog(task: Task) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-3">
      {moveError && <ErrorState message={moveError} />}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-3 md:grid-cols-3">
          {TASK_STATUSES.map((column) => (
            <div key={column.value} className="space-y-2">
              <KanbanColumn id={column.value} title={column.label} count={columns[column.value].length}>
                <SortableContext
                  items={columns[column.value].map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columns[column.value].map((task) => (
                    <TaskCard key={task.id} task={task} onOpen={openEditDialog} />
                  ))}
                </SortableContext>
              </KanbanColumn>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => openCreateDialog(column.value)}
                aria-label={`Ajouter une tâche dans la colonne ${column.label}`}
              >
                + Ajouter une tâche
              </Button>
            </div>
          ))}
        </div>

        <DragOverlay>{activeTask ? <TaskCard task={activeTask} onOpen={() => {}} /> : null}</DragOverlay>
      </DndContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSubmit={(input) =>
          editingTask ? onUpdate(editingTask.id, input) : onCreate({ ...input, status: createStatus })
        }
        onDelete={editingTask ? onDelete : undefined}
      />
    </div>
  );
}
