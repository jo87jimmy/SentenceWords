<script setup lang="ts">
import { computed, provide, ref } from "vue"
import { ShortcutKey } from "@/types/types.ts"
import { useSettingStore } from "@/stores/setting.ts";
import Close from "@/components/icon/Close.vue";

const settingStore = useSettingStore()
let tabIndex = ref(0)
provide('tabIndex', computed(() => tabIndex.value))
</script>
<template>
  <Transition name="fade">
    <div class="anim flex flex-col bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-lg
        rounded-[0.4rem] md:rounded-lg
        w-[95vw] min-[480px]:w-[90vw] md:w-[var(--panel-width)]
        max-w-[400px] md:max-w-none
        h-auto md:h-full
        max-h-[94vh] min-[480px]:max-h-[90vh] md:max-h-full" v-bind="$attrs" v-show="settingStore.showPanel">
      <header class="flex justify-between items-center 
        p-[0.3rem] min-[480px]:p-[0.5rem] md:py-3 md:px-[var(--space-md,1.25rem)]">
        <div class="color-main text-[0.8rem] min-[480px]:text-[0.9rem] md:text-base">
          <slot name="title"></slot>
        </div>
        <Close class="cursor-pointer" @click="settingStore.showPanel = false"
          v-tooltip="`關閉(${settingStore.shortcutKeyMap[ShortcutKey.TogglePanel]})`" />
      </header>
      <div class="flex-1 overflow-auto 
        max-h-[calc(94vh-3rem)] min-[480px]:max-h-[calc(90vh-3.2rem)] md:max-h-full">
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>
