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
  color?: string | null;
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
        color: input.color ?? null,
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
    if (patch.color !== undefined) dbPatch.color = patch.color || null;

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

  async function moveTask(
    taskId: string,
    newStatus: TaskStatus,
    newPosition: number
  ): Promise<{ error: string | null }> {
    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t))
    );

    const { error } = await supabase
      .from("tasks")
      .update({
        status: newStatus,
        position: newPosition,
        completed_at: newStatus === "done" ? new Date().toISOString() : null,
      })
      .eq("id", taskId);

    if (error) {
      console.error("Erreur de déplacement de la tâche :", error);
      setTasks(previous);
      return { error: "Le déplacement n'a pas pu être enregistré. Position restaurée." };
    }
    return { error: null };
  }

  return { tasks, loading, error, createTask, updateTask, deleteTask, moveTask, setTasks, refetch: fetchTasks };
}
