<script setup lang="ts">
import VChart from "vue-echarts";
import type { MetricPoint } from "~/types/network";
import dayjs from "dayjs";

const props = defineProps<{
  data: MetricPoint[];
  activeMetric: keyof MetricPoint;
}>();

const option = computed(() => {
  const times = props.data.map((d) => dayjs(d.timestamp).format("HH:mm"));
  const series = props.data.map((d) => d[props.activeMetric] as number);

  return {
    grid: { left: 8, right: 16, top: 24, bottom: 40, containLabel: true },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0E1B2E",
      borderColor: "#1D3047",
      textStyle: { color: "#F8FAFC", fontSize: 12 },
      axisPointer: {
        type: "line",
        lineStyle: { color: "#38BDF8", type: "dashed" },
      },
    },
    xAxis: {
      type: "category",
      data: times,
      boundaryGap: false,
      axisLine: { lineStyle: { color: "#1D3047" } },
      axisLabel: { color: "#94A3B8", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#1D3047", type: "dashed" } },
      axisLabel: { color: "#94A3B8", fontSize: 11 },
    },
    dataZoom: [{ type: "inside" }],
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "none",
        data: series,
        lineStyle: { width: 2, color: "#38BDF8" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(56,189,248,0.35)" },
              { offset: 1, color: "rgba(56,189,248,0.02)" },
            ],
          },
        },
      },
    ],
  };
});
</script>

<template>
  <!-- 🔥 WAJIB: ClientOnly mencegah ECharts dieksekusi di server (SSR) -->
  <ClientOnly>
    <VChart :option="option" autoresize style="height: 320px" />

    <!-- 🔥 Fallback: Tampilan loading premium saat chart belum ter-render di client -->
    <template #fallback>
      <div
        class="h-[320px] w-full flex items-center justify-center rounded-xl bg-card border border-border animate-pulse"
      >
        <div class="flex flex-col items-center gap-3">
          <div
            class="w-8 h-8 rounded-full border-2 border-t-info border-r-transparent border-b-transparent border-l-transparent animate-spin"
          />
          <span class="text-xs font-medium text-text-secondary"
            >Loading chart data...</span
          >
        </div>
      </div>
    </template>
  </ClientOnly>
</template>
