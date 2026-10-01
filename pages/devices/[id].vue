<script setup lang="ts">
import { AlertTriangle, BrainCircuit, ArrowLeft } from "lucide-vue-next";
import { useDeviceStore } from "~/stores/devices";
import { storeToRefs } from "pinia";

const route = useRoute();
const store = useDeviceStore();
const { current, loading } = storeToRefs(store);
onMounted(() => store.fetchOne(route.params.id as string));

const explanation = [
  { text: "Latency increased 240% in the last hour.", severity: "warning" },
  { text: "Packet loss exceeded normal baseline.", severity: "warning" },
  { text: "CPU utilization reached 91%.", severity: "warning" },
  { text: "Traffic increased 47%.", severity: "warning" },
  {
    text: "Similar patterns preceded 3 previous incidents.",
    severity: "success",
  },
];
</script>

<template>
  <div>
    <NuxtLink
      to="/devices"
      class="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary mb-3"
    >
      <ArrowLeft :size="14" /> Back to Devices
    </NuxtLink>

    <ErrorState
      v-if="!loading && !current"
      @retry="store.fetchOne(route.params.id as string)"
    />
    <template v-else-if="current">
      <PageHeader
        :title="current.id"
        :description="`${current.type} • ${current.region}`"
      >
        <template #actions>
          <StatusBadge
            :status="current.risk"
            :pulse="current.risk === 'critical'"
          />
        </template>
      </PageHeader>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <!-- Risk hero -->
        <div class="card p-5 lg:col-span-2">
          <div class="grid grid-cols-2 gap-6">
            <div>
              <div
                class="text-xs text-text-secondary uppercase tracking-widest mb-1"
              >
                Failure Probability
              </div>
              <div class="text-5xl font-extrabold text-critical">
                {{ Math.round(current.riskScore)
                }}<span class="text-2xl">%</span>
              </div>
            </div>
            <div>
              <div
                class="text-xs text-text-secondary uppercase tracking-widest mb-1"
              >
                Predicted Incident
              </div>
              <div class="text-2xl font-bold">Within 1 hour</div>
            </div>
          </div>
          <div
            class="mt-4 text-xs text-warning border border-warning/30 bg-warning/5 rounded-lg px-3 py-2"
          >
            ⚠ DEMO PREDICTION • Confidence 91.4%
          </div>
        </div>

        <!-- AI Explanation -->
        <div class="card p-5">
          <div class="flex items-center gap-2 mb-3">
            <BrainCircuit :size="16" class="text-info" />
            <span class="text-sm font-semibold"
              >Why is this site high risk?</span
            >
          </div>
          <ul class="space-y-2 text-xs">
            <li v-for="(e, i) in explanation" :key="i" class="flex gap-2">
              <span
                :class="
                  e.severity === 'success' ? 'text-success' : 'text-warning'
                "
              >
                {{ e.severity === "success" ? "✓" : "⚠" }}
              </span>
              <span class="text-text-secondary">{{ e.text }}</span>
            </li>
          </ul>
          <div
            class="mt-4 pt-3 border-t border-border text-[10px] text-text-secondary"
          >
            Model confidence:
            <span class="text-text-primary font-semibold">91.4%</span>
          </div>
        </div>
      </div>

      <!-- Metrics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div
          v-for="m in [
            {
              label: 'Latency',
              value: `${current.latency} ms`,
              warn: current.latency > 100,
            },
            {
              label: 'Packet Loss',
              value: `${current.packetLoss.toFixed(1)}%`,
              warn: current.packetLoss > 3,
            },
            { label: 'Jitter', value: '39 ms', warn: false },
            { label: 'Traffic', value: `${current.traffic} Mbps`, warn: false },
            { label: 'CPU', value: `${current.cpu}%`, warn: current.cpu > 70 },
            {
              label: 'Memory',
              value: `${current.memory}%`,
              warn: current.memory > 70,
            },
            { label: 'Availability', value: '98.1%', warn: false },
            {
              label: 'Health',
              value: `${Math.round(current.health)}/100`,
              warn: current.health < 60,
            },
          ]"
          :key="m.label"
          class="card p-4"
        >
          <div class="text-xs text-text-secondary mb-1">{{ m.label }}</div>
          <div class="text-xl font-bold" :class="{ 'text-warning': m.warn }">
            {{ m.value }}
          </div>
        </div>
      </div>
    </template>
    <div v-else class="p-8 text-center text-text-secondary">Loading...</div>
  </div>
</template>
