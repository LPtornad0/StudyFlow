import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Project } from "@/types/domain";

export function useProjects(workspaceId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur de chargement des projets :", error);
      setError("Impossible de charger les projets de cet espace.");
      setLoading(false);
      return;
    }
    setProjects(data ?? []);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function createProject(name: string, description?: string): Promise<{ error: string | null }> {
    if (!workspaceId) return { error: "Espace de travail introuvable." };
    const { data, error } = await supabase
      .from("projects")
      .insert({ workspace_id: workspaceId, name, description: description || null })
      .select()
      .single();

    if (error || !data) {
      console.error("Erreur de création du projet :", error);
      return { error: "La création du projet a échoué." };
    }
    setProjects((prev) => [data, ...prev]);
    return { error: null };
  }

  return { projects, loading, error, createProject, refetch: fetchProjects };
}
