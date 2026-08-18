import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Workspace } from "@/types/domain";
import { useAuth } from "@/features/auth/useAuth";

export function useWorkspaces() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur de chargement des espaces :", error);
      setError("Impossible de charger tes espaces de travail. Réessaie dans un instant.");
      setLoading(false);
      return;
    }
    setWorkspaces(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  async function createWorkspace(name: string): Promise<{ error: string | null }> {
    if (!user) return { error: "Utilisateur non authentifié." };

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({ name, owner_id: user.id })
      .select()
      .single();

    if (workspaceError || !workspace) {
      console.error("Erreur de création de l'espace :", workspaceError);
      return { error: "La création de l'espace a échoué." };
    }

    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({ workspace_id: workspace.id, user_id: user.id, role: "owner" });

    if (memberError) {
      console.error("Erreur d'ajout du membre owner :", memberError);
      return { error: "L'espace a été créé mais l'ajout du propriétaire a échoué." };
    }

    setWorkspaces((prev) => [workspace, ...prev]);
    return { error: null };
  }

  return { workspaces, loading, error, createWorkspace, refetch: fetchWorkspaces };
}
