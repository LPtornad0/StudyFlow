import { HTMLAttributes, ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function KanbanColumn({
  id,
  title,
  count,
  color,
  children,
  headerHandleProps,
  onEdit,
}: {
  id: string;
  title: string;
  count: number;
  color?: string | null;
  children: ReactNode;
  headerHandleProps?: HTMLAttributes<HTMLDivElement>;
  onEdit?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-full flex-col gap-2 rounded-lg border bg-muted/40 p-3 transition-colors",
        isOver && "bg-accent"
      )}
      style={color ? { borderTop: `3px solid ${color}` } : undefined}
    >
      <div
        className={cn(
          "flex flex-none items-center justify-between gap-2 px-1",
          headerHandleProps && "cursor-grab touch-none active:cursor-grabbing"
        )}
        {...headerHandleProps}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {color && (
            <span
              className="h-2.5 w-2.5 flex-none rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
          )}
          <h2 className="truncate text-sm font-semibold">{title}</h2>
        </div>
        <div className="flex flex-none items-center gap-1">
          <span className="text-xs text-muted-foreground">{count}</span>
          {onEdit && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label={`Modifier la liste ${title}`}
              className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}
