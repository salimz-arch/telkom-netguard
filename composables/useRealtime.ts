import { useIntervalFn, useDocumentVisibility } from "@vueuse/core";

export function useRealtime(
  callback: () => Promise<void> | void,
  intervalMs = 30000,
) {
  const visibility = useDocumentVisibility();

  const { pause, resume } = useIntervalFn(async () => {
    if (visibility.value !== "visible") return;
    await callback();
  }, intervalMs);

  watch(visibility, (v) => {
    if (v === "visible") callback();
  });

  onMounted(() => {
    callback();
    resume();
  });
  onUnmounted(() => pause());

  return { pause, resume };
}
