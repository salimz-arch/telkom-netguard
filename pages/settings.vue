<script setup lang="ts">
import { Database, Radio } from "lucide-vue-next";

const config = useRuntimeConfig();
const interval = useLocalStorage("poll-interval", 30000);

// Deteksi mode hybrid secara dinamis
const isHybrid = computed(() => !config.public.useMock);

const intervals = [
  { l: "10 seconds", v: 10000 },
  { l: "30 seconds", v: 30000 },
  { l: "1 minute", v: 60000 },
  { l: "5 minutes", v: 300000 },
];

// Data sources yang ditampilkan secara dinamis
const dataSources = computed(() => [
  {
    name: "RIPE Atlas",
    icon: Radio,
    status: isHybrid.value ? "active" : "inactive",
    desc: "Real network measurements dari 10.000+ probes global",
    metrics: ["Latency", "Packet Loss", "Jitter"],
    type: "real",
  },
  {
    name: "Mock Generator",
    icon: Database,
    status: "active",
    desc: "Dummy data untuk devices, predictions, incidents",
    metrics: ["Devices", "Predictions", "Incidents"],
    type: "mock",
  },
]);
</script>

<template>
  <div>
    <PageHeader
      title="Settings"
      description="Konfigurasi aplikasi dan data source."
    />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Real-time Data Settings -->
      <div class="card p-5">
        <div class="text-sm font-semibold mb-4">Real-time Data</div>
        <label class="text-xs text-text-secondary mb-2 block"
          >Refresh Interval</label
        >
        <select v-model.number="interval" class="input">
          <option v-for="i in intervals" :key="i.v" :value="i.v">
            {{ i.l }}
          </option>
        </select>
        <p class="text-xs text-text-secondary mt-3">
          Polling berhenti otomatis saat tab tidak aktif.
        </p>
      </div>

      <!-- Data Source Status (Dynamic) -->
      <div class="card p-5">
        <div class="text-sm font-semibold mb-4">Data Source Status</div>
        <div class="flex items-center gap-2 text-sm mb-3">
          <span
            class="w-2 h-2 rounded-full"
            :class="isHybrid ? 'bg-success animate-pulse' : 'bg-warning'"
          />
          <span>
            {{
              isHybrid
                ? "HYBRID LIVE (RIPE Atlas + Mock Devices)"
                : "DEMO DATA (Mock Provider)"
            }}
          </span>
        </div>
        <p class="text-xs text-text-secondary">
          <span v-if="isHybrid">
            Metrics: Real dari RIPE Atlas. Devices & Predictions: Mock
            generator.
          </span>
          <span v-else>
            Semua data menggunakan mock generator untuk demo purposes.
          </span>
        </p>
      </div>

      <!-- Data Sources Detail Cards -->
      <div class="card p-5 lg:col-span-2">
        <div class="flex items-center gap-2 mb-4">
          <Database :size="16" class="text-info" />
          <span class="text-sm font-semibold">Active Data Sources</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="ds in dataSources"
            :key="ds.name"
            class="card p-4 bg-sidebar"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <component
                  :is="ds.icon"
                  :size="16"
                  :class="ds.type === 'real' ? 'text-success' : 'text-warning'"
                />
                <span class="font-semibold text-sm">{{ ds.name }}</span>
              </div>
              <span
                class="text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide"
                :class="
                  ds.status === 'active'
                    ? 'bg-success/10 text-success border-success/30'
                    : 'bg-text-secondary/10 text-text-secondary border-border'
                "
              >
                {{ ds.status }}
              </span>
            </div>
            <p class="text-xs text-text-secondary mb-3">
              {{ ds.desc }}
            </p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="m in ds.metrics"
                :key="m"
                class="text-[10px] px-1.5 py-0.5 rounded bg-card border border-border text-text-secondary"
              >
                {{ m }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
