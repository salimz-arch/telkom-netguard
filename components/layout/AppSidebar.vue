<script setup lang="ts">
import {
  LayoutDashboard,
  Map,
  Cpu,
  AlertTriangle,
  BrainCircuit,
  ShieldAlert,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  X,
} from "lucide-vue-next";

const props = defineProps<{ collapsed: boolean; mobileOpen: boolean }>();
const emit = defineEmits<{ toggle: []; "close-mobile": [] }>();
const route = useRoute();

const sections = [
  {
    label: "Monitoring",
    items: [
      { to: "/overview", icon: LayoutDashboard, label: "Overview" },
      { to: "/network-map", icon: Map, label: "Network Map" },
      { to: "/devices", icon: Cpu, label: "Devices" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/anomalies", icon: AlertTriangle, label: "Anomaly Center" },
      { to: "/predictions", icon: BrainCircuit, label: "AI Predictions" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/incidents", icon: ShieldAlert, label: "Incidents" },
      { to: "/analytics", icon: BarChart3, label: "Analytics" },
      { to: "/reports", icon: FileText, label: "Reports" },
    ],
  },
  {
    label: "System",
    items: [{ to: "/settings", icon: Settings, label: "Settings" }],
  },
];

const systemStatus = [
  { label: "Data Pipeline", status: "Operational" },
  { label: "ML Engine", status: "Operational" },
  { label: "API", status: "Connected" },
];
</script>

<template>
  <!-- Overlay mobile -->
  <Transition name="fade">
    <div
      v-if="mobileOpen"
      class="fixed inset-0 bg-black/60 z-40 lg:hidden"
      @click="emit('close-mobile')"
    />
  </Transition>

  <aside
    class="fixed lg:sticky top-0 left-0 h-screen bg-sidebar border-r border-border z-50 flex flex-col transition-all duration-250 ease-out"
    :class="[
      collapsed ? 'lg:w-[72px]' : 'lg:w-[248px]',
      'w-[260px]',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-4 h-16 border-b border-border">
      <div
        class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0"
      >
        <ShieldAlert class="w-4.5 h-4.5 text-white" :size="18" />
      </div>
      <div v-if="!collapsed" class="min-w-0">
        <div class="text-[13px] font-bold tracking-wide truncate">
          TELKOM-NETGUARD
        </div>
        <div class="text-[10px] text-text-secondary tracking-wide">
          Network Intelligence
        </div>
      </div>
      <button
        class="lg:hidden ml-auto text-text-secondary"
        @click="emit('close-mobile')"
      >
        <X :size="18" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-4 px-2">
      <div v-for="section in sections" :key="section.label" class="mb-5">
        <div
          v-if="!collapsed"
          class="px-3 mb-2 text-[10px] font-semibold tracking-widest text-text-secondary/70 uppercase"
        >
          {{ section.label }}
        </div>
        <NuxtLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          class="group flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors duration-150"
          :class="[
            route.path.startsWith(item.to)
              ? 'bg-primary/10 text-white border-l-2 border-primary'
              : 'text-text-secondary hover:bg-card-hover hover:text-text-primary',
          ]"
          :title="collapsed ? item.label : undefined"
        >
          <component :is="item.icon" :size="18" class="shrink-0" />
          <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- System status -->
    <div v-if="!collapsed" class="p-3 border-t border-border">
      <div
        class="text-[10px] font-semibold tracking-widest text-text-secondary/70 uppercase mb-2 px-1"
      >
        System Status
      </div>
      <div
        v-for="s in systemStatus"
        :key="s.label"
        class="flex items-center gap-2 px-1 py-1 text-xs"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
        <span class="text-text-secondary flex-1 truncate">{{ s.label }}</span>
        <span class="text-success text-[10px]">{{ s.status }}</span>
      </div>
    </div>

    <!-- Collapse toggle -->
    <button
      class="hidden lg:flex items-center justify-center h-10 border-t border-border text-text-secondary hover:text-text-primary transition-colors"
      @click="emit('toggle')"
    >
      <ChevronLeft
        :size="16"
        :class="collapsed ? 'rotate-180' : ''"
        class="transition-transform"
      />
    </button>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
