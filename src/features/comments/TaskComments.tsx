import { FormEvent, useState } from "react";
import { useComments } from "./useComments";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskComments({ taskId }: { taskId: string }) {
  const { user, profile } = useAuth();
  const { comments, loading, error, addComment, deleteComment } = useComments(taskId);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await addComment(content);
    setSubmitting(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    setContent("");
  }

  async function handleDelete(commentId: string) {
    const confirmed = window.confirm("Supprimer ce commentaire ?");
    if (!confirmed) return;
    const { error } = await deleteComment(commentId);
    if (error) setSubmitError(error);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <h3 className="text-sm font-semibold">Commentaires</h3>

      {loading && <LoadingState label="Chargement des commentaires…" />}
      {error && <ErrorState message={error} />}

      {!loading && !error && comments.length === 0 && (
        <EmptyState title="Aucun commentaire" description="Sois le premier à en laisser un." />
      )}

      {!loading && !error && comments.length > 0 && (
        <ul className="flex-1 space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: "22rem" }}>
          {comments.map((comment) => {
            const authorLabel =
              comment.author_name ??
              (comment.user_id === user?.id ? profile?.full_name ?? "Toi" : "Utilisateur");
            return (
              <li
                key={comment.id}
                className="rounded-lg border border-border bg-card p-3 text-sm shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{authorLabel}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatCommentDate(comment.created_at)}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-foreground/90">{comment.content}</p>
                {comment.user_id === user?.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="mt-1.5 text-xs text-destructive underline-offset-2 hover:underline"
                    aria-label="Supprimer ce commentaire"
                  >
                    Supprimer
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {submitError && <ErrorState message={submitError} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="new-comment" className="sr-only">
          Nouveau commentaire
        </label>
        <textarea
          id="new-comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Écrire un commentaire…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="sm" className="self-end" disabled={submitting || !content.trim()}>
          {submitting ? "Envoi…" : "Envoyer"}
        </Button>
      </form>
    </div>
  );
}
