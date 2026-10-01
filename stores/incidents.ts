import { defineStore } from "pinia";
import type { Incident } from "~/types/incident";
import { useApi } from "~/services/api";

export const useIncidentStore = defineStore("incidents", () => {
  const api = useApi();
  const incidents = ref<Incident[]>([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    try {
      // 🔥 FIX: Ambil data dari API resolver (akan return 25 rows dari mockData)
      incidents.value = await api.get<Incident[]>("/incidents");
      console.log(`[Incidents] Loaded ${incidents.value.length} rows`);
    } catch (e: any) {
      console.error("[Incidents] Fetch failed:", e);
    } finally {
      loading.value = false;
    }
  }

  return { incidents, loading, fetchAll };
});
