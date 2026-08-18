import { useMemo, useState } from "react";
import type { Task } from "@/types/domain";
import {
  computeWorkload,
  DEFAULT_WORKLOAD_ASSUMPTIONS,
  type WorkloadAssumptions,
} from "./computeWorkload";

export function useWorkload(tasks: Task[]) {
  const [assumptions] = useState<WorkloadAssumptions>(DEFAULT_WORKLOAD_ASSUMPTIONS);
  const summary = useMemo(() => computeWorkload(tasks, assumptions), [tasks, assumptions]);
  return { summary, assumptions };
}
