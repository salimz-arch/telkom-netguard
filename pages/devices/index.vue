<script setup lang="ts">
import { Search, Filter } from "lucide-vue-next";
import { useDeviceStore } from "~/stores/devices";
import { storeToRefs } from "pinia";

const store = useDeviceStore();
const { devices, loading } = storeToRefs(store);

const search = ref("");
const debouncedSearch = refDebounced(search, 300);
const statusFilter = ref<string>("all");
const riskFilter = ref<string>("all");
const page = ref(1);
const perPage = 15;
const sortKey = ref<keyof (typeof devices.value)[0]>("riskScore");
const sortDir = ref<"asc" | "desc">("desc");

onMounted(() => store.fetchAll());

const filtered = computed(() => {
  let list = [...devices.value];
  const q = debouncedSearch.value.toLowerCase();
  if (q)
    list = list.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.site.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q),
    );
  if (statusFilter.value !== "all")
    list = list.filter((d) => d.status === statusFilter.value);
  if (riskFilter.value !== "all")
    list = list.filter((d) => d.risk === riskFilter.value);
  list.sort((a, b) => {
    const av = a[sortKey.value],
      bv = b[sortKey.value];
    if (av < bv) return sortDir.value === "asc" ? -1 : 1;
    if (av > bv) return sortDir.value === "asc" ? 1 : -1;
    return 0;
  });
  return list;
});

const paginated = computed(() =>
  filtered.value.slice((page.value - 1) * perPage, page.value * perPage),
);
const totalPages = computed(() => Math.ceil(filtered.value.length / perPage));

function toggleSort(key: any) {
  if (sortKey.value === key)
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  else {
    sortKey.value = key;
    sortDir.value = "desc";
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Devices"
      description="Daftar seluruh perangkat jaringan yang dimonitor."
    />

    <!-- Filter bar -->
    <div class="card p-3 mb-4 flex flex-col md:flex-row gap-2">
      <div class="relative flex-1">
        <Search
          :size="14"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          v-model="search"
          class="input pl-9"
          placeholder="Search device, site, region..."
        />
      </div>
      <select v-model="statusFilter" class="input md:w-40">
        <option value="all">All Status</option>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
        <option value="maintenance">Maintenance</option>
      </select>
      <select v-model="riskFilter" class="input md:w-40">
        <option value="all">All Risk</option>
        <option value="normal">Normal</option>
        <option value="warning">Warning</option>
        <option value="critical">Critical</option>
      </select>
    </div>

    <div class="card overflow-hidden">
      <div v-if="loading" class="p-5 space-y-3">
        <SkeletonCard v-for="i in 5" :key="i" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm min-w-[900px]">
          <thead class="sticky top-0 bg-card border-b border-border">
            <tr class="text-xs text-text-secondary">
              <th
                v-for="h in [
                  { k: 'id', l: 'Device' },
                  { k: 'region', l: 'Region' },
                  { k: 'type', l: 'Type' },
                  { k: 'status', l: 'Status' },
                  { k: 'cpu', l: 'CPU' },
                  { k: 'memory', l: 'Memory' },
                  { k: 'traffic', l: 'Traffic' },
                  { k: 'latency', l: 'Latency' },
                  { k: 'packetLoss', l: 'Loss' },
                  { k: 'riskScore', l: 'Risk' },
                ]"
                :key="h.k"
                class="text-left py-3 px-3 font-medium cursor-pointer hover:text-text-primary whitespace-nowrap"
                @click="toggleSort(h.k)"
              >
                {{ h.l }}
                <span v-if="sortKey === h.k">{{
                  sortDir === "asc" ? "↑" : "↓"
                }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="d in paginated"
              :key="d.id"
              class="border-b border-border/40 hover:bg-card-hover cursor-pointer transition-colors"
              @click="$router.push(`/devices/${d.id}`)"
            >
              <td class="py-3 px-3 font-mono text-xs font-semibold">
                {{ d.id }}
              </td>
              <td class="px-3 text-text-secondary">{{ d.region }}</td>
              <td class="px-3 text-text-secondary capitalize">{{ d.type }}</td>
              <td class="px-3">
                <StatusBadge
                  :status="d.status === 'online' ? 'success' : 'critical'"
                  :label="d.status"
                />
              </td>
              <td
                class="px-3"
                :class="{
                  'text-warning': d.cpu > 70,
                  'text-critical': d.cpu > 85,
                }"
              >
                {{ d.cpu }}%
              </td>
              <td class="px-3" :class="{ 'text-warning': d.memory > 70 }">
                {{ d.memory }}%
              </td>
              <td class="px-3">{{ d.traffic }} Mbps</td>
              <td class="px-3" :class="{ 'text-critical': d.latency > 100 }">
                {{ d.latency }} ms
              </td>
              <td class="px-3" :class="{ 'text-critical': d.packetLoss > 3 }">
                {{ d.packetLoss.toFixed(1) }}%
              </td>
              <td class="px-3">
                <StatusBadge :status="d.risk" :pulse="d.risk === 'critical'" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="!loading"
        class="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-text-secondary"
      >
        <div>
          Showing {{ paginated.length }} of {{ filtered.length }} devices
        </div>
        <div class="flex items-center gap-1">
          <button class="btn btn-ghost" :disabled="page === 1" @click="page--">
            Previous
          </button>
          <span>Page {{ page }} / {{ totalPages }}</span>
          <button
            class="btn btn-ghost"
            :disabled="page === totalPages"
            @click="page++"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
