<script setup lang="ts">
import VChart from "vue-echarts";

const props = withDefaults(defineProps<{ value: number; max?: number }>(), {
  max: 100,
});

// Warna dinamis berdasarkan health score
const progressColor = computed(() => {
  if (props.value >= 80) return "#22C55E"; // success (healthy)
  if (props.value >= 60) return "#F59E0B"; // warning (degraded)
  return "#EF4444"; // critical
});

const option = computed(() => ({
  series: [
    {
      type: "gauge",
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: props.max,
      progress: {
        show: true,
        width: 12,
        roundCap: true,
        itemStyle: { color: progressColor.value },
      },
      axisLine: {
        lineStyle: {
          width: 12,
          color: [[1, "#1D3047"]],
        },
      },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 28,
        fontWeight: 700,
        color: "#F8FAFC",
        offsetCenter: [0, "20%"],
        formatter: "{value}",
      },
      data: [{ value: props.value }],
      silent: true,
    },
  ],
}));
</script>

<template>
  <!-- 🔥 ClientOnly untuk mencegah error SSR "document is not defined" -->
  <ClientOnly>
    <VChart
      :option="option"
      autoresize
      style="height: 140px; width: 100%"
      aria-label="Network health gauge"
    />

    <!-- Fallback saat JS belum siap di browser -->
    <template #fallback>
      <div
        class="h-[140px] w-full flex flex-col items-center justify-center gap-2"
      >
        <div
          class="w-20 h-20 rounded-full border-4 border-border border-t-transparent animate-spin"
        />
        <span class="text-xs text-text-secondary">Loading gauge...</span>
      </div>
    </template>
  </ClientOnly>
</template>
