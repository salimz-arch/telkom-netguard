<script setup lang="ts">
import { AlertCircle, RefreshCw } from "lucide-vue-next";
defineProps<{ title?: string; message?: string }>();
defineEmits<{ retry: [] }>();
</script>
<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle :size="40" class="text-critical mb-3" />
    <div class="text-base font-semibold mb-1">
      {{ title || "Unable to load data" }}
    </div>
    <div class="text-sm text-text-secondary max-w-sm mb-4">
      {{ message || "Connection to monitoring service failed." }}
    </div>
    <button class="btn btn-outline" @click="$emit('retry')">
      <RefreshCw :size="14" /> Retry
    </button>
  </div>
</template>
