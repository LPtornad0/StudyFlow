import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Task, TaskStatus } from "@/types/domain";
import { useAuth } from "@/features/auth/useAuth";

export type NewTaskInput = {
  title: string;
  description?: string;
  columnId?: string;
  isDoneColumn?: boolean;
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
    if (!input.columnId) return { error: "Liste introuvable." };
    const positionInColumn = tasks.filter((t) => t.column_id === input.columnId).length;
    const status: TaskStatus = input.isDoneColumn ? "done" : "todo";

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
        column_id: input.columnId,
        position: positionInColumn,
        created_by: user?.id ?? null,
        completed_at: input.isDoneColumn ? new Date().toISOString() : null,
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
    columnId: string,
    newPosition: number,
    isDoneColumn: boolean
  ): Promise<{ error: string | null }> {
    const previous = tasks;
    const movingTask = tasks.find((t) => t.id === taskId);
    if (!movingTask) return { error: "Tâche introuvable." };

    const byColumn = new Map<string, Task[]>();
    for (const t of tasks) {
      if (t.id === taskId || !t.column_id) continue;
      const list = byColumn.get(t.column_id) ?? [];
      list.push(t);
      byColumn.set(t.column_id, list);
    }
    byColumn.forEach((list) => list.sort((a, b) => a.position - b.position));

    const updatedMovingTask: Task = {
      ...movingTask,
      column_id: columnId,
      status: isDoneColumn ? "done" : "todo",
      completed_at: isDoneColumn ? new Date().toISOString() : null,
    };

    const destination = byColumn.get(columnId) ?? [];
    const insertAt = Math.max(0, Math.min(newPosition, destination.length));
    destination.splice(insertAt, 0, updatedMovingTask);
    byColumn.set(columnId, destination);

    const finalById = new Map<string, Task>();
    byColumn.forEach((list, colId) => {
      list.forEach((t, index) => {
        finalById.set(t.id, { ...t, column_id: colId, position: index });
      });
    });

    const affected = Array.from(finalById.values()).filter((t) => {
      const original = tasks.find((o) => o.id === t.id);
      return (
        !original ||
        original.column_id !== t.column_id ||
        original.position !== t.position ||
        original.status !== t.status ||
        original.completed_at !== t.completed_at
      );
    });

    const nextTasks = tasks.map((t) => finalById.get(t.id) ?? t);
    setTasks(nextTasks);

    const results = await Promise.all(
      affected.map((t) =>
        supabase
          .from("tasks")
          .update({
            column_id: t.column_id,
            position: t.position,
            status: t.status,
            completed_at: t.completed_at,
          })
          .eq("id", t.id)
      )
    );
    const failed = results.find((r) => r.error);

    if (failed?.error) {
      console.error("Erreur de déplacement de la tâche :", failed.error);
      setTasks(previous);
      return { error: "Le déplacement n'a pas pu être enregistré. Position restaurée." };
    }
    return { error: null };
  }

  return { tasks, loading, error, createTask, updateTask, deleteTask, moveTask, setTasks, refetch: fetchTasks };
}
