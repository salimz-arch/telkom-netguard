import { ripeAtlasProvider } from "./providers/ripeAtlas";

// 🔥 FIX: Import dari file spesifik untuk menghindari error "Cannot find module '~/types'"
import type { NetworkHealth, MetricPoint } from "~/types/network";
import type { Anomaly } from "~/types/anomaly";
import type { Device } from "~/types/device";
import type { Prediction } from "~/types/prediction";
import type { Incident } from "~/types/incident";

export const useApi = () => {
  const config = useRuntimeConfig();

  // Jika useMock = true, pakai full mock.
  // Jika useMock = false, aktifkan mode Hybrid (Real RIPE + Mock Devices)
  const useMock = config.public.useMock === true;

  async function get<T>(path: string, params?: any): Promise<T> {
    // 1. ROUTE KE REAL DATA (Jika Hybrid Mode Aktif)
    if (!useMock) {
      if (path === "/network/metrics") {
        try {
          const realMetrics = await ripeAtlasProvider.getAggregatedMetrics();
          return realMetrics as T;
        } catch (error) {
          console.warn(
            "[API] RIPE metrics failed, falling back to mock:",
            error,
          );
        }
      }

      if (path === "/network/health") {
        try {
          const realHealth = await ripeAtlasProvider.getRealNetworkHealth();
          return realHealth as T;
        } catch (error) {
          console.warn(
            "[API] RIPE health failed, falling back to mock:",
            error,
          );
        }
      }

      // 🔥 FIX: Generate anomalies berdasarkan metrik real untuk memastikan FK integrity
      if (path === "/anomalies") {
        try {
          const metricsRes = await $fetch<{
            data: MetricPoint[];
            isFallback?: boolean;
          }>("/api/ripe/metrics", {
            timeout: 10000,
          });

          // Jika server sudah fallback ke mock, lebih baik langsung pakai mock resolver agar konsisten
          if (
            metricsRes.isFallback ||
            !metricsRes.data ||
            metricsRes.data.length === 0
          ) {
            return await mockResolver<T>("/anomalies", params);
          }

          const metrics = metricsRes.data;
          const devices = await mockResolver<Device[]>("/devices");

          // 🔥 GUARANTEED VALID: Hanya gunakan ID yang benar-benar ada di database mock
          const validDeviceIds = devices.map((d) => d.id);

          const latencies = metrics.map((m) => m.latency);
          const losses = metrics.map((m) => m.packetLoss);
          const meanLat =
            latencies.reduce((a, b) => a + b, 0) / latencies.length;
          const meanLoss = losses.reduce((a, b) => a + b, 0) / losses.length;

          const anomalies: Anomaly[] = [];

          metrics.forEach((m, i) => {
            // Latency anomaly
            if (m.latency > meanLat * 1.5) {
              const devId = validDeviceIds[i % validDeviceIds.length];
              anomalies.push({
                id: `ANM-RA-${String(anomalies.length + 1).padStart(4, "0")}`,
                time: m.timestamp,
                site: devId, // 🔥 FK Integrity: Tidak ada lagi phantom ID
                metric: "Latency",
                expected: `${Math.round(meanLat * 0.7)}–${Math.round(meanLat * 1.3)} ms`,
                actual: `${m.latency} ms`,
                deviation: `+${Math.round(((m.latency - meanLat) / meanLat) * 100)}%`,
                severity: m.latency > meanLat * 2 ? "critical" : "warning",
                status: "open",
                score: Math.min(0.99, 0.5 + (m.latency / meanLat - 1) * 0.5),
              } as Anomaly);
            }

            // Packet loss anomaly
            if (m.packetLoss > Math.max(0.5, meanLoss * 3)) {
              const devId = validDeviceIds[(i + 5) % validDeviceIds.length];
              anomalies.push({
                id: `ANM-RL-${String(anomalies.length + 1).padStart(4, "0")}`,
                time: m.timestamp,
                site: devId, // 🔥 FK Integrity: Tidak ada lagi phantom ID
                metric: "Packet Loss",
                expected: `0–${(meanLoss * 1.5).toFixed(1)} %`,
                actual: `${m.packetLoss}%`,
                deviation: `+${Math.round(((m.packetLoss - meanLoss) / Math.max(meanLoss, 0.1)) * 100)}%`,
                severity: m.packetLoss > 2 ? "critical" : "warning",
                status: "open",
                score: Math.min(0.99, m.packetLoss / 10),
              } as Anomaly);
            }
          });

          // Lengkapi dengan mock jika data real terlalu sedikit (pastikan FK tetap valid via mockResolver)
          if (anomalies.length < 15) {
            const mock = await mockResolver<Anomaly[]>("/anomalies");
            anomalies.push(...mock.slice(0, 30 - anomalies.length));
          }

          return (
            anomalies.length > 0
              ? anomalies
              : await mockResolver<Anomaly[]>("/anomalies")
          ) as T;
        } catch (err) {
          console.warn(
            "[API] Anomaly generation failed, falling back to mock:",
            err,
          );
          return mockResolver<T>("/anomalies", params);
        }
      }
    }

    // 2. FALLBACK KE MOCK (Untuk Devices, Anomalies, Predictions, Incidents, atau jika RIPE gagal)
    return mockResolver<T>(path, params);
  }

  return { get, useMock };
};

// ==========================================
// MOCK RESOLVER
// (Menjaga konsistensi data device, anomaly, dll)
// ==========================================
let _cache: any = null;

async function mockResolver<T>(path: string, _params?: any): Promise<T> {
  // Dynamic import memastikan kita selalu mengambil versi terbaru dari mockData
  const {
    generateDevices,
    generateMetrics,
    generateAnomalies,
    generatePredictions,
    generateIncidents,
    mockHealth,
  } = await import("~/utils/mockData");

  // Cache data agar tidak di-generate ulang setiap request (hemat performa CPU)
  if (!_cache) {
    _cache = {
      devices: generateDevices(100),
      metrics: generateMetrics(24),
      anomalies: generateAnomalies(50),
      predictions: generatePredictions(),
      incidents: generateIncidents(25), // 🔥 FIX: Pastikan count = 25 agar tidak cuma 1 row
    };
  }

  // Simulasi delay network 200ms agar transisi loading state terasa natural
  await new Promise((r) => setTimeout(r, 200));

  // Routing mock data berdasarkan path
  if (path.startsWith("/devices/")) {
    const id = path.split("/").pop();
    return _cache.devices.find((d: Device) => d.id === id) as T;
  }
  if (path === "/devices") return _cache.devices as T;
  if (path === "/network/metrics") return _cache.metrics as T;

  if (path === "/network/health") {
    return {
      ...mockHealth,
      dataSource: "Mock",
    } as T;
  }

  if (path === "/anomalies") return _cache.anomalies as T;
  if (path === "/predictions") return _cache.predictions as T;
  if (path === "/incidents") return _cache.incidents as T;

  throw new Error(`Route not found: ${path}`);
}
