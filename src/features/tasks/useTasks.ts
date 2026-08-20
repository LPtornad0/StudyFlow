import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Task, TaskStatus } from "@/types/domain";
import { useAuth } from "@/features/auth/useAuth";

export type NewTaskInput = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Task["priority"];
  dueDate?: string | null;
  estimatedMinutes?: number | null;
};

export function useTasks(projectId: string | undefined) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Erreur de chargement des tâches :", error);
      setError("Impossible de charger les tâches de ce projet.");
      setLoading(false);
      return;
    }
    setTasks(data ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function createTask(input: NewTaskInput): Promise<{ error: string | null }> {
    if (!projectId) return { error: "Projet introuvable." };
    const status = input.status ?? "todo";
    const positionInColumn = tasks.filter((t) => t.status === status).length;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        project_id: projectId,
        title: input.title,
        description: input.description || null,
        status,
        priority: input.priority ?? "medium",
        due_date: input.dueDate ?? null,
        estimated_minutes: input.estimatedMinutes ?? null,
        position: positionInColumn,
        created_by: user?.id ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Erreur de création de la tâche :", error);
      return { error: "La création de la tâche a échoué." };
    }
    setTasks((prev) => [...prev, data]);
    return { error: null };
  }

  async function updateTask(
    taskId: string,
    patch: Partial<NewTaskInput>
  ): Promise<{ error: string | null }> {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description || null;
    if (patch.status !== undefined) {
      dbPatch.status = patch.status;
      dbPatch.completed_at = patch.status === "done" ? new Date().toISOString() : null;
    }
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.dueDate !== undefined) dbPatch.due_date = patch.dueDate;
    if (patch.estimatedMinutes !== undefined) dbPatch.estimated_minutes = patch.estimatedMinutes;

    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? ({ ...t, ...dbPatch } as Task) : t))
    );

    const { error } = await supabase.from("tasks").update(dbPatch).eq("id", taskId);
    if (error) {
      console.error("Erreur de mise à jour de la tâche :", error);
      setTasks(previous);
      return { error: "La mise à jour de la tâche a échoué. Modification annulée." };
    }
    return { error: null };
  }

  async function deleteTask(taskId: string): Promise<{ error: string | null }> {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      console.error("Erreur de suppression de la tâche :", error);
      setTasks(previous);
      return { error: "La suppression a échoué. La tâche a été restaurée." };
    }
    return { error: null };
  }

  /**
   * Déplace une tâche vers une colonne/position donnée et réindexe toutes les
   * tâches impactées (colonne d'origine ET colonne de destination) afin que le
   * champ `position` reste une séquence continue (0, 1, 2…) par colonne. Sans
   * cette réindexation, deux tâches pouvaient se retrouver avec la même position
   * et le réordonnancement au sein d'une même liste ne se répercutait pas de
   * façon fiable après rechargement.
   */
  async function moveTask(
    taskId: string,
    newStatus: TaskStatus,
    newPosition: number
  ): Promise<{ error: string | null }> {
    const previous = tasks;
    const movingTask = tasks.find((t) => t.id === taskId);
    if (!movingTask) return { error: "Tâche introuvable." };

    const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) {
      if (t.id === taskId) continue;
      grouped[t.status as TaskStatus].push(t);
    }
    (Object.keys(grouped) as TaskStatus[]).forEach((status) =>
      grouped[status].sort((a, b) => a.position - b.position)
    );

    const updatedMovingTask: Task = {
      ...movingTask,
      status: newStatus,
      completed_at: newStatus === "done" ? new Date().toISOString() : null,
    };

    const destination = grouped[newStatus];
    const insertAt = Math.max(0, Math.min(newPosition, destination.length));
    destination.splice(insertAt, 0, updatedMovingTask);

    const finalById = new Map<string, Task>();
    (Object.keys(grouped) as TaskStatus[]).forEach((status) => {
      grouped[status].forEach((t, index) => {
        finalById.set(t.id, { ...t, status, position: index });
      });
    });

    const affected = Array.from(finalById.values()).filter((t) => {
      const original = tasks.find((o) => o.id === t.id);
      return !original || original.status !== t.status || original.position !== t.position;
    });

    const nextTasks = tasks.map((t) => finalById.get(t.id) ?? t);
    setTasks(nextTasks);

    const { error } = await supabase.from("tasks").upsert(
      affected.map((t) => ({
        id: t.id,
        status: t.status,
        position: t.position,
        completed_at: t.completed_at,
      })),
      { onConflict: "id" }
    );

    if (error) {
      console.error("Erreur de déplacement de la tâche :", error);
      setTasks(previous);
      return { error: "Le déplacement n'a pas pu être enregistré. Position restaurée." };
    }
    return { error: null };
  }

  return { tasks, loading, error, createTask, updateTask, deleteTask, moveTask, setTasks, refetch: fetchTasks };
}
