<script setup lang="ts">
import {computed, provide,ref} from "vue"
import {ShortcutKey} from "@/types/types.ts"
import {useSettingStore} from "@/stores/setting.ts";
import Close from "@/components/icon/Close.vue";

const settingStore = useSettingStore()
let tabIndex = ref(0)
provide('tabIndex', computed(() => tabIndex.value))


</script>
<template>
  <Transition name="fade">
    <div class="anim bg-white dark:bg-zinc-900 flex flex-col border border-[var(--color-item-border)] shadow-[var(--shadow)] 
                fixed z-[200] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[400px] max-h-[90vh] h-auto rounded-[0.4rem]
                md:relative md:z-10 md:top-auto md:left-auto md:translate-x-0 md:translate-y-0 md:w-[var(--panel-width)] md:h-full md:max-h-full md:max-w-none md:rounded-lg" 
         v-bind="$attrs" v-show="settingStore.showPanel">
      <header class="flex justify-between items-center py-[0.3rem] px-[0.3rem] md:py-3 md:px-space">
        <div class="color-main text-[0.8rem] md:text-base">
          <slot name="title"></slot>
        </div>
        <div
            v-tooltip.bottom="`關閉(${settingStore.shortcutKeyMap[ShortcutKey.TogglePanel]})`"
        >
          <Close @click="settingStore.showPanel = false"/>
        </div>
      </header>
      <div class="flex-1 overflow-auto">
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>
<style scoped>
</style>
