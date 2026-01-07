<script setup lang="ts">

import { inject, type Ref, computed } from "vue"
import { usePracticeStore } from "@/stores/practice.ts";
import { useSettingStore } from "@/stores/setting.ts";
import { type PracticeData, ShortcutKey } from "@/types/types.ts";
import Button from "primevue/button";
import ProgressBar from "primevue/progressbar";

const statStore = usePracticeStore()
const settingStore = useSettingStore()

defineProps<{
  showEdit?: boolean,
  isCollect: boolean,
  isSimple: boolean
}>()

const emit = defineEmits<{
  toggleCollect: [],
  toggleSimple: [],
  edit: [],
  skip: [],
  skipStep:[]
}>()

let practiceData = inject<PracticeData>('practiceData')
let isTypingWrongWord = inject<Ref<boolean>>('isTypingWrongWord')

function format(val: number, suffix: string = '', check: number = -1) {
  return val === check ? '-' : (val + suffix)
}

const status = computed(() => {
  if (isTypingWrongWord?.value) return '複習錯詞'
  return getStepStr(statStore.step)
})

function getStepStr(step: number) {
  let str = ''
  switch (step) {
    case 0:
      str += `學習新詞`
      break
    case 1:
      str += `聽寫新詞`
      break
    case 2:
      str += `默寫新詞`
      break
    case 3:
      str += `辨認上次學習`
      break
    case 4:
      str += '聽寫上次學習'
      break
    case 5:
      str += '默寫上次學習'
      break
    case 6:
      str += '辨認之前學習'
      break
    case 7:
      str += '聽寫之前學習'
      break
    case 8:
      str += '默寫之前學習'
      break
    case 9:
      str += '學習完成'
      break
    case 10:
      str += '隨機複習'
      break
  }
  return str
}

const progress = computed(() => {
  if (!practiceData?.words.length) return 0
  return ((practiceData.index / practiceData.words.length) * 100)
})

function togglePanel() {
  settingStore.showPanel = !settingStore.showPanel
  if (settingStore.showPanel) {
    settingStore.showToolbar = false
  }
}

</script>

<template>
  <div class="fixed transition-all duration-300 pointer-events-none
              bottom-[calc(0.5rem+env(safe-area-inset-bottom))] left-2 right-2 w-auto
              md:bottom-[calc(0.8rem+env(safe-area-inset-bottom))] md:left-1/2 md:-translate-x-1/2 md:w-[var(--toolbar-width)] md:right-auto">
    
    <div v-tooltip="settingStore.showToolbar?'收起':'展開'" 
         class="absolute -bottom-1 left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-300 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-2 transform pointer-events-auto"
         :class="{'rotate-180': !settingStore.showToolbar, '[@media(max-width:767px)]:rotate-180': settingStore.showPanel}"
         @click="settingStore.showToolbar = !settingStore.showToolbar">
      <IconFluentChevronDown20Filled />
    </div>

    <div class="relative w-full rounded-xl bg-[var(--color-second)] p-1 border border-[var(--color-item-border)] shadow-lg backdrop-blur-sm md:p-2 pointer-events-auto transition-all duration-300"
         :class="{'translate-y-[120%] opacity-0': !settingStore.showToolbar, '[@media(max-width:767px)]:translate-y-[120%] [@media(max-width:767px)]:opacity-0': settingStore.showPanel}">
      <!-- ProgressBar for Desktop (inside panel) -->
      <div class="hidden md:block mb-2 px-1">
         <ProgressBar :value="progress" :showValue="false" class="h-1.5 !bg-gray-200 dark:!bg-gray-700" 
                      :pt="{ value: { class: '!bg-green-500' } }"></ProgressBar>
      </div>

      <div class="flex flex-col md:gap-2">
        <div class="flex justify-between items-center md:flex-col md:gap-1">
            <!-- Mobile Stats (Horizontal Scroll) -->
            <div class="flex flex-1 overflow-x-auto items-center gap-4 px-2 no-scrollbar md:w-full md:justify-around md:overflow-visible">
              <div class="flex flex-col items-center min-w-max">
                <div class="text-xs font-bold text-gray-700 dark:text-gray-300 md:text-sm">{{ practiceData ? `${practiceData.index + 1}/${practiceData.words.length}` : '-/-' }}</div>
                <div class="text-[10px] text-gray-400 md:text-xs text-center border-t border-gray-200 dark:border-gray-700 w-full mt-0.5 pt-0.5">{{ status }}</div>
              </div>
              <div class="flex flex-col items-center min-w-max">
                <div class="text-xs font-bold text-gray-700 dark:text-gray-300 md:text-sm">{{ statStore.total }}</div>
                <div class="text-[10px] text-gray-400 md:text-xs text-center border-t border-gray-200 dark:border-gray-700 w-full mt-0.5 pt-0.5">單字總數</div>
              </div>
               <!-- Hidden on very small screens if needed, but keeping for now -->
              <div class="flex flex-col items-center min-w-max hidden sm:flex">
                <div class="text-xs font-bold text-gray-700 dark:text-gray-300 md:text-sm">{{ format(statStore.wrong, '', 0) }}</div>
                <div class="text-[10px] text-gray-400 md:text-xs text-center border-t border-gray-200 dark:border-gray-700 w-full mt-0.5 pt-0.5">錯誤數</div>
              </div>
            </div>

            <!-- Toolbar Icons -->
            <div class="flex items-center gap-1 md:grid md:grid-cols-7 md:gap-2 md:w-full md:mt-1">
              <Button v-if="statStore.step < 9" text rounded size="small" 
                      @click="emit('skipStep')" v-tooltip.top="`跳到下一階段:${getStepStr(statStore.step+1)}`"
                      class="!w-8 !h-8 !p-0 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 md:!w-full md:!h-9">
                <IconFluentArrowRight16Regular />
              </Button>

              <Button text rounded size="small"
                      :class="!isSimple ? 'text-gray-400' : 'text-green-500'"
                      @click="$emit('toggleSimple')" v-tooltip.top="(!isSimple ? '標記為已掌握' : '取消標記已掌握')"
                      class="!w-8 !h-8 !p-0 md:!w-full md:!h-9">
                <IconFluentCheckmarkCircle16Regular v-if="!isSimple" />
                <IconFluentCheckmarkCircle16Filled v-else />
              </Button>

              <Button text rounded size="small"
                      :class="!isCollect ? 'text-gray-400' : 'text-yellow-500'"
                      @click.stop="$emit('toggleCollect')" v-tooltip.top="(!isCollect ? '收藏' : '取消收藏')"
                      class="!w-8 !h-8 !p-0 md:!w-full md:!h-9">
                <IconFluentStarAdd16Regular v-if="!isCollect" />
                <IconFluentStar16Filled v-else />
              </Button>

              <Button text rounded size="small" 
                      @click="emit('skip')" v-tooltip.top="`跳過`"
                      class="!w-8 !h-8 !p-0 text-gray-500 md:!w-full md:!h-9">
                <IconFluentArrowBounce20Regular class="transform rotate-180" />
              </Button>

              <Button text rounded size="small"
                      @click="settingStore.dictation = !settingStore.dictation" v-tooltip.top="`默寫模式`"
                      class="!w-8 !h-8 !p-0 text-gray-500 md:!w-full md:!h-9">
                <IconFluentEyeOff16Regular v-if="settingStore.dictation" />
                <IconFluentEye16Regular v-else />
              </Button>

              <Button text rounded size="small"
                      @click="settingStore.translate = !settingStore.translate" v-tooltip.top="`釋義顯示`"
                      class="!w-8 !h-8 !p-0 text-gray-500 md:!w-full md:!h-9">
                <IconFluentTranslate16Regular v-if="settingStore.translate" />
                <IconFluentTranslateOff16Regular v-else />
              </Button>

              <Button text rounded size="small"
                      @click="togglePanel" v-tooltip.top="`單字本`"
                      class="!w-8 !h-8 !p-0 text-gray-500 md:!w-full md:!h-9">
                <IconFluentTextListAbcUppercaseLtr20Regular />
              </Button>
            </div>
        </div>
      </div>
    
      <!-- Mobile ProgressBar (Horizontal bottom) -->
      <div class="block md:hidden mt-2 px-1">
         <ProgressBar :value="progress" :showValue="false" class="h-1 !bg-gray-200 dark:!bg-gray-700" 
                      :pt="{ value: { class: '!bg-green-500' } }"></ProgressBar>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No extra styles needed, Tailwind handles it */
</style>
