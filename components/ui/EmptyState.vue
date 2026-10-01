<script setup lang="ts">
import { CheckCircle2 } from "lucide-vue-next";
defineProps<{ title?: string; message?: string; icon?: any }>();
</script>
<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <component
      :is="icon || CheckCircle2"
      :size="40"
      class="text-success mb-3"
    />
    <div class="text-base font-semibold mb-1">{{ title || "No data" }}</div>
    <div class="text-sm text-text-secondary max-w-sm">{{ message }}</div>
  </div>
</template>
