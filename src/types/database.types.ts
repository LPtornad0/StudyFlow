export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      comments: {
        Row: { content: string; created_at: string; id: string; task_id: string; updated_at: string; user_id: string }
        Insert: { content: string; created_at?: string; id?: string; task_id: string; updated_at?: string; user_id: string }
        Update: { content?: string; created_at?: string; id?: string; task_id?: string; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "comments_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "tasks"; referencedColumns: ["id"] }, { foreignKeyName: "comments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      labels: {
        Row: { color: string | null; created_at: string; id: string; name: string; workspace_id: string }
        Insert: { color?: string | null; created_at?: string; id?: string; name: string; workspace_id: string }
        Update: { color?: string | null; created_at?: string; id?: string; name?: string; workspace_id?: string }
        Relationships: [{ foreignKeyName: "labels_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }]
      }
      profiles: {
        Row: { avatar_url: string | null; created_at: string; full_name: string | null; id: string; updated_at: string }
        Insert: { avatar_url?: string | null; created_at?: string; full_name?: string | null; id: string; updated_at?: string }
        Update: { avatar_url?: string | null; created_at?: string; full_name?: string | null; id?: string; updated_at?: string }
        Relationships: []
      }
      projects: {
        Row: { archived_at: string | null; color: string | null; created_at: string; description: string | null; id: string; name: string; updated_at: string; workspace_id: string }
        Insert: { archived_at?: string | null; color?: string | null; created_at?: string; description?: string | null; id?: string; name: string; updated_at?: string; workspace_id: string }
        Update: { archived_at?: string | null; color?: string | null; created_at?: string; description?: string | null; id?: string; name?: string; updated_at?: string; workspace_id?: string }
        Relationships: [{ foreignKeyName: "projects_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }]
      }
      task_labels: {
        Row: { label_id: string; task_id: string }
        Insert: { label_id: string; task_id: string }
        Update: { label_id?: string; task_id?: string }
        Relationships: [{ foreignKeyName: "task_labels_label_id_fkey"; columns: ["label_id"]; isOneToOne: false; referencedRelation: "labels"; referencedColumns: ["id"] }, { foreignKeyName: "task_labels_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "tasks"; referencedColumns: ["id"] }]
      }
      tasks: {
        Row: { color: string | null; completed_at: string | null; created_at: string; created_by: string | null; description: string | null; due_date: string | null; estimated_minutes: number | null; id: string; position: number; priority: string; project_id: string; status: string; title: string; updated_at: string }
        Insert: { color?: string | null; completed_at?: string | null; created_at?: string; created_by?: string | null; description?: string | null; due_date?: string | null; estimated_minutes?: number | null; id?: string; position?: number; priority?: string; project_id: string; status?: string; title: string; updated_at?: string }
        Update: { color?: string | null; completed_at?: string | null; created_at?: string; created_by?: string | null; description?: string | null; due_date?: string | null; estimated_minutes?: number | null; id?: string; position?: number; priority?: string; project_id?: string; status?: string; title?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "tasks_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }, { foreignKeyName: "tasks_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] }]
      }
      workspace_members: {
        Row: { created_at: string; role: string; user_id: string; workspace_id: string }
        Insert: { created_at?: string; role?: string; user_id: string; workspace_id: string }
        Update: { created_at?: string; role?: string; user_id?: string; workspace_id?: string }
        Relationships: [{ foreignKeyName: "workspace_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }, { foreignKeyName: "workspace_members_workspace_id_fkey"; columns: ["workspace_id"]; isOneToOne: false; referencedRelation: "workspaces"; referencedColumns: ["id"] }]
      }
      workspaces: {
        Row: { created_at: string; id: string; name: string; owner_id: string; updated_at: string }
        Insert: { created_at?: string; id?: string; name: string; owner_id: string; updated_at?: string }
        Update: { created_at?: string; id?: string; name?: string; owner_id?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "workspaces_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_project_member: { Args: { _project_id: string; _user_id?: string }; Returns: boolean }
      is_task_member: { Args: { _task_id: string; _user_id?: string }; Returns: boolean }
      is_workspace_member: { Args: { _user_id?: string; _workspace_id: string }; Returns: boolean }
      is_workspace_owner: { Args: { _user_id?: string; _workspace_id: string }; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U } ? U : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never
    : never

export const Constants = {
  public: { Enums: {} },
} as const
