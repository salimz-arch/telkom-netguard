import dayjs from "dayjs";
import type { Device } from "~/types/device";
import type { Anomaly } from "~/types/anomaly";
import type { Prediction } from "~/types/prediction";
import type { Incident } from "~/types/incident";
import type { MetricPoint, NetworkHealth } from "~/types/network";

/**
 * PRNG (Pseudo-Random Number Generator) Deterministik
 *
 * WHY: Menggunakan seed tetap (42) memastikan data yang di-generate
 * SELALU SAMA setiap kali halaman di-refresh. Ini krusial untuk
 * debugging dan demo, sehingga operator tidak bingung melihat data
 * yang berubah-ubah secara acak saat presentasi.
 */
let seed = 42;
const rand = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

/**
 * REGION_COORDINATES — 15 Hub Strategis Nasional
 *
 * WHY: Mengikuti topologi backbone Palapa Ring.
 * Pemilihan 15 kota ini memberikan persebaran visual yang realistis
 * di peta tanpa membuat peta terlihat terlalu padat (cluttered)
 * atau terlalu kosong.
 */
const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // SUMATERA
  "Banda Aceh": { lat: 5.5483, lng: 95.3238 },
  Medan: { lat: 3.5952, lng: 98.6722 },
  Palembang: { lat: -2.9909, lng: 104.7566 },
  Padang: { lat: -0.9471, lng: 100.4172 },

  // JAWA (Pusat Jaringan Backbone)
  Jakarta: { lat: -6.2088, lng: 106.8456 },
  Bandung: { lat: -6.9175, lng: 107.6191 },
  Semarang: { lat: -6.9667, lng: 110.4167 },
  Yogyakarta: { lat: -7.7956, lng: 110.3695 },
  Surabaya: { lat: -7.2575, lng: 112.7521 },
  Denpasar: { lat: -8.65, lng: 115.2167 },

  // KALIMANTAN
  Pontianak: { lat: -0.0263, lng: 109.3425 },
  Balikpapan: { lat: -1.2379, lng: 116.8529 },
  Banjarmasin: { lat: -3.3194, lng: 114.5907 },

  // SULAWESI & TIMUR
  Makassar: { lat: -5.1477, lng: 119.4327 },
  Manado: { lat: 1.4748, lng: 124.8421 },
  Batam: { lat: 1.0456, lng: 104.0305 },
};

// Auto-generate REGIONS dari keys
const REGIONS = Object.keys(REGION_COORDINATES);

const TYPES: Device["type"][] = ["router", "switch", "olt", "bts", "gateway"];

/**
 * REGION_PREFIX — 3-letter code per city (IATA-style)
 *
 * WHY: Mencegah collision ID (misal: Banda Aceh, Bandung, Banjarmasin
 * sama-sama "BAN"). Prefix unik memungkinkan log parsing yang reliable,
 * alert routing yang akurat, dan mencegah operational disaster
 * (salah kirim tim dispatch ke kota yang salah).
 */
const REGION_PREFIX: Record<string, string> = {
  "Banda Aceh": "ACE",
  Medan: "MED",
  Palembang: "PLM",
  Padang: "PDG",
  Jakarta: "JKT",
  Bandung: "BDG",
  Semarang: "SMG",
  Yogyakarta: "YOG",
  Surabaya: "SUB",
  Denpasar: "DPS",
  Pontianak: "PNK",
  Balikpapan: "BPN",
  Banjarmasin: "BJM",
  Makassar: "MKS",
  Manado: "MND",
  Batam: "BTM",
};

function getRegionPrefix(region: string): string {
  return REGION_PREFIX[region] || region.slice(0, 3).toUpperCase();
}

/**
 * SPREAD_RADIUS — 0.2° (~22km)
 *
 * WHY: Marker harus rapat di pusat kota agar tidak overlap dengan
 * cluster kota tetangga. Jarak antar kota terdekat (Jakarta-Bandung)
 * ~150km, jadi variasi ±22km sangat aman untuk menjaga integritas
 * visual cluster di peta.
 */
const SPREAD_RADIUS = 0.4; // 0.2 * 2 untuk range random

// Generator device dengan pola realistis
export function generateDevices(count = 100): Device[] {
  const devices: Device[] = [];
  for (let i = 0; i < count; i++) {
    const region = REGIONS[i % REGIONS.length];
    const prefix = getRegionPrefix(region);
    const id = `${prefix}-${String(i + 1).padStart(3, "0")}`;

    const isProblem = i < 5; // 5 device bermasalah
    const isWarning = i >= 5 && i < 20;

    const baseLatency = isProblem
      ? 120 + rand() * 100
      : isWarning
        ? 60 + rand() * 40
        : 10 + rand() * 30;

    const packetLoss = isProblem
      ? 3 + rand() * 12
      : isWarning
        ? 1 + rand() * 2
        : rand() * 0.8;

    const cpu = isProblem
      ? 80 + rand() * 18
      : isWarning
        ? 60 + rand() * 25
        : 20 + rand() * 50;

    const traffic = 200 + rand() * 800;

    // Ambil koordinat dasar, lalu beri variasi KECIL (±0.2° ≈ ±22km)
    const baseCoord = REGION_COORDINATES[region] || { lat: -6.2, lng: 106.8 };
    const latVariation = (rand() - 0.5) * SPREAD_RADIUS;
    const lngVariation = (rand() - 0.5) * SPREAD_RADIUS;

    devices.push({
      id,
      site: id,
      region,
      type: TYPES[i % TYPES.length],
      status: "online",
      // 🔥 FIX: Semua angka dibulatkan (rounded) untuk UI yang bersih
      health: Math.round(
        isProblem
          ? 30 + rand() * 20
          : isWarning
            ? 60 + rand() * 20
            : 85 + rand() * 15,
      ),
      cpu: Math.round(cpu),
      memory: Math.round(isProblem ? 75 + rand() * 20 : 40 + rand() * 40),
      traffic: Math.round(traffic),
      latency: Math.round(baseLatency),
      packetLoss: +packetLoss.toFixed(1),
      risk: isProblem ? "critical" : isWarning ? "warning" : "normal",
      riskScore: Math.round(
        isProblem
          ? 80 + rand() * 15
          : isWarning
            ? 50 + rand() * 30
            : rand() * 30,
      ),
      lastSeen: dayjs()
        .subtract(Math.floor(rand() * 30), "seconds")
        .toISOString(),
      location: {
        lat: baseCoord.lat + latVariation,
        lng: baseCoord.lng + lngVariation,
      },
    });
  }
  return devices;
}

export function generateMetrics(hours = 24): MetricPoint[] {
  const now = dayjs();
  const points: MetricPoint[] = [];
  for (let i = hours; i >= 0; i--) {
    const t = now.subtract(i, "hour");
    const hourOfDay = t.hour();
    const peak = Math.sin(((hourOfDay - 6) / 24) * Math.PI) * 0.5 + 0.5;
    const traffic = 300 + peak * 600 + (rand() - 0.5) * 100;
    const cpu = 30 + peak * 40 + (rand() - 0.5) * 15;
    const latency = 20 + peak * 30 + (rand() - 0.5) * 10 + (cpu > 70 ? 40 : 0);
    const packetLoss = Math.max(0, (cpu - 65) * 0.15 + (rand() - 0.5) * 0.5);

    points.push({
      timestamp: t.toISOString(),
      traffic: Math.round(traffic),
      latency: Math.round(latency),
      packetLoss: +packetLoss.toFixed(2),
      jitter: Math.round(4 + peak * 8 + (rand() - 0.5) * 3),
      cpu: Math.round(cpu),
      memory: Math.round(40 + peak * 30 + (rand() - 0.5) * 10),
    });
  }
  return points;
}

/**
 * Data Integrity: Anomaly & Incident mengambil referensi dari Device yang valid.
 * Ini meniru prinsip FOREIGN KEY di database relational.
 */
export function generateAnomalies(count = 50): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const metrics = [
    "Latency",
    "Packet Loss",
    "CPU",
    "Memory",
    "Jitter",
    "Traffic",
  ];
  const validDevices = generateDevices(100);
  const validDeviceIds = validDevices.map((d) => d.id);

  // 🔥 FIX: Baseline realistis per metrik agar deviasi bervariasi
  const baselines: Record<string, { min: number; max: number; unit: string }> =
    {
      Latency: { min: 15, max: 40, unit: "ms" },
      "Packet Loss": { min: 0, max: 1, unit: "%" },
      CPU: { min: 30, max: 70, unit: "%" },
      Memory: { min: 40, max: 75, unit: "%" },
      Jitter: { min: 5, max: 15, unit: "ms" },
      Traffic: { min: 400, max: 800, unit: "Mbps" },
    };

  for (let i = 0; i < count; i++) {
    const severity = i < 5 ? "critical" : i < 17 ? "warning" : "normal";
    const metric = metrics[i % metrics.length];
    const baseline = baselines[metric];

    // 🔥 FIX: Gunakan index modulo untuk menjamin FK integrity yang deterministik
    const deviceId = validDeviceIds[i % validDeviceIds.length];

    const expectedRange = `${baseline.min}–${baseline.max} ${baseline.unit}`;
    const multiplier =
      severity === "critical"
        ? 2.5 + rand() * 2
        : severity === "warning"
          ? 1.5 + rand()
          : 1.1 + rand() * 0.3;

    const actual = Math.round(baseline.max * multiplier);
    const devPercent = Math.round((multiplier - 1) * 100);

    anomalies.push({
      id: `ANM-${String(i + 1).padStart(4, "0")}`,
      time: dayjs()
        .subtract(i * 3, "minutes")
        .toISOString(),
      site: deviceId,
      metric,
      expected: expectedRange,
      actual: `${actual} ${baseline.unit}`,
      deviation: `+${devPercent}%`, // 🔥 Sekarang bervariasi, tidak lagi seragam
      severity,
      status: i < 20 ? "open" : i < 35 ? "investigating" : "resolved",
      score: +(0.5 + rand() * 0.45).toFixed(2),
    });
  }
  return anomalies;
}

export function generatePredictions(): Prediction[] {
  // Site ID yang valid dan realistis
  const sites = [
    "JKT-001", // Jakarta - Critical
    "MED-023", // Medan - Critical
    "YOG-014", // Yogyakarta - Warning
    "SUB-031", // Surabaya - Normal
    "JKT-007", // Jakarta - Warning
    "SUB-012", // Surabaya - Warning
  ];
  const models = ["XGBoost", "LSTM", "Random Forest"];

  return sites.map((site, i) => ({
    site,
    riskScore: Math.round([91, 84, 72, 18, 55, 63][i]),
    probability: [0.91, 0.84, 0.72, 0.18, 0.55, 0.63][i],
    severity: (i < 2
      ? "critical"
      : i < 3
        ? "warning"
        : "normal") as Prediction["severity"],
    predictionWindow: i < 2 ? "< 1 hour" : i < 3 ? "1–3 hours" : "3–6 hours",
    factors: [
      { metric: "latency", impact: "high", change: `+${180 + i * 20}%` },
      { metric: "packet_loss", impact: "high", change: `+${400 + i * 50}%` },
      { metric: "cpu_usage", impact: "medium", change: `+${20 + i * 5}%` },
    ],
    model: models[i % models.length],
    updated: dayjs().subtract(2, "minute").toISOString(),
    confidence: +(0.88 + rand() * 0.1).toFixed(2),
  }));
}

export function generateIncidents(count = 25): Incident[] {
  // 🔥 FIX: FK Constraint ketat menggunakan validDeviceIds
  const validDevices = generateDevices(100);
  const validDeviceIds = validDevices.map((d) => d.id);

  return Array.from({ length: count }, (_, i) => {
    const statuses: Incident["status"][] = [
      "open",
      "investigating",
      "mitigated",
      "resolved",
    ];
    const status = statuses[i % 4];
    const start = dayjs().subtract(i * 45, "minute");
    const dur = 15 + Math.floor(rand() * 60);

    // Gunakan index modulo untuk menjamin site ID selalu valid dan ada di tabel Devices
    const deviceId = validDeviceIds[i % validDeviceIds.length];

    return {
      id: `INC-2026-${String(i + 1).padStart(3, "0")}`,
      site: deviceId,
      type: [
        "Latency Degradation",
        "Packet Loss",
        "Device Failure",
        "Congestion",
        "Power Issue",
      ][i % 5],
      severity: (i < 3
        ? "critical"
        : i < 10
          ? "major"
          : "minor") as Incident["severity"],
      started: start.toISOString(),
      resolved:
        status === "resolved"
          ? start.add(dur, "minute").toISOString()
          : undefined,
      duration: `${dur} minutes`,
      status,
      rootCause: [
        "Fiber cut",
        "High traffic",
        "Hardware failure",
        "Configuration error",
      ][i % 4],
      timeline: [
        {
          time: start.subtract(12, "minute").format("HH:mm"),
          event: "Network metrics normal",
        },
        {
          time: start.subtract(4, "minute").format("HH:mm"),
          event: "Latency anomaly detected",
          severity: "warning",
        },
        {
          time: start.format("HH:mm"),
          event: "Critical threshold exceeded",
          severity: "critical",
        },
        {
          time: start.add(3, "minute").format("HH:mm"),
          event: "AI prediction escalated",
          severity: "warning",
        },
        {
          time: start.add(9, "minute").format("HH:mm"),
          event: "Service degradation detected",
          severity: "critical",
        },
        ...(status === "resolved"
          ? [
              {
                time: start.add(dur, "minute").format("HH:mm"),
                event: "Network recovered",
                severity: "normal",
              },
            ]
          : []),
      ],
    };
  });
}

// ==========================================
// FALLBACK HEALTH DATA (Untuk Hybrid Mode)
// ==========================================
export const mockHealth: NetworkHealth = {
  score: 87.4,
  status: "normal",
  availability: 99.82,
  avgLatency: 32,
  packetLoss: 0.8,
  avgJitter: 7,
  previousScore: 84.2,
};
