<script setup lang="ts">
const sidebarCollapsed = useLocalStorage("sidebar-collapsed", false);
const mobileOpen = ref(false);
</script>

<template>
  <div class="min-h-screen flex bg-bg">
    <AppSidebar
      :collapsed="sidebarCollapsed"
      :mobile-open="mobileOpen"
      @toggle="sidebarCollapsed = !sidebarCollapsed"
      @close-mobile="mobileOpen = false"
    />
    <div class="flex-1 flex flex-col min-w-0">
      <AppHeader @open-mobile="mobileOpen = true" />
      <main class="flex-1 p-4 lg:p-6 overflow-x-hidden">
        <slot />
      </main>
    </div>
  </div>
</template>
