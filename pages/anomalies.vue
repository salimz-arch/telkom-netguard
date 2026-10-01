<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import dayjs from "dayjs";
import { useAnomalyStore } from "~/stores/anomalies";
import type { Anomaly } from "~/types/anomaly";

const store = useAnomalyStore();
const { anomalies, loading } = storeToRefs(store);

const severity = ref("all");
const metric = ref("all");
const selected = ref<Anomaly | null>(null);
const drawerOpen = ref(false);

onMounted(() => {
  store.fetchAll();
});

// FIX: Menambahkan type annotation (a: Anomaly) untuk menghilangkan error implicit 'any'
const filtered = computed(() => {
  let list = anomalies.value;
  if (severity.value !== "all") {
    list = list.filter((a: Anomaly) => a.severity === severity.value);
  }
  if (metric.value !== "all") {
    list = list.filter((a: Anomaly) => a.metric === metric.value);
  }
  return list;
});

// FIX: Menambahkan type annotation (a: Anomaly) di sini juga
const counts = computed(() => ({
  total: anomalies.value.length,
  critical: anomalies.value.filter((a: Anomaly) => a.severity === "critical")
    .length,
  warning: anomalies.value.filter((a: Anomaly) => a.severity === "warning")
    .length,
  resolved: anomalies.value.filter((a: Anomaly) => a.status === "resolved")
    .length,
}));

function openDetail(a: Anomaly) {
  selected.value = a;
  drawerOpen.value = true;
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div>
      <h1 class="text-page-title text-text-primary">Anomaly Center</h1>
      <p class="text-sm text-text-muted mt-1">
        Deteksi kondisi jaringan yang menyimpang dari pola normal.
      </p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div
        v-for="(c, i) in [
          { l: 'Total Anomalies', v: counts.total, cl: 'text-info' },
          { l: 'Critical', v: counts.critical, cl: 'text-critical' },
          { l: 'Warning', v: counts.warning, cl: 'text-warning' },
          { l: 'Resolved', v: counts.resolved, cl: 'text-success' },
        ]"
        :key="i"
        class="card p-4"
      >
        <div class="text-xs text-text-secondary">{{ c.l }}</div>
        <div class="text-2xl font-bold mt-1" :class="c.cl">{{ c.v }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-3 flex flex-col md:flex-row gap-2">
      <select v-model="severity" class="input md:w-44">
        <option value="all">All Severity</option>
        <option value="critical">Critical</option>
        <option value="warning">Warning</option>
        <option value="normal">Normal</option>
      </select>
      <select v-model="metric" class="input md:w-44">
        <option value="all">All Metrics</option>
        <option value="Latency">Latency</option>
        <option value="Packet Loss">Packet Loss</option>
        <option value="CPU">CPU</option>
      </select>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <div
          v-for="i in 6"
          :key="i"
          class="h-12 bg-navy-700/50 rounded animate-pulse"
        />
      </div>

      <div v-else-if="!filtered.length" class="p-8 text-center">
        <p class="text-sm text-text-secondary">✓ No anomalies detected</p>
        <p class="text-xs text-text-muted mt-1">
          All monitored devices are operating within expected parameters.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm min-w-[800px]">
          <thead class="border-b border-border bg-navy-900/50">
            <tr class="text-xs text-text-muted uppercase tracking-wider">
              <th class="text-left py-3 px-4 font-medium">Time</th>
              <th class="text-left py-3 px-4 font-medium">Site</th>
              <th class="text-left py-3 px-4 font-medium">Metric</th>
              <th class="text-left py-3 px-4 font-medium">Expected</th>
              <th class="text-left py-3 px-4 font-medium">Actual</th>
              <th class="text-left py-3 px-4 font-medium">Deviation</th>
              <th class="text-left py-3 px-4 font-medium">Severity</th>
              <th class="text-left py-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/50">
            <tr
              v-for="a in filtered"
              :key="a.id"
              class="hover:bg-navy-700/30 cursor-pointer transition-colors"
              @click="openDetail(a)"
            >
              <td class="py-3 px-4 font-mono text-xs text-text-secondary">
                {{ dayjs(a.time).format("HH:mm") }}
              </td>
              <td class="px-4 font-mono text-xs text-text-primary">
                {{ a.site }}
              </td>
              <td class="px-4 text-text-secondary">{{ a.metric }}</td>
              <td class="px-4 text-text-muted text-xs">{{ a.expected }}</td>
              <td class="px-4 font-medium text-text-primary">{{ a.actual }}</td>
              <td class="px-4 text-warning font-medium">+{{ a.deviation }}</td>
              <td class="px-4">
                <StatusBadge
                  :status="a.severity"
                  :pulse="a.severity === 'critical'"
                />
              </td>
              <td class="px-4">
                <StatusBadge
                  :status="
                    a.status === 'resolved'
                      ? 'resolved'
                      : a.status === 'open'
                        ? 'open'
                        : 'investigating'
                  "
                  :label="a.status"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detail Drawer -->
    <DetailDrawer
      :open="drawerOpen"
      title="ANOMALY DETECTED"
      @close="drawerOpen = false"
    >
      <div v-if="selected" class="space-y-5">
        <div>
          <div class="font-mono text-lg font-bold text-text-primary">
            {{ selected.site }}
          </div>
          <div class="text-sm text-text-secondary mt-1">
            {{ selected.metric }} spike
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="bg-navy-800 rounded-lg p-3">
            <div class="text-xs text-text-muted mb-1">Detected</div>
            <div class="font-semibold text-text-primary">
              {{ dayjs(selected.time).format("HH:mm") }}
            </div>
          </div>
          <div class="bg-navy-800 rounded-lg p-3">
            <div class="text-xs text-text-muted mb-1">Severity</div>
            <StatusBadge :status="selected.severity" />
          </div>
          <div class="bg-navy-800 rounded-lg p-3">
            <div class="text-xs text-text-muted mb-1">Expected</div>
            <div class="text-text-primary">{{ selected.expected }}</div>
          </div>
          <div class="bg-navy-800 rounded-lg p-3">
            <div class="text-xs text-text-muted mb-1">Actual</div>
            <div class="font-semibold text-status-critical">
              {{ selected.actual }}
            </div>
          </div>
          <div class="bg-navy-800 rounded-lg p-3">
            <div class="text-xs text-text-muted mb-1">Deviation</div>
            <div class="font-semibold text-status-warning">
              +{{ selected.deviation }}
            </div>
          </div>
          <div class="bg-navy-800 rounded-lg p-3">
            <div class="text-xs text-text-muted mb-1">Anomaly Score</div>
            <div class="font-semibold text-text-primary">
              {{ selected.score }}
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-border">
          <div
            class="text-xs font-semibold text-text-muted mb-2 uppercase tracking-widest"
          >
            Baseline vs Actual
          </div>
          <div
            class="h-40 rounded-lg bg-navy-800 border border-border flex items-center justify-center text-xs text-text-muted"
          >
            [Chart: Baseline vs Actual — Implementasi NetworkChart dengan 2
            series akan muncul di sini]
          </div>
        </div>

        <NuxtLink
          :to="`/devices/${selected.site}`"
          class="btn-primary w-full text-center block"
        >
          View Site Details
        </NuxtLink>
      </div>
    </DetailDrawer>
  </div>
</template>
