import { HTMLAttributes, ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils/cn";

export function KanbanColumn({
  id,
  title,
  count,
  children,
  headerHandleProps,
}: {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
  headerHandleProps?: HTMLAttributes<HTMLDivElement>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-full flex-col gap-2 rounded-lg border bg-muted/40 p-3 transition-colors",
        isOver && "bg-accent"
      )}
    >
      <div
        className={cn(
          "flex flex-none items-center justify-between px-1",
          headerHandleProps && "cursor-grab touch-none active:cursor-grabbing"
        )}
        {...headerHandleProps}
      >
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}
