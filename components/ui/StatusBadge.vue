<script setup lang="ts">
type Status =
  | "normal"
  | "warning"
  | "critical"
  | "info"
  | "success"
  | "open"
  | "resolved"
  | "investigating"
  | "mitigated";
const props = defineProps<{
  status: Status;
  label?: string;
  pulse?: boolean;
}>();
const map: Record<string, { bg: string; text: string; dot: string }> = {
  normal: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  success: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  resolved: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  warning: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  investigating: {
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  mitigated: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  info: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  open: { bg: "bg-critical/10", text: "text-critical", dot: "bg-critical" },
  critical: { bg: "bg-critical/10", text: "text-critical", dot: "bg-critical" },
};
const s = computed(() => map[props.status] || map.info);
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
    :class="[s.bg, s.text, `border-current/20`]"
  >
    <span
      class="w-1.5 h-1.5 rounded-full"
      :class="[s.dot, { 'pulse-critical': pulse }]"
    />
    {{ label || status.charAt(0).toUpperCase() + status.slice(1) }}
  </span>
</template>
