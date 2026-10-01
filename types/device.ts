import type { Severity, DeviceStatus } from "./network";

export interface Device {
  id: string;
  site: string;
  region: string;
  type: "router" | "switch" | "olt" | "bts" | "gateway";
  status: DeviceStatus;
  health: number;
  cpu: number;
  memory: number;
  traffic: number;
  latency: number;
  packetLoss: number;
  risk: Severity;
  riskScore: number;
  lastSeen: string;
  location: { lat: number; lng: number };
}
