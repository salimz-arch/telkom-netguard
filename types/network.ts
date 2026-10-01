export type Severity = "normal" | "warning" | "critical" | "info";
export type DeviceStatus = "online" | "offline" | "maintenance";

export interface NetworkHealth {
  score: number;
  status: Severity;
  availability: number;
  avgLatency: number;
  packetLoss: number;
  avgJitter: number;
  previousScore: number;

  // 🔥 FIX: Metadata real-time (optional, diisi kalau dari RIPE Atlas atau Mock)
  dataSource?: string; // 'RIPE Atlas' | 'Mock' | 'Fallback'
  lastFetch?: string; // ISO timestamp
  probeCount?: number; // total probe (real)
  connectedProbes?: number; // probe aktif (real)
  deviceRatio?: number; // rasio device sehat (untuk mock)
}

export interface MetricPoint {
  timestamp: string;
  traffic: number;
  latency: number;
  packetLoss: number;
  jitter: number;
  cpu: number;
  memory: number;
}

export interface KpiSummary {
  totalDevices: number;
  totalDevicesDelta: number;
  activeAnomalies: number;
  anomaliesDelta: number;
  predictedIncidents: number;
  predictionWindow: string;
  criticalSites: number;
}
