<script setup lang="ts">

import {type Word} from "@/types/types.ts";
import VolumeIcon from "@/components/icon/VolumeIcon.vue";
import {usePlayWordAudio} from "@/hooks/sound.ts";
import Tooltip from "@/components/base/Tooltip.vue";

withDefaults(defineProps<{
  item: Word,
  showTranslate?: boolean
  showWord?: boolean
  showTransPop?: boolean
  hiddenOptionIcon?: boolean
}>(), {
  showTranslate: true,
  showWord: true,
  showTransPop: true,
  hiddenOptionIcon: false,
})

const playWordAudio = usePlayWordAudio()

</script>

<template>
  <div class="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors duration-200"
       :class="{'pr-2': hiddenOptionIcon}"
  >
    <div class="flex items-center gap-4 flex-1 min-w-0">
      <slot name="prefix" :item="item"></slot>
      <div class="flex flex-col gap-1 w-full min-w-0">
        <div class="flex items-center gap-3 flex-wrap">
          <span 
            class="text-lg font-bold text-surface-900 dark:text-surface-0 transition-all duration-300"
            :class="!showWord && 'blur-sm select-none'"
          >
            {{ item.word }}
          </span>
          <span class="text-sm text-surface-500 dark:text-surface-400 font-mono">{{ item.phonetic0 }}</span>
          <VolumeIcon 
            class="w-5 h-5 cursor-pointer text-primary-500 hover:text-primary-600 transition-colors" 
            @click.stop="playWordAudio(item.word)"
          ></VolumeIcon>
        </div>
        <div class="flex flex-col gap-1.5" v-if="item.trans.length && showTranslate">
          <div v-for="(v, index) in item.trans" :key="index" class="text-sm text-surface-600 dark:text-surface-300 truncate">
            <Tooltip
              v-if="v.cn.length > 30 && showTransPop"
              :title="v.pos + '  ' + v.cn"
            >
              <span class="cursor-help border-b border-dotted border-surface-400">{{ v.pos + '  ' + v.cn.slice(0, 30) + '...' }}</span>
            </Tooltip>
            <span v-else>{{ v.pos + '  ' + v.cn }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex items-center shrink-0 ml-4" v-if="!hiddenOptionIcon">
      <slot name="suffix" :item="item"></slot>
    </div>
  </div>
</template>

<style scoped>
/* No specific styles needed, using Tailwind */
</style>
