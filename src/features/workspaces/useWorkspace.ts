import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Workspace } from "@/types/domain";

export function useWorkspace(workspaceId: string | undefined) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("Erreur de chargement de l'espace :", error);
          setError("Cet espace est introuvable ou tu n'y as pas accès.");
          setLoading(false);
          return;
        }
        setWorkspace(data);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  return { workspace, loading, error };
}
