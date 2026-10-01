<script setup lang="ts">
import { useDeviceStore } from "~/stores/devices";
import { storeToRefs } from "pinia";
import type { Device } from "~/types/device";

const store = useDeviceStore();
const { devices } = storeToRefs(store);
onMounted(() => {
  if (!devices.value.length) store.fetchAll();
});

// Refs
const mapEl = ref<HTMLElement | null>(null);
const mapInstance = ref<any>(null);
const leaflet = ref<any>(null);
const renderer = ref<any>(null);
const markersLayer = ref<any>(null);
const selected = ref<Device | null>(null);
const filterRisk = ref<"all" | "normal" | "warning" | "critical">("all");
const mapReady = ref(false);
const mapError = ref<string | null>(null);
const highlightedId = ref<string | null>(null);
const isInitializing = ref(false);

const RISK_COLOR: Record<string, string> = {
  critical: "#EF4444",
  warning: "#F59E0B",
  normal: "#22C55E",
};

// Filtered list
const filteredDevices = computed(() =>
  filterRisk.value === "all"
    ? devices.value
    : devices.value.filter((d) => d.risk === filterRisk.value),
);

// 🔥 HELPER FUNCTION untuk reload (Fix TypeScript error)
const reloadPage = () => {
  window.location.reload();
};

// 🔥 KEY FIX: pakai watch(mapEl), BUKAN onMounted
watch(
  mapEl,
  async (el) => {
    if (!el) return;
    if (mapInstance.value) return; // sudah ter-init
    if (isInitializing.value) return; // sedang init

    isInitializing.value = true;
    await nextTick();

    try {
      await initMap(el);
      mapReady.value = true;
      mapError.value = null;
    } catch (err: any) {
      console.error("[NetworkMap] Init failed:", err);
      mapError.value = err?.message || "Failed to initialize map";
    } finally {
      isInitializing.value = false;
    }
  },
  { immediate: true },
);

// INIT MAP
async function initMap(el: HTMLElement) {
  const L = (await import("leaflet")).default || (await import("leaflet"));
  leaflet.value = L;

  // Pastikan container punya ukuran
  if (el.clientWidth === 0 || el.clientHeight === 0) {
    await new Promise((r) => setTimeout(r, 100));
  }

  const map = L.map(el, {
    preferCanvas: true,
    zoomControl: true,
    attributionControl: true,
    fadeAnimation: false,
    zoomAnimation: true,
  }).setView([-2.5, 118], 5);

  renderer.value = L.canvas({ padding: 0.5, tolerance: 0.5 });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "DEMO LOCATION — Not actual Telkom sites",
    maxZoom: 18,
    updateWhenZooming: false,
    updateWhenIdle: true,
    keepBuffer: 2,
    crossOrigin: true,
  }).addTo(map);

  markersLayer.value = L.layerGroup().addTo(map);
  mapInstance.value = map;

  // Force resize setelah mount
  setTimeout(() => map.invalidateSize(), 150);

  // Kalau device sudah ada, render
  if (devices.value.length > 0) {
    renderMarkers();
  }
}

// RENDER MARKERS
function renderMarkers() {
  const L = leaflet.value;
  if (!L || !markersLayer.value) return;

  markersLayer.value.clearLayers();

  const list = filteredDevices.value;
  const batch: any[] = [];

  for (const d of list) {
    if (!d.location?.lat || !d.location?.lng) continue;

    const color = RISK_COLOR[d.risk] || "#22C55E";
    const isHighlighted = d.id === highlightedId.value;

    const marker = L.circleMarker([d.location.lat, d.location.lng], {
      renderer: renderer.value,
      radius: isHighlighted
        ? 10
        : d.risk === "critical"
          ? 7
          : d.risk === "warning"
            ? 6
            : 5,
      fillColor: color,
      color: "#fff",
      weight: isHighlighted ? 3 : 1.5,
      opacity: 1,
      fillOpacity: isHighlighted ? 1 : 0.85,
      bubblingMouseEvents: false,
    });

    marker.bindPopup(buildPopupHtml(d), {
      maxWidth: 260,
      minWidth: 240,
      offset: [0, -4],
      autoPanPadding: [40, 40],
      autoPan: true,
      closeButton: true,
      className: "netguard-popup",
    });

    marker.on("click", () => {
      selected.value = d;
      highlightedId.value = d.id;
    });

    marker.on("mouseover", () => {
      marker.setStyle({ fillOpacity: 1, weight: 2.5 });
      if (mapInstance.value)
        mapInstance.value.getContainer().style.cursor = "pointer";
    });
    marker.on("mouseout", () => {
      if (d.id !== highlightedId.value) {
        marker.setStyle({ fillOpacity: 0.85, weight: 1.5 });
      }
      if (mapInstance.value) mapInstance.value.getContainer().style.cursor = "";
    });

    batch.push(marker);
  }

  batch.forEach((m) => markersLayer.value.addLayer(m));
}

// POPUP HTML
function buildPopupHtml(d: Device) {
  const color = RISK_COLOR[d.risk];
  return `
    <div style="min-width: 220px; font-family: Inter, system-ui, sans-serif; padding: 4px 2px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px;">
        <span style="font-family: ui-monospace, monospace; font-size: 13px; font-weight: 700; color: #F8FAFC;">${d.id}</span>
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; background: ${color}22; color: ${color}; border: 1px solid ${color}55;">
          ${d.risk}
        </span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; font-size: 11px; margin-bottom: 12px;">
        <div>
          <div style="color: #94A3B8; font-size: 10px; margin-bottom: 2px;">Health</div>
          <div style="color: #F8FAFC; font-weight: 600;">${Math.round(d.health)}/100</div>
        </div>
        <div>
          <div style="color: #94A3B8; font-size: 10px; margin-bottom: 2px;">Risk Score</div>
          <div style="color: ${color}; font-weight: 600;">${d.riskScore}%</div>
        </div>
        <div>
          <div style="color: #94A3B8; font-size: 10px; margin-bottom: 2px;">Latency</div>
          <div style="color: #F8FAFC; font-weight: 600;">${d.latency} ms</div>
        </div>
        <div>
          <div style="color: #94A3B8; font-size: 10px; margin-bottom: 2px;">Packet Loss</div>
          <div style="color: #F8FAFC; font-weight: 600;">${d.packetLoss}%</div>
        </div>
      </div>
      <a href="/devices/${d.id}"
        style="display: block; text-align: center; padding: 8px 12px; background: #E30613; color: white; font-size: 12px; font-weight: 600; border-radius: 6px; text-decoration: none;">
        View Details
      </a>
    </div>
  `;
}

// WATCHERS
watch(filterRisk, () => {
  if (mapReady.value) renderMarkers();
  selected.value = null;
  highlightedId.value = null;
});

watch(
  () => devices.value.length,
  (len) => {
    if (len > 0 && mapReady.value) renderMarkers();
  },
);

onUnmounted(() => {
  mapInstance.value?.remove();
  mapInstance.value = null;
  mapReady.value = false;
});

const riskCount = computed(() => filteredDevices.value.length);
</script>

<template>
  <div>
    <PageHeader
      title="Network Map"
      description="Visualisasi lokasi site (DEMO LOCATION)."
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- MAP -->
      <div class="card p-3 lg:col-span-2">
        <ClientOnly>
          <div class="relative">
            <!-- Div map HARUS punya height eksplisit -->
            <div
              ref="mapEl"
              style="width: 100%; height: 560px; min-height: 560px"
              class="rounded-lg overflow-hidden border border-border bg-card"
            />

            <!-- Loading overlay -->
            <Transition name="fade">
              <div
                v-if="!mapReady && !mapError"
                class="absolute inset-0 rounded-lg flex items-center justify-center bg-card/80 backdrop-blur-sm pointer-events-none"
              >
                <div class="flex flex-col items-center gap-2">
                  <div
                    class="w-6 h-6 border-2 border-info border-t-transparent rounded-full animate-spin"
                  />
                  <span class="text-xs text-text-secondary"
                    >Loading map...</span
                  >
                </div>
              </div>
            </Transition>

            <!-- Error overlay -->
            <div
              v-if="mapError"
              class="absolute inset-0 rounded-lg flex items-center justify-center bg-card/95"
            >
              <div class="text-center px-6">
                <div class="text-critical text-sm font-semibold mb-2">
                  Map failed to load
                </div>
                <div class="text-xs text-text-secondary mb-3">
                  {{ mapError }}
                </div>
                <!-- 🔥 FIX: Pakai fungsi helper reloadPage -->
                <button class="btn btn-outline" @click="reloadPage">
                  Reload Page
                </button>
              </div>
            </div>

            <!-- Counter chip -->
            <div
              v-if="mapReady"
              class="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-sidebar/90 backdrop-blur border border-border text-[11px] font-medium text-text-secondary z-[1000]"
            >
              {{ riskCount }} sites
            </div>
          </div>

          <template #fallback>
            <div
              style="width: 100%; height: 560px"
              class="rounded-lg bg-card border border-border flex items-center justify-center text-xs text-text-secondary"
            >
              Loading map...
            </div>
          </template>
        </ClientOnly>
      </div>

      <!-- SIDE PANEL -->
      <div class="space-y-4">
        <div class="card p-5">
          <div class="text-sm font-semibold mb-3">Filter</div>
          <select v-model="filterRisk" class="input">
            <option value="all">All Risk Levels</option>
            <option value="normal">Normal</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <div class="mt-3 flex items-center justify-between text-xs">
            <span class="text-text-secondary">Showing</span>
            <span class="font-semibold text-text-primary"
              >{{ riskCount }} sites</span
            >
          </div>
        </div>

        <Transition name="slide-up" mode="out-in">
          <div v-if="selected" :key="selected.id" class="card p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="font-mono text-lg font-bold">{{ selected.id }}</div>
              <StatusBadge
                :status="selected.risk"
                :pulse="selected.risk === 'critical'"
              />
            </div>
            <div class="text-xs text-text-secondary mb-4">
              {{ selected.region }} • {{ selected.type }}
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm mb-4">
              <div>
                <div class="text-xs text-text-secondary">Health</div>
                <div class="font-semibold">
                  {{ Math.round(selected.health) }}/100
                </div>
              </div>
              <div>
                <div class="text-xs text-text-secondary">Risk Score</div>
                <div
                  class="font-semibold"
                  :class="{
                    'text-critical': selected.riskScore > 80,
                    'text-warning':
                      selected.riskScore > 50 && selected.riskScore <= 80,
                  }"
                >
                  {{ selected.riskScore }}%
                </div>
              </div>
              <div>
                <div class="text-xs text-text-secondary">Latency</div>
                <div>{{ selected.latency }} ms</div>
              </div>
              <div>
                <div class="text-xs text-text-secondary">Packet Loss</div>
                <div>{{ selected.packetLoss }}%</div>
              </div>
              <div>
                <div class="text-xs text-text-secondary">CPU</div>
                <div>{{ selected.cpu }}%</div>
              </div>
              <div>
                <div class="text-xs text-text-secondary">Memory</div>
                <div>{{ selected.memory }}%</div>
              </div>
            </div>
            <NuxtLink
              :to="`/devices/${selected.id}`"
              class="btn btn-primary w-full"
            >
              View Details
            </NuxtLink>
          </div>

          <div v-else class="card p-5 text-center">
            <div class="text-xs text-text-secondary">
              Klik marker untuk melihat detail site.
            </div>
          </div>
        </Transition>

        <div class="card p-5">
          <div
            class="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3"
          >
            Legend
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-success" />
              <span class="text-text-secondary">Normal</span>
              <span class="ml-auto font-medium text-text-primary">
                {{ devices.filter((d) => d.risk === "normal").length }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-warning" />
              <span class="text-text-secondary">Warning</span>
              <span class="ml-auto font-medium text-text-primary">
                {{ devices.filter((d) => d.risk === "warning").length }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-critical" />
              <span class="text-text-secondary">Critical</span>
              <span class="ml-auto font-medium text-text-primary">
                {{ devices.filter((d) => d.risk === "critical").length }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Global (non-scoped) untuk style popup Leaflet */
.leaflet-popup-content-wrapper {
  background: #0e1b2e !important;
  border: 1px solid #1d3047 !important;
  border-radius: 10px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
  padding: 0 !important;
}
.leaflet-popup-content {
  margin: 12px 14px !important;
  color: #f8fafc !important;
  line-height: 1.4 !important;
}
.leaflet-popup-tip {
  background: #0e1b2e !important;
  border: 1px solid #1d3047 !important;
}
.leaflet-popup-close-button {
  color: #94a3b8 !important;
  padding: 6px 8px 0 0 !important;
}
.leaflet-popup-close-button:hover {
  color: #f8fafc !important;
}
.leaflet-container {
  background: #07111f !important;
  font-family: "Inter", system-ui, sans-serif !important;
  outline: none !important;
}
.leaflet-container a {
  color: #38bdf8 !important;
}
.leaflet-control-zoom a {
  background: #0e1b2e !important;
  color: #f8fafc !important;
  border-color: #1d3047 !important;
}
.leaflet-control-zoom a:hover {
  background: #13243a !important;
}
.leaflet-fade-anim .leaflet-tile {
  transition: none !important;
}
</style>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 250ms;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
