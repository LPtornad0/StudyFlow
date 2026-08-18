import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type Mode = "write" | "preview";

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 6,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [mode, setMode] = useState<Mode>("write");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1" role="tablist" aria-label="Mode d'édition de la description">
        <Button
          type="button"
          variant={mode === "write" ? "secondary" : "ghost"}
          size="sm"
          role="tab"
          aria-selected={mode === "write"}
          onClick={() => setMode("write")}
        >
          Écrire
        </Button>
        <Button
          type="button"
          variant={mode === "preview" ? "secondary" : "ghost"}
          size="sm"
          role="tab"
          aria-selected={mode === "preview"}
          onClick={() => setMode("preview")}
        >
          Aperçu
        </Button>
      </div>

      {mode === "write" ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Écris en Markdown : **gras**, *italique*, listes, liens…"}
          rows={rows}
          className={cn(
            "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
          )}
        />
      ) : (
        <div
          className="min-h-[120px] rounded-md border border-input bg-muted/30 px-3 py-2 text-sm prose prose-sm max-w-none dark:prose-invert"
          aria-live="polite"
        >
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted-foreground">Rien à prévisualiser pour le moment.</p>
          )}
        </div>
      )}
    </div>
  );
}
