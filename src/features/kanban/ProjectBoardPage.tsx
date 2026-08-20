import { useParams } from "react-router-dom";
import { useTasks } from "@/features/tasks/useTasks";
import { useBoardColumns } from "./useBoardColumns";
import { KanbanBoard } from "./KanbanBoard";
import { WorkloadPanel } from "@/features/workload/WorkloadPanel";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
  } = useTasks(projectId);
  const {
    columns,
    loading: columnsLoading,
    error: columnsError,
    addColumn,
  } = useBoardColumns(projectId);

  if (tasksLoading || columnsLoading) return <LoadingState label="Chargement du tableau…" />;
  if (tasksError) return <ErrorState message={tasksError} />;
  if (columnsError) return <ErrorState message={columnsError} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold">Tableau Kanban</h1>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <KanbanBoard
          tasks={tasks}
          columns={columns}
          onCreate={createTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onMove={moveTask}
          onAddColumn={addColumn}
        />
        <WorkloadPanel tasks={tasks} />
      </div>
    </div>
  );
}
