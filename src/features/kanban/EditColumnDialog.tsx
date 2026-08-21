import { FormEvent, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/shared/ErrorState";
import type { BoardColumn } from "@/types/domain";
import { TASK_COLOR_SWATCHES } from "./TASK_COLORS";
import { cn } from "@/lib/utils/cn";

export function EditColumnDialog({
  open,
  onOpenChange,
  column,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: BoardColumn | null;
  onSubmit: (columnId: string, patch: { name: string; color: string | null }) => Promise<{ error: string | null }>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (column) {
      setName(column.name);
      setColor(column.color ?? "");
    }
    setError(null);
  }, [column, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!column || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error } = await onSubmit(column.id, { name: name.trim(), color: color || null });
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Modifier la liste</DialogTitle>
        </DialogHeader>

        {error && <ErrorState message={error} />}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="column-name">Nom de la liste</Label>
            <Input id="column-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium leading-none">Couleur de la liste</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur de la liste">
              {TASK_COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.value || "none"}
                  type="button"
                  role="radio"
                  aria-checked={color === swatch.value}
                  aria-label={swatch.label}
                  title={swatch.label}
                  onClick={() => setColor(swatch.value)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    color === swatch.value ? "scale-110 border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: swatch.value || "transparent" }}
                >
                  {!swatch.value && (
                    <span className="flex h-full w-full items-center justify-center rounded-full border border-dashed text-[10px] text-muted-foreground">
                      Ø
                    </span>
                  )}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
