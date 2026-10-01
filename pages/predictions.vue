<script setup lang="ts">
import { onMounted, computed } from "vue";
import { usePredictionStore } from "~/stores/predictions";
import { storeToRefs } from "pinia";
import type { Prediction } from "~/types/prediction";

const store = usePredictionStore();
const { predictions, loading } = storeToRefs(store);

onMounted(() => {
  store.fetchAll();
});

const distribution = computed(() => {
  const total = 1248;
  return { normal: 1112, warning: 131, critical: 5, total };
});

// Helper sederhana untuk format waktu (bisa diganti dayjs nanti)
const timeAgo = (dateString: string) => {
  const diff = Math.floor(
    (new Date().getTime() - new Date(dateString).getTime()) / 60000,
  );
  return diff < 1 ? "Just now" : `${diff} min ago`;
};
</script>

<template>
  <div class="animate-fade-in">
    <PageHeader
      title="AI Failure Predictions"
      description="Prediksi potensi gangguan jaringan menggunakan machine learning."
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
      <!-- Predictions Table -->
      <div class="card p-5 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm font-semibold text-text-primary">
            Active Predictions
          </div>
          <span
            class="text-[10px] px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20"
          >
            DEMO PREDICTION
          </span>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="space-y-3">
          <SkeletonCard v-for="i in 3" :key="i" />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="predictions.length === 0"
          class="py-8 text-center text-text-secondary"
        >
          No active predictions at this time.
        </div>

        <!-- Data Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm min-w-[700px]">
            <thead class="border-b border-border">
              <tr class="text-xs text-text-secondary uppercase tracking-wider">
                <th class="text-left py-3 px-2 font-medium">Site</th>
                <th class="text-left py-3 px-2 font-medium">Risk Score</th>
                <th class="text-left py-3 px-2 font-medium">Probability</th>
                <th class="text-left py-3 px-2 font-medium">Window</th>
                <th class="text-left py-3 px-2 font-medium">Top Factors</th>
                <th class="text-left py-3 px-2 font-medium">Model</th>
                <th class="text-left py-3 px-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in predictions"
                :key="p.site"
                class="border-b border-border/40 hover:bg-card-hover cursor-pointer transition-colors group"
                @click="$router.push(`/devices/${p.site}`)"
              >
                <td
                  class="py-3 px-2 font-mono text-xs font-semibold text-text-primary group-hover:text-info transition-colors"
                >
                  {{ p.site }}
                </td>

                <!-- Risk Score dengan Progress Bar Mini -->
                <td class="py-3 px-2">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-12 h-1.5 rounded-full bg-border overflow-hidden"
                    >
                      <div
                        class="h-full rounded-full transition-all"
                        :class="{
                          'bg-critical': p.riskScore > 80,
                          'bg-warning': p.riskScore > 50 && p.riskScore <= 80,
                          'bg-success': p.riskScore <= 50,
                        }"
                        :style="{ width: `${p.riskScore}%` }"
                      />
                    </div>
                    <span
                      class="font-bold text-xs"
                      :class="{
                        'text-critical': p.riskScore > 80,
                        'text-warning': p.riskScore > 50 && p.riskScore <= 80,
                        'text-success': p.riskScore <= 50,
                      }"
                    >
                      {{ p.riskScore }}
                    </span>
                  </div>
                </td>

                <td class="py-3 px-2 font-semibold text-text-primary">
                  {{ Math.round(p.probability * 100) }}%
                </td>

                <td class="py-3 px-2">
                  <!-- Menggunakan predictionWindow sebagai label badge -->
                  <StatusBadge
                    :status="p.severity"
                    :label="p.predictionWindow"
                  />
                </td>

                <td class="py-3 px-2">
                  <div class="flex flex-wrap gap-1">
                    <!-- FIX: Explicit cast untuk menghindari error TS implicit 'any' -->
                    <span
                      v-for="(f, idx) in (p as Prediction).factors.slice(0, 3)"
                      :key="idx"
                      class="text-[10px] px-1.5 py-0.5 rounded bg-sidebar text-text-secondary border border-border"
                    >
                      {{ f.metric }}
                    </span>
                  </div>
                </td>

                <td class="py-3 px-2 text-xs text-text-secondary font-mono">
                  {{ p.model }}
                </td>

                <td class="py-3 px-2 text-xs text-text-secondary">
                  {{ timeAgo(p.updated) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Risk Distribution Sidebar -->
      <div class="card p-5">
        <div class="text-sm font-semibold text-text-primary mb-4">
          Risk Distribution
        </div>
        <div class="space-y-5">
          <div
            v-for="(item, i) in [
              {
                l: 'Normal',
                v: distribution.normal,
                c: 'bg-success',
                tc: 'text-success',
              },
              {
                l: 'Warning',
                v: distribution.warning,
                c: 'bg-warning',
                tc: 'text-warning',
              },
              {
                l: 'Critical',
                v: distribution.critical,
                c: 'bg-critical',
                tc: 'text-critical',
              },
            ]"
            :key="i"
          >
            <div class="flex justify-between text-xs mb-1.5">
              <span class="text-text-secondary font-medium">{{ item.l }}</span>
              <span class="font-bold" :class="item.tc">{{
                item.v.toLocaleString()
              }}</span>
            </div>
            <div class="h-2 rounded-full bg-border overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500 ease-out"
                :class="item.c"
                :style="{ width: `${(item.v / distribution.total) * 100}%` }"
              />
            </div>
          </div>
        </div>

        <!-- Disclaimer -->
        <div class="mt-8 pt-4 border-t border-border">
          <div class="flex items-start gap-2">
            <span class="text-warning text-sm mt-0.5 shrink-0">⚠</span>
            <p class="text-[11px] text-text-secondary leading-relaxed">
              Prediksi ini dihasilkan oleh model Machine Learning berdasarkan
              pola anomali historis. Selalu verifikasi dengan data lapangan
              sebelum mengambil tindakan mitigasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
