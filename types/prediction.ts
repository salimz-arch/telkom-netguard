export interface RiskFactor {
  metric: string;
  impact: "low" | "medium" | "high";
  change: string;
}

export interface Prediction {
  site: string;
  riskScore: number;
  probability: number;
  severity: "normal" | "warning" | "critical";
  predictionWindow: string;
  factors: RiskFactor[];
  model: string;
  updated: string;
  confidence: number;
}
