export interface Incident {
  id: string;
  site: string;
  type: string;
  severity: "minor" | "major" | "critical";
  started: string;
  resolved?: string;
  duration: string;
  status: "open" | "investigating" | "mitigated" | "resolved";
  rootCause: string;
  timeline: { time: string; event: string; severity?: string }[];
}
