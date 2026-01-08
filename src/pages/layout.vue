<script setup lang="ts">
import { ShortcutKey } from '@/types/types.ts'
// import Logo from '@/components/Logo.vue'
import { useSettingStore } from '@/stores/setting.ts'
import { useRouter } from 'vue-router'
import useTheme from '@/hooks/theme.ts'
import BaseIcon from '@/components/BaseIcon.vue'
import { useRuntimeStore } from '@/stores/runtime.ts'
// import { jump2Feedback } from '@/utils'

const settingStore = useSettingStore()
const runtimeStore = useRuntimeStore()
const router = useRouter()
const { toggleTheme, getTheme } = useTheme()

//首頁為了seo被剝離出去了，現在是一個靜態頁面，用nginx 重定向控制對應的跳轉
function goHome() {
  window.location.href = '/'
}
</script>

<template>
  <div class="flex w-full h-full bg-surface-0 dark:bg-surface-900 overflow-hidden">
    <!--    第一個aside 佔位用-->
    <div 
      class="hidden md:flex flex-col shrink-0 h-screen transition-[width] duration-300 ease-in-out" 
      :class="settingStore.sideExpand ? 'w-[var(--aside-width)]' : 'w-[4.5rem]'"
    ></div>
    
    <div 
      class="hidden md:flex flex-col justify-between fixed top-0 left-0 h-screen bg-surface-50 dark:bg-surface-800 p-4 shadow-lg z-20 transition-[width] duration-300 ease-in-out border-r border-surface-200 dark:border-surface-700 box-border" 
      :class="settingStore.sideExpand ? 'w-[var(--aside-width)]' : 'w-[4.5rem]'"
    >
      <div class="flex flex-col w-full">
        <!--        <Logo v-if="settingStore.sideExpand" />-->
        <div class="flex items-center gap-3 p-2.5 my-1 rounded-lg cursor-pointer transition-all duration-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-400 group text-surface-700 dark:text-surface-200" @click="goHome">
          <IconFluentHome20Regular class="text-2xl shrink-0" />
          <span v-if="settingStore.sideExpand" class="whitespace-nowrap font-medium">首頁</span>
        </div>
        <div class="flex items-center gap-3 p-2.5 my-1 rounded-lg cursor-pointer transition-all duration-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-400 group text-surface-700 dark:text-surface-200" @click="router.push('/words')">
          <IconFluentTextUnderlineDouble20Regular class="text-2xl shrink-0" />
          <span v-if="settingStore.sideExpand" class="whitespace-nowrap font-medium">單字</span>
        </div>
        <div id="article" class="flex items-center gap-3 p-2.5 my-1 rounded-lg cursor-pointer transition-all duration-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-400 group text-surface-700 dark:text-surface-200" @click="router.push('/articles')">
          <!--          <IconPhArticleNyTimes/>-->
          <IconFluentBookLetter20Regular class="text-2xl shrink-0" />
          <span v-if="settingStore.sideExpand" class="whitespace-nowrap font-medium">文章</span>
        </div>
        <div class="flex items-center gap-3 p-2.5 my-1 rounded-lg cursor-pointer transition-all duration-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-400 group text-surface-700 dark:text-surface-200 relative" @click="router.push('/setting')">
          <IconFluentSettings20Regular class="text-2xl shrink-0" />
          <span v-if="settingStore.sideExpand" class="whitespace-nowrap font-medium">設定</span>
          <div
            class="absolute w-2 h-2 bg-red-500 rounded-full"
            :class="!settingStore.sideExpand ? 'top-1 right-1' : 'top-2 right-2'"
            v-if="runtimeStore.isNew"
          ></div>
        </div>
        <div class="flex items-center gap-3 p-2.5 my-1 rounded-lg cursor-pointer transition-all duration-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-400 group text-surface-700 dark:text-surface-200" @click="router.push('/feedback')">
          <IconFluentCommentEdit20Regular class="text-2xl shrink-0" />
          <span v-if="settingStore.sideExpand" class="whitespace-nowrap font-medium">回饋</span>
        </div>
        <div class="flex items-center gap-3 p-2.5 my-1 rounded-lg cursor-pointer transition-all duration-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-400 group text-surface-700 dark:text-surface-200" @click="router.push('/doc')">
          <IconFluentDocument20Regular class="text-2xl shrink-0" />
          <span v-if="settingStore.sideExpand" class="whitespace-nowrap font-medium">資料</span>
        </div>
        <div class="flex items-center gap-3 p-2.5 my-1 rounded-lg cursor-pointer transition-all duration-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-400 group text-surface-700 dark:text-surface-200" @click="router.push('/qa')">
          <IconFluentQuestionCircle20Regular class="text-2xl shrink-0" />
          <span v-if="settingStore.sideExpand" class="whitespace-nowrap font-medium">說明</span>
        </div>
        <!--        <div class="flex items-center gap-3 p-2.5 my-1 rounded-lg cursor-pointer transition-all duration-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-400 group text-surface-700 dark:text-surface-200" @click="router.push('/user')">-->
        <!--          <IconFluentPerson20Regular class="text-2xl shrink-0" />-->
        <!--          <span v-if="settingStore.sideExpand" class="whitespace-nowrap font-medium">使用者</span>-->
        <!--        </div>-->
      </div>
      <div class="flex justify-evenly w-full pb-2">
        <BaseIcon @click="settingStore.sideExpand = !settingStore.sideExpand" class="hover:bg-surface-200 dark:hover:bg-surface-700 p-1.5 rounded-md cursor-pointer transition-colors text-surface-700 dark:text-surface-200">
          <IconFluentChevronLeft20Filled v-if="settingStore.sideExpand" />
          <IconFluentChevronLeft20Filled class="transform rotate-180" v-else />
        </BaseIcon>
        <BaseIcon
          v-if="settingStore.sideExpand"
          :title="`切換主題(${settingStore.shortcutKeyMap[ShortcutKey.ToggleTheme]})`"
          @click="toggleTheme"
          class="hover:bg-surface-200 dark:hover:bg-surface-700 p-1.5 rounded-md cursor-pointer transition-colors text-surface-700 dark:text-surface-200"
        >
          <IconFluentWeatherMoon16Regular v-if="getTheme() === 'light'" />
          <IconFluentWeatherSunny16Regular v-else />
        </BaseIcon>
      </div>
    </div>

    <!-- 行動端頂部選單欄 -->
    <div class="md:hidden fixed top-0 left-0 right-0 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 shadow-sm z-50 transition-transform duration-300 ease-in-out" :class="{ '-translate-y-[calc(100%-1.5rem)]': settingStore.mobileNavCollapsed }">
      <div class="flex justify-around py-2 transition-opacity duration-200" :class="{ 'opacity-0 pointer-events-none': settingStore.mobileNavCollapsed }">
        <div class="flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200 min-w-[44px] min-h-[44px] text-surface-600 dark:text-surface-300 active:scale-95" @click="router.push('/')" :class="{ 'text-primary-500 dark:text-primary-400': $route.path === '/' }">
          <IconFluentHome20Regular class="text-xl mb-1" />
          <span class="text-xs text-center">首頁</span>
        </div>
        <div
          class="flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200 min-w-[44px] min-h-[44px] text-surface-600 dark:text-surface-300 active:scale-95"
          @click="router.push('/words')"
          :class="{ 'text-primary-500 dark:text-primary-400': $route.path.includes('/words') }"
        >
          <IconFluentTextUnderlineDouble20Regular class="text-xl mb-1" />
          <span class="text-xs text-center">單字</span>
        </div>
        <div
          class="flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200 min-w-[44px] min-h-[44px] text-surface-600 dark:text-surface-300 active:scale-95"
          @click="router.push('/articles')"
          :class="{ 'text-primary-500 dark:text-primary-400': $route.path.includes('/articles') }"
        >
          <IconFluentBookLetter20Regular class="text-xl mb-1" />
          <span class="text-xs text-center">文章</span>
        </div>
        <div
          class="flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200 min-w-[44px] min-h-[44px] text-surface-600 dark:text-surface-300 active:scale-95 relative"
          @click="router.push('/setting')"
          :class="{ 'text-primary-500 dark:text-primary-400': $route.path === '/setting' }"
        >
          <IconFluentSettings20Regular class="text-xl mb-1" />
          <span class="text-xs text-center">設定</span>
          <div class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" v-if="runtimeStore.isNew"></div>
        </div>
      </div>
      <div
        class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-surface-50 dark:bg-surface-800 border border-t-0 border-surface-200 dark:border-surface-700 rounded-b-lg px-3 py-1 cursor-pointer shadow-sm active:scale-95 transition-transform duration-200"
        @click="settingStore.mobileNavCollapsed = !settingStore.mobileNavCollapsed"
      >
        <IconFluentChevronDown20Filled v-if="!settingStore.mobileNavCollapsed" class="text-surface-600 dark:text-surface-300" />
        <IconFluentChevronUp20Filled v-else class="text-surface-600 dark:text-surface-300" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 relative z-10 w-full md:ml-0 pt-16 md:pt-0">
      <router-view></router-view>
    </div>
  </div>
</template>
