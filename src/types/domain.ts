import type { Tables } from "./database.types";

export type Profile = Tables<"profiles">;
export type Workspace = Tables<"workspaces">;
export type WorkspaceMember = Tables<"workspace_members">;
export type Project = Tables<"projects">;
export type Task = Tables<"tasks">;
export type Label = Tables<"labels">;
export type BoardColumn = Tables<"board_columns">;

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type WorkspaceRole = "owner" | "member";

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Terminé" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
  { value: "urgent", label: "Urgente" },
];

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};
