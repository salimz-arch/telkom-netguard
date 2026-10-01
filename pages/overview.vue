<script setup lang="ts">
import {
  Cpu,
  AlertTriangle,
  BrainCircuit,
  ShieldAlert,
  Activity,
} from "lucide-vue-next";
import { useNetworkStore } from "~/stores/network";
import { useAnomalyStore } from "~/stores/anomalies";
import { usePredictionStore } from "~/stores/predictions";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// ✅ FIX 1: Inisialisasi dayjs di dalam script setup (Nuxt 3 best practice)
dayjs.extend(relativeTime);

const network = useNetworkStore();
const anomalyStore = useAnomalyStore();
const predictionStore = usePredictionStore();

const { health, metrics, kpi, loading, error, dataSource } =
  storeToRefs(network);
const { anomalies } = storeToRefs(anomalyStore);
const { predictions } = storeToRefs(predictionStore);

const activeMetric = ref<
  "traffic" | "latency" | "packetLoss" | "jitter" | "cpu" | "memory"
>("traffic");

const metricTabs = [
  { key: "traffic", label: "Traffic" },
  { key: "latency", label: "Latency" },
  { key: "packetLoss", label: "Packet Loss" },
  { key: "jitter", label: "Jitter" },
  { key: "cpu", label: "CPU" },
  { key: "memory", label: "Memory" },
];

onMounted(async () => {
  await Promise.all([
    network.fetchAll(),
    anomalyStore.fetchAll(),
    predictionStore.fetchAll(),
  ]);
});

const topRisk = computed(() => predictions.value.slice(0, 4));
const recentAnomalies = computed(() => anomalies.value.slice(0, 4));

// ✅ FIX 2: Helper function untuk format waktu yang aman di template
const formatTime = (iso: string) => dayjs(iso).format("HH:mm");
const fromNow = (iso: string) => dayjs(iso).fromNow();
</script>

<template>
  <div>
    <PageHeader
      title="Network Overview"
      description="Monitor kesehatan jaringan, anomali, dan prediksi gangguan secara real-time."
    />

    <!-- Error / Loading -->
    <ErrorState v-if="error" @retry="network.fetchAll()" />
    <template v-else>
      <!-- HERO -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div class="card p-5 lg:col-span-2">
          <div class="flex items-center justify-between mb-2">
            <div
              class="text-xs font-semibold tracking-widest text-text-secondary uppercase"
            >
              Network Health
            </div>
            <StatusBadge
              :status="health?.status || 'normal'"
              :label="
                health
                  ? health.score > 80
                    ? 'Healthy'
                    : health.score > 60
                      ? 'Warning'
                      : 'Critical'
                  : 'Loading'
              "
            />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <div class="text-5xl font-extrabold tracking-tight">
                {{ health?.score ?? "—" }}
                <span class="text-2xl text-text-secondary font-medium">
                  / 100</span
                >
              </div>
              <div v-if="health" class="mt-2 text-sm text-success font-medium">
                +{{ (health.score - health.previousScore).toFixed(1) }}% vs
                previous period
              </div>
            </div>
            <HealthGauge v-if="health" :value="health.score" />
          </div>
          <div
            v-if="health"
            class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border"
          >
            <div>
              <div class="text-xs text-text-secondary mb-1">Availability</div>
              <div class="text-lg font-bold">{{ health.availability }}%</div>
            </div>
            <div>
              <div class="text-xs text-text-secondary mb-1">
                Average Latency
              </div>
              <div class="text-lg font-bold">{{ health.avgLatency }} ms</div>
            </div>
            <div>
              <div class="text-xs text-text-secondary mb-1">Packet Loss</div>
              <div class="text-lg font-bold">{{ health.packetLoss }}%</div>
            </div>
            <div>
              <div class="text-xs text-text-secondary mb-1">Average Jitter</div>
              <div class="text-lg font-bold">{{ health.avgJitter }} ms</div>
            </div>
          </div>
        </div>

        <!-- AI Insight side panel -->
        <div class="card p-5">
          <div class="flex items-center gap-2 mb-3">
            <BrainCircuit :size="16" class="text-info" />
            <span class="text-sm font-semibold">AI Network Insights</span>
          </div>
          <div class="space-y-3 text-sm">
            <div class="flex gap-2">
              <span class="text-warning shrink-0">⚠</span>
              <span class="text-text-secondary">
                <b class="text-text-primary">3 sites</b> menunjukkan pola yang
                mirip dengan incident dalam 7 hari terakhir.
              </span>
            </div>
            <div class="flex gap-2">
              <span class="text-info shrink-0">↑</span>
              <span class="text-text-secondary">
                Latency rata-rata meningkat
                <b class="text-text-primary">18%</b> dibanding periode
                sebelumnya.
              </span>
            </div>
            <div class="flex gap-2">
              <span class="text-success shrink-0">●</span>
              <span class="text-text-secondary">
                Traffic normal pada <b class="text-text-primary">94% site</b>.
              </span>
            </div>
            <div class="flex gap-2">
              <span class="text-critical shrink-0">!</span>
              <span class="text-text-secondary">
                <b class="text-text-primary">BNA-001</b> memiliki probability
                gangguan <b class="text-critical">91%</b>.
              </span>
            </div>
          </div>
          <div
            class="mt-4 pt-3 border-t border-border text-[10px] text-text-secondary"
          >
            DEMO PREDICTION • Model: XGBoost v2.1
          </div>
        </div>
      </div>

      <!-- KPI -->
      <div
        v-if="loading && !health"
        class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4"
      >
        <SkeletonCard v-for="i in 4" :key="i" />
      </div>
      <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <!-- ✅ FIX 3: Kirim raw number, biarkan MetricCard yang format (Sudah benar di kode kamu!) -->
        <MetricCard
          :icon="Cpu"
          title="Total Devices"
          :value="kpi.totalDevices"
          trend="+12 this month"
          context="Across all regions"
          color="info"
        />
        <MetricCard
          :icon="AlertTriangle"
          title="Active Anomalies"
          :value="kpi.activeAnomalies"
          :trend="`+${kpi.anomaliesDelta} from yesterday`"
          context="Requires investigation"
          color="warning"
        />
        <MetricCard
          :icon="BrainCircuit"
          title="Predicted Incidents"
          :value="kpi.predictedIncidents"
          :trend="kpi.predictionWindow"
          context="Based on ML model"
          color="primary"
        />
        <MetricCard
          :icon="ShieldAlert"
          title="Critical Sites"
          :value="kpi.criticalSites"
          trend="Requires attention"
          context="Immediate action needed"
          color="critical"
        />
      </div>

      <!-- Performance Chart -->
      <div class="card p-5 mb-4">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-2">
            <Activity :size="16" class="text-info" />
            <span class="text-base font-semibold">Network Performance</span>

            <!-- ✅ FIX 4: Tambahkan badge LIVE jika data berasal dari RIPE Atlas -->
            <span
              v-if="dataSource === 'real'"
              class="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20 font-medium inline-flex items-center gap-1"
            >
              <span class="w-1 h-1 rounded-full bg-success animate-pulse" />
              LIVE • RIPE Atlas
            </span>
          </div>
          <div
            class="flex flex-wrap gap-1 p-1 rounded-lg bg-sidebar border border-border"
          >
            <button
              v-for="tab in metricTabs"
              :key="tab.key"
              class="px-3 py-1 rounded-md text-xs font-medium transition-colors"
              :class="
                activeMetric === tab.key
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              "
              @click="activeMetric = tab.key as any"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
        <NetworkChart
          v-if="metrics.length"
          :data="metrics"
          :active-metric="activeMetric"
        />
        <SkeletonCard v-else />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- High Risk Sites -->
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <span class="text-base font-semibold">High Risk Sites</span>
            <NuxtLink
              to="/predictions"
              class="text-xs text-info hover:underline"
              >View all →</NuxtLink
            >
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-text-secondary border-b border-border">
                  <th class="text-left py-2 font-medium">Site</th>
                  <th class="text-left font-medium">Risk</th>
                  <th class="text-left font-medium">Probability</th>
                  <th class="text-right font-medium">ETA</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in topRisk"
                  :key="p.site"
                  class="border-b border-border/50 hover:bg-card-hover cursor-pointer transition-colors"
                  @click="$router.push(`/devices/${p.site}`)"
                >
                  <td class="py-2.5 font-mono text-xs">{{ p.site }}</td>
                  <td>
                    <StatusBadge
                      :status="p.severity"
                      :pulse="p.severity === 'critical'"
                    />
                  </td>
                  <td
                    class="font-semibold"
                    :class="{
                      'text-critical': p.probability > 0.8,
                      'text-warning':
                        p.probability > 0.5 && p.probability <= 0.8,
                    }"
                  >
                    {{ Math.round(p.probability * 100) }}%
                  </td>
                  <td class="text-right text-text-secondary text-xs">
                    {{ p.predictionWindow }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Anomalies -->
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <span class="text-base font-semibold">Recent Anomalies</span>
            <NuxtLink to="/anomalies" class="text-xs text-info hover:underline"
              >View all →</NuxtLink
            >
          </div>
          <EmptyState
            v-if="!recentAnomalies.length"
            title="No anomalies detected"
            message="All monitored devices are operating within expected parameters."
          />
          <div v-else class="space-y-1">
            <NuxtLink
              v-for="a in recentAnomalies"
              :key="a.id"
              to="/anomalies"
              class="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-card-hover transition-colors"
            >
              <span class="font-mono text-xs text-text-secondary w-12 shrink-0">
                {{ formatTime(a.time) }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-sm truncate">{{ a.metric }} spike</div>
                <div class="text-xs text-text-secondary">{{ a.site }}</div>
              </div>
              <StatusBadge :status="a.severity" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
