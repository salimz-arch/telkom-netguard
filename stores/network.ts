import { defineStore } from "pinia";
import { ref, computed } from "vue"; // 🔥 FIX: IMPORT INI WAJIB!
import type { NetworkHealth, MetricPoint, KpiSummary } from "~/types/network";
import { useApi } from "~/services/api";

export const useNetworkStore = defineStore("network", () => {
  const api = useApi();

  // State
  const health = ref<NetworkHealth | null>(null);
  const metrics = ref<MetricPoint[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<Date | null>(null);

  // 🔥 NEW: Track data source secara eksplisit untuk UI badges
  const dataSource = ref<"real" | "mock" | "fallback">("mock");

  // Computed KPI (Mocked untuk konsistensi dashboard)
  const kpi = computed<KpiSummary>(() => ({
    totalDevices: 1248,
    totalDevicesDelta: 12,
    activeAnomalies: 17,
    anomaliesDelta: 4,
    predictedIncidents: 5,
    predictionWindow: "Next 6 hours",
    criticalSites: 3,
  }));

  // Actions
  async function fetchAll() {
    loading.value = true;
    error.value = null;

    try {
      // Fetch metrics dulu untuk cek apakah RIPE berhasil atau fallback
      const metricsRes = await $fetch<{
        data: MetricPoint[];
        source?: string;
        isFallback?: boolean;
      }>("/api/ripe/metrics", { timeout: 15000 });

      // Fetch health
      const healthRes = await api.get<any>("/network/health");

      metrics.value = metricsRes.data;
      health.value = healthRes;

      // 🔥 FIX: Deteksi sumber data yang JUJUR (Real, Mock, atau Fallback)
      if (
        metricsRes.source === "Mock Fallback" ||
        metricsRes.isFallback === true ||
        healthRes?.dataSource === "Mock Fallback" ||
        healthRes?.dataSource === "Mock"
      ) {
        dataSource.value = "fallback"; // Badge akan jadi DEGRADED
        console.warn("[NetworkStore] ⚠️ Using FALLBACK data (RIPE failed)");
      } else if (
        metricsRes.source === "RIPE Atlas" ||
        healthRes?.dataSource === "RIPE Atlas"
      ) {
        dataSource.value = "real"; // Badge akan jadi HYBRID LIVE
        console.info("[NetworkStore] ✅ Using REAL RIPE data");
      } else {
        dataSource.value = "mock"; // Fallback default
      }

      lastUpdated.value = new Date();
    } catch (e: any) {
      error.value = e.message || "Failed to load network data";
      dataSource.value = "fallback"; // Tandai sebagai fallback jika benar-benar error network
      console.error("[NetworkStore] Fetch failed:", e);
    } finally {
      loading.value = false;
    }
  }

  return {
    health,
    metrics,
    kpi,
    loading,
    error,
    lastUpdated,
    dataSource, // 🔥 Expose ke komponen agar bisa dipakai di AppHeader.vue / useDataSource
    fetchAll,
  };
});
