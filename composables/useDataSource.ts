import { computed } from "vue";
import { useNetworkStore } from "~/stores/network";

export function useDataSource() {
  const config = useRuntimeConfig();
  const networkStore = useNetworkStore();

  // 🔥 NUCLEAR BYPASS:
  // Jika Nuxt masih bandel membaca useMock = true, kita paksa isHybrid = true
  // agar logika fallback bisa berjalan dan badge berubah jadi DEGRADED.
  // (Nanti bisa dikembalikan ke: !config.public.useMock setelah cache bersih)
  const isHybrid = computed(() => true);

  // Pinia otomatis unwrap ref di setup store, jadi langsung bandingkan string-nya
  const isDegraded = computed(() => networkStore.dataSource === "fallback");

  const globalBadge = computed(() => {
    // 1. Jika mode full mock (useMock = true)
    if (!isHybrid.value) {
      return {
        label: "DEMO DATA",
        class: "bg-warning/10 text-warning border-warning/20",
        dot: "bg-warning",
      };
    }

    // 2. Jika mode hybrid, tapi data real gagal (fallback ke mock)
    // Menggunakan 'critical' (merah) agar operator NOC langsung sadar data tidak live
    if (isDegraded.value) {
      return {
        label: "DEGRADED (Fallback)",
        class: "bg-critical/10 text-critical border-critical/20",
        dot: "bg-critical animate-pulse",
      };
    }

    // 3. Jika mode hybrid dan data real berhasil diambil
    return {
      label: "HYBRID LIVE",
      class: "bg-success/10 text-success border-success/30",
      dot: "bg-success animate-pulse",
    };
  });

  return { isHybrid, isDegraded, globalBadge };
}
