import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/ErrorState";

export function AddColumnForm({
  onAdd,
}: {
  onAdd: (title: string) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error } = await onAdd(title);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    setTitle("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label="Ajouter une liste au tableau"
      >
        + Ajouter une liste
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border bg-muted/40 p-3">
      {error && <ErrorState message={error} />}
      <label htmlFor="new-column-title" className="sr-only">
        Nom de la nouvelle liste
      </label>
      <Input
        id="new-column-title"
        autoFocus
        placeholder="Nom de la liste"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
          {submitting ? "Ajout…" : "Ajouter la liste"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setTitle("");
            setError(null);
          }}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
