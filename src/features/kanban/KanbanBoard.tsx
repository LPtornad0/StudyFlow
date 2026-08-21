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
import { AddColumnForm } from "./AddColumnForm";
import type { BoardColumn, Task } from "@/types/domain";
import type { NewTaskInput } from "@/features/tasks/useTasks";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";

export function KanbanBoard({
  tasks,
  columns,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
  onAddColumn,
}: {
  tasks: Task[];
  columns: BoardColumn[];
  onCreate: (input: NewTaskInput) => Promise<{ error: string | null }>;
  onUpdate: (taskId: string, patch: Partial<NewTaskInput>) => Promise<{ error: string | null }>;
  onDelete: (taskId: string) => Promise<{ error: string | null }>;
  onMove: (
    taskId: string,
    columnId: string,
    position: number,
    isDoneColumn: boolean
  ) => Promise<{ error: string | null }>;
  onAddColumn: (title: string) => Promise<{ error: string | null }>;
}) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const orderedColumns = [...columns].sort((a, b) => a.position - b.position);
  const tasksByColumn = new Map<string, Task[]>();
  for (const column of orderedColumns) {
    tasksByColumn.set(
      column.id,
      tasks.filter((t) => t.column_id === column.id).sort((a, b) => a.position - b.position)
    );
  }

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

    const overIsColumn = orderedColumns.some((c) => c.id === over.id);
    const overColumnId = overIsColumn ? (over.id as string) : tasks.find((t) => t.id === over.id)?.column_id;
    if (!overColumnId) return;

    const targetColumn = (tasksByColumn.get(overColumnId) ?? []).filter((t) => t.id !== activeTaskItem.id);
    const overIndex = targetColumn.findIndex((t) => t.id === over.id);
    const newPosition = overIndex >= 0 ? overIndex : targetColumn.length;
    const isDoneColumn = orderedColumns.find((c) => c.id === overColumnId)?.is_done_column ?? false;

    setMoveError(null);
    const { error } = await onMove(activeTaskItem.id, overColumnId, newPosition, isDoneColumn);
    if (error) setMoveError(error);
  }

  function openCreateDialog(columnId: string) {
    setEditingTask(null);
    setCreateColumnId(columnId);
    setDialogOpen(true);
  }

  function openEditDialog(task: Task) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {moveError && (
        <div className="flex-none">
          <ErrorState message={moveError} />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* overflow-x-auto ici : c'est cette rangée qui défile horizontalement,
            jamais la page. Chaque colonne défile verticalement en interne. */}
        <div className="flex h-full min-h-0 flex-1 items-stretch gap-3 overflow-x-auto pb-2">
          {orderedColumns.map((column) => (
            <div key={column.id} className="flex h-full w-72 flex-none flex-col gap-2">
              <div className="min-h-0 flex-1">
                <KanbanColumn
                  id={column.id}
                  title={column.name}
                  count={(tasksByColumn.get(column.id) ?? []).length}
                >
                  <SortableContext
                    items={(tasksByColumn.get(column.id) ?? []).map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {(tasksByColumn.get(column.id) ?? []).map((task) => (
                      <TaskCard key={task.id} task={task} onOpen={openEditDialog} />
                    ))}
                  </SortableContext>
                </KanbanColumn>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full flex-none"
                onClick={() => openCreateDialog(column.id)}
                aria-label={`Ajouter une tâche dans la liste ${column.name}`}
              >
                + Ajouter une tâche
              </Button>
            </div>
          ))}

          <div className="w-72 flex-none self-start">
            <AddColumnForm onAdd={onAddColumn} />
          </div>
        </div>

        <DragOverlay>{activeTask ? <TaskCard task={activeTask} onOpen={() => {}} /> : null}</DragOverlay>
      </DndContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSubmit={(input) =>
          editingTask
            ? onUpdate(editingTask.id, input)
            : onCreate({
                ...input,
                columnId: createColumnId ?? undefined,
                isDoneColumn: orderedColumns.find((c) => c.id === createColumnId)?.is_done_column ?? false,
              })
        }
        onDelete={editingTask ? onDelete : undefined}
      />
    </div>
  );
}
