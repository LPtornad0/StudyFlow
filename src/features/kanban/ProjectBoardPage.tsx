import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTasks } from "@/features/tasks/useTasks";
import { useBoardColumns } from "./useBoardColumns";
import { KanbanBoard } from "./KanbanBoard";
import { WorkloadPanel } from "@/features/workload/WorkloadPanel";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils/cn";

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
  const [showWorkload, setShowWorkload] = useState(true);

  if (tasksLoading || columnsLoading) return <LoadingState label="Chargement du tableau…" />;
  if (tasksError) return <ErrorState message={tasksError} />;
  if (columnsError) return <ErrorState message={columnsError} />;

  return (
    <div className="space-y-6">
      {/* Cette rangée n'a jamais de padding conditionnel : le bouton reste donc
          toujours au même endroit, que le panneau soit affiché ou masqué. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Tableau Kanban</h1>
        <Button variant="outline" size="sm" onClick={() => setShowWorkload((v) => !v)}>
          {showWorkload ? "Masquer la charge de travail" : "Afficher la charge de travail"}
        </Button>
      </div>

      <div className={cn(showWorkload && "md:pr-[21rem]")}>
        <KanbanBoard
          tasks={tasks}
          columns={columns}
          onCreate={createTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onMove={moveTask}
          onAddColumn={addColumn}
        />
      </div>

      {showWorkload && (
        <div className="fixed right-4 top-20 z-10 hidden w-80 md:block">
          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            <WorkloadPanel tasks={tasks} />
          </div>
        </div>
      )}
    </div>
  );
}
