<script setup lang="ts">
import { useIncidentStore } from "~/stores/incidents";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Inisialisasi dayjs di dalam script setup
dayjs.extend(relativeTime);

const store = useIncidentStore();
const { incidents, loading } = storeToRefs(store);

onMounted(() => {
  store.fetchAll();
});
</script>

<template>
  <div>
    <PageHeader
      title="Incident Management"
      description="Daftar dan riwayat insiden jaringan."
    />

    <div class="card overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="p-5 space-y-3">
        <SkeletonCard v-for="i in 5" :key="i" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="incidents.length === 0"
        class="p-10 text-center text-text-secondary"
      >
        <p>Tidak ada insiden yang ditemukan.</p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm min-w-[800px]">
          <thead class="border-b border-border bg-sidebar/50">
            <tr class="text-xs text-text-secondary uppercase tracking-wider">
              <th class="text-left py-3 px-4 font-medium">Incident ID</th>
              <th class="text-left py-3 px-4 font-medium">Site</th>
              <th class="text-left py-3 px-4 font-medium">Type</th>
              <th class="text-left py-3 px-4 font-medium">Severity</th>
              <th class="text-left py-3 px-4 font-medium">Started</th>
              <th class="text-left py-3 px-4 font-medium">Duration</th>
              <th class="text-left py-3 px-4 font-medium">Status</th>
              <th class="text-left py-3 px-4 font-medium">Root Cause</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="inc in incidents"
              :key="inc.id"
              class="border-b border-border/40 hover:bg-card-hover cursor-pointer transition-colors"
              @click="$router.push(`/incidents/${inc.id}`)"
            >
              <td class="py-3 px-4 font-mono text-xs text-info">
                {{ inc.id }}
              </td>
              <td class="py-3 px-4 font-mono text-xs">{{ inc.site }}</td>
              <td class="py-3 px-4">{{ inc.type }}</td>
              <td class="py-3 px-4">
                <StatusBadge
                  :status="
                    inc.severity === 'critical'
                      ? 'critical'
                      : inc.severity === 'major'
                        ? 'warning'
                        : 'info'
                  "
                />
              </td>
              <td class="py-3 px-4 text-xs text-text-secondary">
                {{ dayjs(inc.started).format("MMM D, HH:mm") }}
              </td>
              <td class="py-3 px-4 text-xs">{{ inc.duration }}</td>
              <td class="py-3 px-4">
                <StatusBadge :status="inc.status" />
              </td>
              <td class="py-3 px-4 text-xs text-text-secondary">
                {{ inc.rootCause }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
