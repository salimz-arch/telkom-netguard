<script setup lang="ts">
defineProps<{ title: string; description?: string }>();
</script>
<template>
  <div
    class="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-6"
  >
    <div>
      <h1 class="text-2xl lg:text-3xl font-bold tracking-tight">{{ title }}</h1>
      <p v-if="description" class="text-sm text-text-secondary mt-1">
        {{ description }}
      </p>
    </div>
    <slot name="actions" />
  </div>
</template>
