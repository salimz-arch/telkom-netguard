<script setup lang="ts">
const props = defineProps<{
  icon: any;
  title: string;
  value: string | number;
  trend?: string;
  context?: string;
  color?: "primary" | "warning" | "critical" | "info" | "success";
}>();

const colorMap = {
  primary: "text-primary bg-primary/10",
  warning: "text-warning bg-warning/10",
  critical: "text-critical bg-critical/10",
  info: "text-info bg-info/10",
  success: "text-success bg-success/10",
};

// 🔥 FIX: Formatter dengan locale FIXED ('en-US')
// Ini menjamin server dan client menghasilkan string yang IDENTIK (misal: 1,248)
// sehingga mencegah Vue Hydration Mismatch warning.
const FIXED_FORMATTER = new Intl.NumberFormat("en-US");

function formatValue(val: string | number): string {
  if (typeof val === "number") {
    return FIXED_FORMATTER.format(val);
  }
  // Jika sudah berupa string (misal: "99.8%"), kembalikan apa adanya
  return String(val);
}

const displayValue = computed(() => formatValue(props.value));
</script>

<template>
  <div class="card card-hover p-5">
    <div class="flex items-start justify-between mb-3">
      <div
        class="w-9 h-9 rounded-lg flex items-center justify-center"
        :class="colorMap[color || 'primary']"
      >
        <component :is="icon" :size="18" />
      </div>
      <div v-if="trend" class="text-xs font-medium text-text-secondary">
        {{ trend }}
      </div>
    </div>

    <!-- 🔥 FIX: Gunakan displayValue, BUKAN props.value langsung -->
    <!-- tabular-nums ditambahkan agar lebar angka tidak bergeser saat berubah -->
    <div class="text-3xl font-bold tracking-tight mb-1 tabular-nums">
      {{ displayValue }}
    </div>

    <div class="text-sm text-text-secondary">{{ title }}</div>
    <div
      v-if="context"
      class="text-xs text-text-secondary/70 mt-2 pt-2 border-t border-border"
    >
      {{ context }}
    </div>
  </div>
</template>
