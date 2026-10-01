import { defineStore } from "pinia";
import type { Prediction } from "~/types/prediction";

export const usePredictionStore = defineStore("predictions", () => {
  const predictions = ref<Prediction[]>([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    await new Promise((r) => setTimeout(r, 300));
    predictions.value = [
      {
        site: "BNA-001",
        riskScore: 91,
        probability: 0.91,
        severity: "critical",
        predictionWindow: "< 1 hour",
        factors: [{ metric: "latency", impact: "high", change: "+240%" }],
        model: "XGBoost",
        updated: new Date().toISOString(),
        confidence: 0.91,
      },
      {
        site: "BNA-023",
        riskScore: 84,
        probability: 0.84,
        severity: "critical",
        predictionWindow: "1-3 hours",
        factors: [{ metric: "cpu_usage", impact: "medium", change: "+20%" }],
        model: "LSTM",
        updated: new Date().toISOString(),
        confidence: 0.88,
      },
    ];
    loading.value = false;
  }
  return { predictions, loading, fetchAll };
});
