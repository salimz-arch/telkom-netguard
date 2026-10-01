<script setup lang="ts">
import { FileText, Download } from "lucide-vue-next";
import { useDeviceStore } from "~/stores/devices";
import { useAnomalyStore } from "~/stores/anomalies";
import { useIncidentStore } from "~/stores/incidents";
import { storeToRefs } from "pinia";

const deviceStore = useDeviceStore();
const anomalyStore = useAnomalyStore();
const incidentStore = useIncidentStore();
onMounted(() => {
  deviceStore.fetchAll();
  anomalyStore.fetchAll();
  incidentStore.fetchAll();
});

const reports = computed(() => [
  {
    name: "Network Health Report",
    desc: "Ringkasan kondisi kesehatan jaringan.",
    exportFn: () => exportCsv(deviceStore.devices, "network-health"),
  },
  {
    name: "Incident Report",
    desc: "Daftar dan riwayat insiden.",
    exportFn: () => exportCsv(incidentStore.incidents, "incidents"),
  },
  {
    name: "Anomaly Report",
    desc: "Daftar anomali yang terdeteksi.",
    exportFn: () => exportCsv(anomalyStore.anomalies, "anomalies"),
  },
  {
    name: "Prediction Report",
    desc: "Hasil prediksi AI.",
    exportFn: () => exportCsv(deviceStore.devices, "predictions"),
  },
]);

function exportCsv(data: any[], name: string) {
  if (!data?.length) return alert("No data to export");
  const headers = Object.keys(data[0]).filter(
    (k) => k !== "location" && k !== "timeline" && k !== "factors",
  );
  const rows = [headers.join(",")];
  data.forEach((row) =>
    rows.push(
      headers
        .map((h) => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`)
        .join(","),
    ),
  );
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div>
    <PageHeader
      title="Reports"
      description="Unduh laporan monitoring, insiden, dan prediksi."
    />
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="r in reports" :key="r.name" class="card p-5">
        <div class="flex items-start gap-3 mb-4">
          <div
            class="w-10 h-10 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0"
          >
            <FileText :size="20" />
          </div>
          <div class="min-w-0">
            <div class="font-semibold">{{ r.name }}</div>
            <div class="text-xs text-text-secondary mt-0.5">{{ r.desc }}</div>
          </div>
        </div>
        <button class="btn btn-outline w-full" @click="r.exportFn">
          <Download :size="14" /> Export CSV
        </button>
      </div>
    </div>
  </div>
</template>
