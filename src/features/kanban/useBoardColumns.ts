import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { BoardColumn } from "@/types/domain";

export function useBoardColumns(projectId: string | undefined) {
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColumns = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("board_columns")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Erreur de chargement des listes :", error);
      setError("Impossible de charger les listes de ce tableau.");
      setLoading(false);
      return;
    }
    setColumns(data ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  async function addColumn(title: string): Promise<{ error: string | null }> {
    if (!projectId) return { error: "Projet introuvable." };
    const trimmed = title.trim();
    if (!trimmed) return { error: "Le nom de la liste ne peut pas être vide." };

    const nextPosition = columns.length;
    const { data, error } = await supabase
      .from("board_columns")
      .insert({ project_id: projectId, name: trimmed, position: nextPosition })
      .select()
      .single();

    if (error || !data) {
      console.error("Erreur de création de la liste :", error);
      return { error: "La création de la liste a échoué." };
    }
    setColumns((prev) => [...prev, data]);
    return { error: null };
  }

  /**
   * Réordonne les listes du tableau selon l'ordre d'identifiants fourni
   * (obtenu par glisser-déposer côté UI) et persiste la nouvelle position de
   * chaque liste via des mises à jour individuelles (pas d'upsert, pour les
   * mêmes raisons que pour les tâches : éviter les colonnes obligatoires).
   */
  async function reorderColumns(orderedIds: string[]): Promise<{ error: string | null }> {
    const previous = columns;

    const reordered = orderedIds
      .map((id, index) => {
        const column = columns.find((c) => c.id === id);
        return column ? { ...column, position: index } : null;
      })
      .filter((c): c is BoardColumn => c !== null);

    if (reordered.length !== columns.length) return { error: null };

    setColumns(reordered);

    const results = await Promise.all(
      reordered.map((c) => supabase.from("board_columns").update({ position: c.position }).eq("id", c.id))
    );
    const failed = results.find((r) => r.error);

    if (failed?.error) {
      console.error("Erreur de réorganisation des listes :", failed.error);
      setColumns(previous);
      return { error: "Le réordonnancement des listes a échoué. Ordre restauré." };
    }
    return { error: null };
  }

  return { columns, loading, error, addColumn, reorderColumns, refetch: fetchColumns };
}
