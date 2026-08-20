import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/useAuth";

export type CommentWithAuthor = {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name: string | null;
};

export function useComments(taskId: string | undefined) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("comments")
      .select("id, task_id, user_id, content, created_at, updated_at, profiles ( full_name )")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erreur de chargement des commentaires :", error);
      setError("Impossible de charger les commentaires de cette tâche.");
      setLoading(false);
      return;
    }

    type Row = {
      id: string;
      task_id: string;
      user_id: string;
      content: string;
      created_at: string;
      updated_at: string;
      profiles: { full_name: string | null } | { full_name: string | null }[] | null;
    };

    const mapped: CommentWithAuthor[] = ((data ?? []) as Row[]).map((row) => {
      const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: row.id,
        task_id: row.task_id,
        user_id: row.user_id,
        content: row.content,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author_name: profileRow?.full_name ?? null,
      };
    });

    setComments(mapped);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function addComment(content: string): Promise<{ error: string | null }> {
    if (!taskId || !user) return { error: "Impossible d'ajouter un commentaire." };
    const trimmed = content.trim();
    if (!trimmed) return { error: "Le commentaire ne peut pas être vide." };

    const { data, error } = await supabase
      .from("comments")
      .insert({ task_id: taskId, user_id: user.id, content: trimmed })
      .select("id, task_id, user_id, content, created_at, updated_at")
      .single();

    if (error || !data) {
      console.error("Erreur de création du commentaire :", error);
      return { error: "L'ajout du commentaire a échoué." };
    }

    setComments((prev) => [
      ...prev,
      { ...data, author_name: profile?.full_name ?? null },
    ]);
    return { error: null };
  }

  async function deleteComment(commentId: string): Promise<{ error: string | null }> {
    const previous = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) {
      console.error("Erreur de suppression du commentaire :", error);
      setComments(previous);
      return { error: "La suppression du commentaire a échoué." };
    }
    return { error: null };
  }

  return { comments, loading, error, addComment, deleteComment, refetch: fetchComments };
}
