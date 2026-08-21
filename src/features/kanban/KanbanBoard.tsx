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
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { AddColumnForm } from "./AddColumnForm";
import type { BoardColumn, Task } from "@/types/domain";
import type { NewTaskInput } from "@/features/tasks/useTasks";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils/cn";

const COLUMN_DND_PREFIX = "column:";

function SortableColumnCard({
  column,
  tasks,
  onOpenTask,
  onAddTask,
}: {
  column: BoardColumn;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onAddTask: (columnId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${COLUMN_DND_PREFIX}${column.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex h-full w-72 flex-none flex-col gap-2", isDragging && "opacity-60")}
    >
      <div className="min-h-0 flex-1">
        <KanbanColumn
          id={column.id}
          title={column.name}
          count={tasks.length}
          headerHandleProps={{ ...attributes, ...listeners }}
        >
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
            ))}
          </SortableContext>
        </KanbanColumn>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full flex-none"
        onClick={() => onAddTask(column.id)}
        aria-label={`Ajouter une tâche dans la liste ${column.name}`}
      >
        + Ajouter une tâche
      </Button>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  columns,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
  onAddColumn,
  onReorderColumns,
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
  onReorderColumns: (orderedIds: string[]) => Promise<{ error: string | null }>;
}) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createColumnId, setCreateColumnId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [columnError, setColumnError] = useState<string | null>(null);

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
    const id = String(event.active.id);
    if (id.startsWith(COLUMN_DND_PREFIX)) {
      const columnId = id.slice(COLUMN_DND_PREFIX.length);
      setActiveColumn(orderedColumns.find((c) => c.id === columnId) ?? null);
      setActiveTask(null);
      return;
    }
    setActiveColumn(null);
    setActiveTask(tasks.find((t) => t.id === id) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumn(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith(COLUMN_DND_PREFIX)) {
      const activeColumnId = activeId.slice(COLUMN_DND_PREFIX.length);
      // "over" peut être l'id préfixé de la colonne (poignée), l'id brut de la
      // zone de dépôt de la colonne (utilisée aussi pour les tâches), ou l'id
      // d'une tâche à l'intérieur de cette colonne : on ramène tout à un id de
      // colonne pour que le réordonnancement fonctionne quel que soit le nœud
      // détecté par la collision.
      const overColumnId = overId.startsWith(COLUMN_DND_PREFIX)
        ? overId.slice(COLUMN_DND_PREFIX.length)
        : orderedColumns.some((c) => c.id === overId)
          ? overId
          : (tasks.find((t) => t.id === overId)?.column_id ?? null);

      if (!overColumnId || overColumnId === activeColumnId) return;

      const oldIndex = orderedColumns.findIndex((c) => c.id === activeColumnId);
      const newIndex = orderedColumns.findIndex((c) => c.id === overColumnId);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrderIds = arrayMove(orderedColumns, oldIndex, newIndex).map((c) => c.id);
      setColumnError(null);
      const { error } = await onReorderColumns(newOrderIds);
      if (error) setColumnError(error);
      return;
    }

    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    const overIsColumn = orderedColumns.some((c) => c.id === overId);
    const overColumnId = overIsColumn ? overId : tasks.find((t) => t.id === overId)?.column_id;
    if (!overColumnId) return;

    const targetColumn = (tasksByColumn.get(overColumnId) ?? []).filter((t) => t.id !== activeTaskItem.id);
    const overIndex = targetColumn.findIndex((t) => t.id === overId);
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
      {columnError && (
        <div className="flex-none">
          <ErrorState message={columnError} />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedColumns.map((c) => `${COLUMN_DND_PREFIX}${c.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex h-full min-h-0 flex-1 items-stretch gap-3 overflow-x-auto pb-2">
            {orderedColumns.map((column) => (
              <SortableColumnCard
                key={column.id}
                column={column}
                tasks={tasksByColumn.get(column.id) ?? []}
                onOpenTask={openEditDialog}
                onAddTask={openCreateDialog}
              />
            ))}

            <div className="w-72 flex-none self-start">
              <AddColumnForm onAdd={onAddColumn} />
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onOpen={() => {}} /> : null}
          {activeColumn ? (
            <div className="w-72 rounded-lg border bg-card p-3 text-sm font-semibold shadow-lg">
              {activeColumn.name}
            </div>
          ) : null}
        </DragOverlay>
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
