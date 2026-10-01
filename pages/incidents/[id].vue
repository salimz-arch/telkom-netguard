<script setup lang="ts">
import { useIncidentStore } from "~/stores/incidents";
import { storeToRefs } from "pinia";

const route = useRoute();
const store = useIncidentStore();
const { incidents } = storeToRefs(store);
onMounted(() => {
  if (!incidents.value.length) store.fetchAll();
});

const incident = computed(() =>
  incidents.value.find((i) => i.id === route.params.id),
);
</script>

<template>
  <div v-if="incident">
    <PageHeader
      :title="`Incident #${incident.id}`"
      :description="incident.type"
    />
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="card p-5 lg:col-span-2">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div class="text-xs text-text-secondary">Site</div>
            <div class="font-mono font-semibold">{{ incident.site }}</div>
          </div>
          <div>
            <div class="text-xs text-text-secondary">Severity</div>
            <StatusBadge
              :status="
                incident.severity === 'critical' ? 'critical' : 'warning'
              "
              :label="incident.severity"
            />
          </div>
          <div>
            <div class="text-xs text-text-secondary">Started</div>
            <div>{{ dayjs(incident.started).format("HH:mm") }}</div>
          </div>
          <div>
            <div class="text-xs text-text-secondary">Duration</div>
            <div>{{ incident.duration }}</div>
          </div>
        </div>

        <div class="text-sm font-semibold mb-4">Incident Timeline</div>
        <div class="relative pl-6">
          <div class="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
          <div
            v-for="(e, i) in incident.timeline"
            :key="i"
            class="relative mb-5 last:mb-0"
          >
            <span
              class="absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-sidebar"
              :class="{
                'bg-critical': e.severity === 'critical',
                'bg-warning': e.severity === 'warning',
                'bg-success': e.severity === 'normal',
                'bg-info': !e.severity,
              }"
            />
            <div class="text-xs text-text-secondary font-mono">
              {{ e.time }}
            </div>
            <div class="text-sm">{{ e.event }}</div>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <div class="text-sm font-semibold mb-3">Details</div>
        <div class="space-y-3 text-sm">
          <div>
            <div class="text-xs text-text-secondary">Root Cause</div>
            <div>{{ incident.rootCause }}</div>
          </div>
          <div>
            <div class="text-xs text-text-secondary">Status</div>
            <StatusBadge :status="incident.status" :label="incident.status" />
          </div>
          <div v-if="incident.resolved">
            <div class="text-xs text-text-secondary">Resolved At</div>
            <div>{{ dayjs(incident.resolved).format("HH:mm") }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="p-8 text-center text-text-secondary">Loading...</div>
</template>

<script lang="ts">
import dayjs from "dayjs";
export default { name: "IncidentDetailPage" };
</script>
