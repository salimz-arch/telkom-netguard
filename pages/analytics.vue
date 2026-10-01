<script setup lang="ts">
import { useNetworkStore } from "~/stores/network";
import { storeToRefs } from "pinia";
const network = useNetworkStore();
const { metrics } = storeToRefs(network);
onMounted(() => {
  if (!metrics.value.length) network.fetchAll();
});
</script>

<template>
  <div>
    <PageHeader
      title="Analytics"
      description="Analitik performa jaringan dan insiden."
    />

    <div class="card p-5 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm font-semibold">Machine Learning Performance</div>
        <span
          class="text-[10px] px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20"
          >DEMO MODEL METRICS</span
        >
      </div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div
          v-for="m in [
            { l: 'Accuracy', v: '92.4%' },
            { l: 'Precision', v: '89.7%' },
            { l: 'Recall', v: '87.9%' },
            { l: 'F1 Score', v: '88.8%' },
            { l: 'ROC-AUC', v: '94.1%' },
          ]"
          :key="m.l"
          class="card p-4 bg-sidebar"
        >
          <div class="text-xs text-text-secondary">{{ m.l }}</div>
          <div class="text-xl font-bold mt-1 text-info">{{ m.v }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card p-5">
        <div class="text-sm font-semibold mb-3">Traffic Trend</div>
        <NetworkChart
          v-if="metrics.length"
          :data="metrics"
          active-metric="traffic"
        />
      </div>
      <div class="card p-5">
        <div class="text-sm font-semibold mb-3">Latency Trend</div>
        <NetworkChart
          v-if="metrics.length"
          :data="metrics"
          active-metric="latency"
        />
      </div>
      <div class="card p-5">
        <div class="text-sm font-semibold mb-3">Packet Loss Trend</div>
        <NetworkChart
          v-if="metrics.length"
          :data="metrics"
          active-metric="packetLoss"
        />
      </div>
      <div class="card p-5">
        <div class="text-sm font-semibold mb-3">CPU Utilization</div>
        <NetworkChart
          v-if="metrics.length"
          :data="metrics"
          active-metric="cpu"
        />
      </div>
    </div>
  </div>
</template>
