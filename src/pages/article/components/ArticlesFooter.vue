<script setup lang="ts">

import { computed } from "vue"
import { usePracticeStore } from "@/stores/practice.ts";
import { useSettingStore } from "@/stores/setting.ts";
import { type Article, ShortcutKey } from "@/types/types.ts";
import BaseIcon from "@/components/BaseIcon.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import ArticleAudio from "@/pages/article/components/ArticleAudio.vue";
import SettingDialog from "@/components/setting/SettingDialog.vue";
import { msToMinute, total } from "@/utils";

const statStore = usePracticeStore()
const settingStore = useSettingStore()

const props = defineProps<{
  article: Article,
  isCollect: boolean,
  currentPractice: any[]
}>()

const emit = defineEmits<{
  collect: [],
  skip: [],
  play: [],
  next: [],
  'update-speed': [speed: number],
  'update-volume': [volume: number]
}>()

function togglePanel() {
  settingStore.showPanel = !settingStore.showPanel
}

</script>

<template>
  <div class="fixed transition-all duration-300 pointer-events-none
              bottom-[calc(0.5rem+env(safe-area-inset-bottom))] left-2 right-2 w-auto
              md:bottom-[calc(0.8rem+env(safe-area-inset-bottom))] md:left-1/2 md:-translate-x-1/2 md:w-[var(--article-toolbar-width,600px)] md:right-auto z-50">
    <div v-tooltip="settingStore.showToolbar?'收起':'展开'"
         class="absolute -bottom-1 left-1/2 -translate-x-1/2 cursor-pointer transition-all duration-300 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-2 transform pointer-events-auto"
         :class="{'rotate-180': !settingStore.showToolbar, '[@media(max-width:767px)]:rotate-180': settingStore.showPanel}"
         @click="settingStore.showToolbar = !settingStore.showToolbar">
      <IconFluentChevronDown20Filled />
    </div>

    <div class="relative w-full rounded-xl bg-[var(--color-second)] p-1 border border-[var(--color-item-border)] shadow-lg backdrop-blur-sm md:p-2 pointer-events-auto transition-all duration-300"
         :class="{'translate-y-[120%] opacity-0': !settingStore.showToolbar, '[@media(max-width:767px)]:translate-y-[120%] [@media(max-width:767px)]:opacity-0': settingStore.showPanel}">
      
      <div class="flex flex-col md:gap-2">
        <div class="flex justify-between items-center md:flex-col md:gap-1">
            <!-- Stats Section -->
            <div class="flex flex-1 overflow-x-auto items-center gap-4 px-2 no-scrollbar md:w-full md:justify-around md:overflow-visible">
              <div class="flex flex-col items-center min-w-max">
                <div class="text-xs font-bold text-gray-700 dark:text-gray-300 md:text-sm">{{ currentPractice.length }}次/{{ msToMinute(total(currentPractice, 'spend')) }}</div>
                <div class="text-[10px] text-gray-400 md:text-xs text-center border-t border-gray-200 dark:border-gray-700 w-full mt-0.5 pt-0.5">记录</div>
              </div>
              <div class="flex flex-col items-center min-w-max">
                <div class="text-xs font-bold text-gray-700 dark:text-gray-300 md:text-sm">{{ Math.floor(statStore.spend / 1000 / 60) }}m</div>
                <div class="text-[10px] text-gray-400 md:text-xs text-center border-t border-gray-200 dark:border-gray-700 w-full mt-0.5 pt-0.5">时间</div>
              </div>
              <div class="flex flex-col items-center min-w-max">
                <div class="text-xs font-bold text-gray-700 dark:text-gray-300 md:text-sm flex items-center gap-0.5">
                  {{ statStore.total }}
                  <Tooltip>
                    <IconFluentQuestionCircle20Regular class="w-3 h-3"/>
                    <template #reference>
                      <div>
                        统计词数{{ settingStore.ignoreSimpleWord ? '不包含' : '包含' }}简单词，不包含已掌握
                        <div>简单词可在设置 -> 练习设置 -> 简单词过滤中修改</div>
                      </div>
                    </template>
                  </Tooltip>
                </div>
                <div class="text-[10px] text-gray-400 md:text-xs text-center border-t border-gray-200 dark:border-gray-700 w-full mt-0.5 pt-0.5">总数</div>
              </div>
            </div>

            <!-- Audio and Toolbar Icons -->
            <div class="flex items-center gap-1 md:grid md:grid-cols-8 md:gap-2 md:w-full md:mt-1">
              <ArticleAudio
                :article="props.article"
                :autoplay="settingStore.articleAutoPlayNext"
                @ended="settingStore.articleAutoPlayNext && emit('next')"
                @update-speed="(speed) => emit('update-speed', speed)"
                @update-volume="(volume) => emit('update-volume', volume)"
              ></ArticleAudio>

              <SettingDialog type="article"/>

              <BaseIcon
                :title="isCollect ? '取消收藏' : '收藏'"
                @click="emit('collect')">
                <IconFluentStar16Filled v-if="isCollect"/>
                <IconFluentStar16Regular v-else/>
              </BaseIcon>

              <BaseIcon
                :title="`下一句(${settingStore.shortcutKeyMap[ShortcutKey.Next]})`"
                @click="emit('skip')">
                <IconFluentArrowBounce20Regular class="transform rotate-180"/>
              </BaseIcon>
              <BaseIcon
                :title="`播放当前句子(${settingStore.shortcutKeyMap[ShortcutKey.PlayWordPronunciation]})`"
                @click="emit('play')">
                <IconFluentReplay20Regular/>
              </BaseIcon>
              <BaseIcon
                @click="settingStore.dictation = !settingStore.dictation"
                :title="`开关默写模式(${settingStore.shortcutKeyMap[ShortcutKey.ToggleDictation]})`"
              >
                <IconFluentEyeOff16Regular v-if="settingStore.dictation"/>
                <IconFluentEye16Regular v-else/>
              </BaseIcon>

              <BaseIcon
                :title="`开关释义显示(${settingStore.shortcutKeyMap[ShortcutKey.ToggleShowTranslate]})`"
                @click="settingStore.translate = !settingStore.translate">
                <IconFluentTranslate16Regular v-if="settingStore.translate"/>
                <IconFluentTranslateOff16Regular v-else/>
              </BaseIcon>

              <BaseIcon
                @click="togglePanel"
                :title="`面板(${settingStore.shortcutKeyMap[ShortcutKey.TogglePanel]})`">
                <IconFluentTextListAbcUppercaseLtr20Regular/>
              </BaseIcon>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No extra styles needed, Tailwind handles it */
</style>
