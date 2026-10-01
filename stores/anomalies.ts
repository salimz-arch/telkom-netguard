import { defineStore } from "pinia";
import type { Anomaly } from "~/types/anomaly";
import { useApi } from "~/services/api";

export const useAnomalyStore = defineStore("anomalies", () => {
  const api = useApi();
  const anomalies = ref<Anomaly[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll() {
    if (anomalies.value.length > 0) return; // Cache guard - jangan fetch ulang kalau sudah ada data

    loading.value = true;
    error.value = null;

    try {
      anomalies.value = await api.get<Anomaly[]>("/anomalies");
    } catch (e: any) {
      error.value = e.message || "Failed to load anomalies";
      console.error("Anomaly fetch error:", e);
    } finally {
      loading.value = false;
    }
  }

  return { anomalies, loading, error, fetchAll };
});
