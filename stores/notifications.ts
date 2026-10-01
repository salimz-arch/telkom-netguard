import { defineStore } from "pinia";

export interface Notification {
  id: string;
  title: string;
  site: string;
  time: string;
  severity: "critical" | "warning" | "info" | "success";
  read: boolean;
}

export const useNotificationStore = defineStore("notifications", () => {
  const items = ref<Notification[]>([
    {
      id: "1",
      title: "Critical anomaly detected",
      site: "BNA-001",
      time: "2 minutes ago",
      severity: "critical",
      read: false,
    },
    {
      id: "2",
      title: "Prediction risk increased",
      site: "BNA-023",
      time: "8 minutes ago",
      severity: "warning",
      read: false,
    },
    {
      id: "3",
      title: "Incident resolved",
      site: "BNA-014",
      time: "20 minutes ago",
      severity: "success",
      read: true,
    },
  ]);
  const unread = computed(() => items.value.filter((n) => !n.read).length);
  const markAllRead = () => items.value.forEach((n) => (n.read = true));
  return { items, unread, markAllRead };
});
