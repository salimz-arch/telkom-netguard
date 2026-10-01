import type { Severity } from "./network";

export interface Anomaly {
  id: string;
  time: string;
  site: string;
  metric: string;
  expected: string;
  actual: string;
  deviation: string;
  severity: Severity;
  status: "open" | "investigating" | "resolved";
  score: number;
}
