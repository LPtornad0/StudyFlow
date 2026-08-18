import { useParams } from "react-router-dom";
import { useTasks } from "@/features/tasks/useTasks";
import { KanbanBoard } from "./KanbanBoard";
import { WorkloadPanel } from "@/features/workload/WorkloadPanel";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";

export function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { tasks, loading, error, createTask, updateTask, deleteTask, moveTask } = useTasks(projectId);

  if (loading) return <LoadingState label="Chargement du tableau…" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold">Tableau Kanban</h1>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <KanbanBoard
          tasks={tasks}
          onCreate={createTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onMove={moveTask}
        />
        <WorkloadPanel tasks={tasks} />
      </div>
    </div>
  );
}
