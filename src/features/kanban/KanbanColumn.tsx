import { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils/cn";

export function KanbanColumn({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border bg-muted/40 p-3 transition-colors",
        isOver && "bg-accent"
      )}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="flex min-h-[120px] max-h-[65vh] flex-col gap-2 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}
