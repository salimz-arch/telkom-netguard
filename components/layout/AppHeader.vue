<script setup lang="ts">
import { Search, RefreshCw, Bell, Menu, ChevronDown } from "lucide-vue-next";
import { useNetworkStore } from "~/stores/network";
import { useNotificationStore } from "~/stores/notifications";
import { useDataSource } from "~/composables/useDataSource"; // 🔥 IMPORT INI

defineEmits<{ "open-mobile": [] }>();

const network = useNetworkStore();
const notif = useNotificationStore();
const route = useRoute();
const range = ref("Last 24 Hours");
const notifOpen = ref(false);
const refreshing = computed(() => network.loading);

const breadcrumb = computed(() => {
  const parts = route.path.split("/").filter(Boolean);
  return [
    "Monitoring",
    ...parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)),
  ];
});

const ranges = [
  "Last 1 Hour",
  "Last 6 Hours",
  "Last 24 Hours",
  "Last 7 Days",
  "Last 30 Days",
  "Custom",
];

async function handleRefresh() {
  await network.fetchAll();
}

const lastUpdated = computed(() =>
  network.lastUpdated ? network.lastUpdated.toLocaleTimeString("en-GB") : "—",
);

// 🔥 GUNAKAN COMPOSABLE YANG SUDAH KITA PERBAIKI (Single Source of Truth)
const { globalBadge } = useDataSource();
</script>

<template>
  <header
    class="sticky top-0 z-30 bg-sidebar/95 backdrop-blur border-b border-border"
  >
    <div class="flex items-center gap-3 px-4 h-16">
      <button
        class="lg:hidden text-text-secondary"
        @click="$emit('open-mobile')"
      >
        <Menu :size="20" />
      </button>

      <!-- Breadcrumb -->
      <nav class="hidden md:flex items-center gap-2 text-sm">
        <template v-for="(part, i) in breadcrumb" :key="i">
          <span
            :class="
              i === breadcrumb.length - 1
                ? 'text-text-primary font-medium'
                : 'text-text-secondary'
            "
          >
            {{ part }}
          </span>
          <span v-if="i < breadcrumb.length - 1" class="text-text-secondary/50">
            /
          </span>
        </template>
      </nav>

      <div class="flex-1" />

      <!-- Search -->
      <button
        class="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm text-text-secondary hover:border-[#2A4260] transition-colors min-w-[220px]"
      >
        <Search :size="14" />
        <span class="flex-1 text-left">Search device, site, incident...</span>
        <kbd
          class="text-[10px] px-1.5 py-0.5 rounded bg-sidebar border border-border"
          >⌘K</kbd
        >
      </button>

      <!-- Time range -->
      <div
        class="hidden lg:flex items-center gap-1 px-3 py-2 rounded-lg bg-card border border-border text-sm"
      >
        <select
          v-model="range"
          class="bg-transparent text-text-primary text-sm focus:outline-none pr-2"
        >
          <option v-for="r in ranges" :key="r" :value="r" class="bg-sidebar">
            {{ r }}
          </option>
        </select>
      </div>

      <!-- Refresh -->
      <button class="btn btn-ghost" title="Refresh" @click="handleRefresh">
        <RefreshCw :size="16" :class="refreshing ? 'animate-spin' : ''" />
      </button>

      <!-- Notifications -->
      <div class="relative">
        <button class="btn btn-ghost relative" @click="notifOpen = !notifOpen">
          <Bell :size="16" />
          <span
            v-if="notif.unread"
            class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] text-white flex items-center justify-center font-bold"
          >
            {{ notif.unread }}
          </span>
        </button>
        <Transition name="fade">
          <div
            v-if="notifOpen"
            class="absolute right-0 mt-2 w-80 card p-2 z-50"
          >
            <div class="flex items-center justify-between px-2 py-1">
              <span class="text-sm font-semibold">Notifications</span>
              <button
                class="text-xs text-text-secondary hover:text-text-primary"
                @click="notif.markAllRead()"
              >
                Mark all read
              </button>
            </div>
            <div
              v-for="n in notif.items"
              :key="n.id"
              class="flex gap-3 p-2 rounded-lg hover:bg-card-hover"
            >
              <span
                class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                :class="{
                  'bg-critical': n.severity === 'critical',
                  'bg-warning': n.severity === 'warning',
                  'bg-success': n.severity === 'success',
                }"
              />
              <div class="min-w-0 flex-1">
                <div class="text-sm truncate">{{ n.title }}</div>
                <div class="text-xs text-text-secondary flex justify-between">
                  <span>{{ n.site }}</span>
                  <span>{{ n.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- User -->
      <button
        class="hidden md:flex items-center gap-2 pl-2 border-l border-border"
      >
        <div
          class="w-8 h-8 rounded-full bg-gradient-to-br from-info to-primary flex items-center justify-center text-xs font-bold"
        >
          OP
        </div>
        <ChevronDown :size="14" class="text-text-secondary" />
      </button>
    </div>

    <!-- 🔥 Dynamic Data Source Badge (Menggunakan globalBadge dari useDataSource) -->
    <div
      class="px-4 pb-2 text-[11px] text-text-secondary flex items-center gap-3"
    >
      <span>Last updated {{ lastUpdated }}</span>

      <span
        class="px-1.5 py-0.5 rounded font-medium border inline-flex items-center gap-1.5"
        :class="globalBadge.class"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="globalBadge.dot" />
        {{ globalBadge.label }}
      </span>
    </div>
  </header>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
