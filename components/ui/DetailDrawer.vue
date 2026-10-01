<script setup lang="ts">
import { X } from "lucide-vue-next";
defineProps<{ open: boolean; title?: string }>();
defineEmits<{ close: [] }>();
</script>
<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="fixed inset-0 z-[100] flex justify-end">
        <div class="absolute inset-0 bg-black/60" @click="$emit('close')" />
        <div
          class="relative w-full max-w-lg bg-sidebar border-l border-border h-full overflow-y-auto animate-fade-in"
        >
          <div
            class="sticky top-0 bg-sidebar/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between z-10"
          >
            <h2 class="text-lg font-semibold">{{ title }}</h2>
            <button class="btn btn-ghost" @click="$emit('close')">
              <X :size="18" />
            </button>
          </div>
          <div class="p-5"><slot /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 200ms;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
</style>
