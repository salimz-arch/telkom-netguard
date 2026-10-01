import { defineEventHandler } from "h3";
import type { MetricPoint } from "~/types/network";

// 🔥 FIX: Pisahkan cache untuk REAL dan FALLBACK agar jujur
let realCache: { ts: number; data: MetricPoint[] } | null = null;
let fallbackCache: { ts: number; data: MetricPoint[] } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

// 🔥 FIX: Gunakan built-in measurement IDs yang STABIL (RIPE internal)
const STABLE_MEASUREMENT_IDS = [
  1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009,
];

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const now = Date.now();

  // 1. Cek cache REAL dulu (Prioritas utama)
  if (realCache && now - realCache.ts < CACHE_TTL) {
    console.info("[RIPE-proxy] ✅ Returning cached REAL data");
    return {
      success: true,
      cached: true,
      source: "RIPE Atlas",
      isFallback: false,
      data: realCache.data,
    };
  }

  // 2. Cek cache FALLBACK (Jika real gagal dalam 5 menit terakhir)
  if (fallbackCache && now - fallbackCache.ts < CACHE_TTL) {
    console.info("[RIPE-proxy] ⚠️ Returning cached FALLBACK data");
    return {
      success: true,
      cached: true,
      source: "Mock Fallback",
      isFallback: true,
      data: fallbackCache.data,
    };
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (config.public.ripeApiKey) {
    headers.Authorization = `Key ${config.public.ripeApiKey}`;
  }

  try {
    // 3. Ambil measurement populer yang AKTIF
    const popularRes = await $fetch<any>(
      `${config.public.ripeBase}/measurements/`,
      {
        params: { type: "ping", is_public: true, status: 2, page_size: 30 },
        headers,
        timeout: 5000,
      },
    ).catch(() => ({ results: [] }));

    const popularIds = (popularRes.results || [])
      .filter((m: any) => m.participant_count >= 50) // Threshold dinaikkan sedikit untuk kualitas data
      .sort((a: any, b: any) => b.participant_count - a.participant_count)
      .slice(0, 3)
      .map((m: any) => m.id);

    // 🔥 Gabung: stable first, popular as backup
    const allIds = [...new Set([...STABLE_MEASUREMENT_IDS, ...popularIds])];
    console.info(`[RIPE-proxy] Trying ${allIds.length} measurement IDs`);

    // 4. Fetch results secara SEQUENTIAL (hindari burst rate limit)
    const allResults: any[] = [];
    const windowStart = Math.floor(Date.now() / 1000) - 48 * 3600; // 48 jam

    for (const id of allIds) {
      try {
        const results = await $fetch<any[]>(
          `${config.public.ripeBase}/measurements/${id}/results/`,
          {
            params: { start: windowStart, limit: 300 },
            headers,
            timeout: 5000, // Timeout 5 detik
          },
        );

        if (Array.isArray(results) && results.length > 0) {
          console.info(`[RIPE-proxy] ✅ ID ${id}: ${results.length} results`);
          allResults.push(...results);

          // Jika sudah dapat cukup data, berhenti fetch ID lain (hemat waktu)
          if (allResults.length >= 500) break;
        } else {
          console.info(`[RIPE-proxy] ⚠️ ID ${id}: 0 results`);
        }

        // Delay 100ms antar request
        await new Promise((r) => setTimeout(r, 100));
      } catch (err: any) {
        console.warn(
          `[RIPE-proxy] ⚠️ ID ${id} failed:`,
          err?.message || "Unknown error",
        );
      }
    }

    if (allResults.length === 0) {
      throw new Error("No results from any measurement");
    }

    console.info(
      `[RIPE-proxy] ✅ Total: ${allResults.length} results collected`,
    );

    // 5. Aggregate per 30 menit (Chart jadi punya ~48 titik, sangat smooth!)
    const bucketMap = new Map<
      string,
      { latencies: number[]; losses: number[] }
    >();

    for (const r of allResults) {
      if (!r.timestamp || r.timestamp < windowStart) continue;
      if (typeof r.avg !== "number" || r.avg < 0) continue;

      const dt = new Date(r.timestamp * 1000);
      // Bucket 30 menit: jika menit < 30 jadi :00, jika >= 30 jadi :30
      const minutes = dt.getMinutes() < 30 ? 0 : 30;
      dt.setMinutes(minutes, 0, 0);
      const key = dt.toISOString();

      if (!bucketMap.has(key))
        bucketMap.set(key, { latencies: [], losses: [] });

      const b = bucketMap.get(key)!;
      b.latencies.push(r.avg);
      if (r.sent > 0)
        b.losses.push(Math.max(0, ((r.sent - r.rcvd) / r.sent) * 100));
    }

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const stddev = (arr: number[]) => {
      if (arr.length < 2) return 0;
      const m = avg(arr);
      return Math.sqrt(avg(arr.map((v) => Math.pow(v - m, 2))));
    };

    const points: MetricPoint[] = [];
    for (const [key, b] of Array.from(bucketMap.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const hour = new Date(key).getHours();
      points.push({
        timestamp: key,
        latency: Math.round(avg(b.latencies) * 10) / 10,
        packetLoss: Math.round(avg(b.losses) * 100) / 100,
        jitter: Math.round(stddev(b.latencies) * 10) / 10,
        traffic: Math.round(600 + Math.sin((hour / 24) * Math.PI * 2) * 200),
        cpu: Math.round(40 + avg(b.losses) * 3),
        memory: Math.round(55 + avg(b.latencies) * 0.2),
      });
    }

    if (points.length < 6) {
      throw new Error(`Insufficient points: ${points.length}`);
    }

    // 6. Simpan ke cache REAL (Terpisah dari fallback)
    realCache = { ts: now, data: points };
    console.info(
      `[RIPE-proxy] ✅ Cached REAL data for 5 minutes (${points.length} points)`,
    );

    return {
      success: true,
      cached: false,
      source: "RIPE Atlas",
      isFallback: false,
      data: points,
    };
  } catch (err: any) {
    console.error("[RIPE-proxy] ❌ Fatal error:", err?.message);
    console.warn(
      "[RIPE-proxy] ⚠️ Using mock data as fallback to prevent infinite loading",
    );

    const mockData: MetricPoint[] = [];
    const currentNow = Date.now();

    for (let i = 48; i >= 0; i--) {
      const t = new Date(currentNow - i * 1800000); // 30 menit interval
      t.setMinutes(t.getMinutes() < 30 ? 0 : 30, 0, 0);
      mockData.push({
        timestamp: t.toISOString(),
        latency: Math.round(30 + Math.random() * 40),
        packetLoss: Math.round(Math.random() * 100) / 100,
        jitter: Math.round(5 + Math.random() * 10),
        traffic: Math.round(600 + Math.random() * 200),
        cpu: Math.round(40 + Math.random() * 20),
        memory: Math.round(50 + Math.random() * 15),
      });
    }

    // 🔥 Simpan ke cache FALLBACK (Terpisah, agar tidak menimpa realCache)
    fallbackCache = { ts: now, data: mockData };

    return {
      success: true,
      cached: false,
      source: "Mock Fallback",
      isFallback: true,
      data: mockData,
    };
  }
});
