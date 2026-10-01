import { defineStore } from "pinia";
import type { Device } from "~/types/device";
import { useApi } from "~/services/api";

export const useDeviceStore = defineStore("devices", () => {
  const api = useApi();
  const devices = ref<Device[]>([]);
  const current = ref<Device | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll() {
    loading.value = true;
    try {
      devices.value = await api.get<Device[]>("/devices");
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOne(id: string) {
    loading.value = true;
    try {
      current.value = await api.get<Device>(`/devices/${id}`);
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  return { devices, current, loading, error, fetchAll, fetchOne };
});
