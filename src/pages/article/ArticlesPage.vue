<script setup lang="ts">
import { useBaseStore } from "@/stores/base.ts";
import { useRouter } from "vue-router";
import BasePage from "@/components/BasePage.vue";
import {
  _getDictDataByUrl,
  _nextTick,
  isMobile,
  loadJsLib,
  msToHourMinute,
  resourceWrap,
  total,
  useNav
} from "@/utils";
import { type DictResource, DictType } from "@/types/types.ts";
import { useRuntimeStore } from "@/stores/runtime.ts";
import Book from "@/components/Book.vue";
import Progress from '@/components/base/Progress.vue';
import Toast from '@/components/base/toast/Toast.ts'
import BaseButton from "@/components/BaseButton.vue";
import PopConfirm from "@/components/PopConfirm.vue";
import { watch } from "vue";
import { getDefaultDict } from "@/types/func.ts";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isoWeek from 'dayjs/plugin/isoWeek'
import { useFetch } from "@vueuse/core";
import { AppEnv, DICT_LIST, Host, LIB_JS_URL, PracticeSaveArticleKey, TourConfig } from "@/config/env.ts";
import { myDictList } from "@/apis";
import { useSettingStore } from "@/stores/setting.ts";

import { ref ,computed} from "vue";

dayjs.extend(isoWeek)
dayjs.extend(isBetween);

const {nav} = useNav()
const base = useBaseStore()
const store = useBaseStore()
const settingStore = useSettingStore()
const router = useRouter()
const runtimeStore = useRuntimeStore()
let isSaveData = ref(false)

watch(() => store.load, n => {
  if (n) init()
}, {immediate: true})

async function init() {
  if (AppEnv.CAN_REQUEST) {
    let res = await myDictList({type: "article"})
    if (res.success) {
      store.setState(Object.assign(store.$state, res.data))
    }
  }
  if (store.article.studyIndex >= 1) {
    if (!store.sbook.custom && !store.sbook.articles.length) {
      store.article.bookList[store.article.studyIndex] = await _getDictDataByUrl(store.sbook, DictType.article)
    }
  }
  let d = localStorage.getItem(PracticeSaveArticleKey.key)
  if (d) {
    try {
      let obj = JSON.parse(d)
      let data = obj.val
      //如果全是0，說明未進行練習，直接重置
      if (
        data.practiceData.sectionIndex === 0 &&
        data.practiceData.sentenceIndex === 0 &&
        data.practiceData.wordIndex === 0
      ) {
        throw new Error()
      }
      isSaveData.value = true
    } catch (e) {
      localStorage.removeItem(PracticeSaveArticleKey.key)
    }
  }
}

watch(() => store?.sbook?.id, (n) => {
  console.log('n', n)
  if (!n) {
    _nextTick(async () => {
      const Shepherd = await loadJsLib('Shepherd', LIB_JS_URL.SHEPHERD);
      const tour = new Shepherd.Tour(TourConfig);
      tour.on('cancel', () => {
        localStorage.setItem('tour-guide', '1');
      });
      tour.addStep({
        id: 'step7',
        text: '點擊這裡選擇一本書籍開始學習，步驟前面選詞典相同，讓我們跳過中間步驟，直接開始練習吧',
        attachTo: {
          element: '#no-book',
          on: 'bottom'
        },
        buttons: [
          {
            text: `下一步（7/${TourConfig.total}）`,
            action() {
              tour.next()
              nav('/practice-articles/article_nce2', {guide: 1})
            }
          }
        ]
      });

      const r = localStorage.getItem('tour-guide');
      if (settingStore.first && !r && !isMobile()) {
        tour.start();
      }
    }, 500)
  }
}, {immediate: true})

function startStudy() {
  // console.log(store.sbook.articles[1])
  // genArticleSectionData(cloneDeep(store.sbook.articles[1]))
  // return
  if (base.sbook.id) {
    if (!base.sbook.articles.length) {
      return Toast.warning('沒有文章可學習！')
    }
    window.umami?.track('startStudyArticle', {
      name: base.sbook.name,
      custom: base.sbook.custom,
      complete: base.sbook.complete,
      s:`name:${base.sbook.name},index:${base.sbook.lastLearnIndex},title:${base.sbook.articles[base.sbook.lastLearnIndex]?.title}`,
    })
    nav('/practice-articles/' + store.sbook.id)
  } else {
    window.umami?.track('no-book')
    Toast.warning('請先選擇一本書籍')
  }
}

let isMultiple = ref(false)
let selectIds = ref<string[]>([])

function handleBatchDel() {
  selectIds.value.forEach(id => {
    let r = base.article.bookList.findIndex(v => v.id === id)
    if (r !== -1) {
      if (base.article.studyIndex === r) {
        base.article.studyIndex = -1
      }
      if (base.article.studyIndex > r) {
        base.article.studyIndex--
      }
      base.article.bookList.splice(r, 1)
    }
  })
  selectIds.value = []
  Toast.success("刪除成功！")
}

function toggleSelect(item:any) {
  let rIndex = selectIds.value.findIndex(v => v === item.id)
  if (rIndex > -1) {
    selectIds.value.splice(rIndex, 1)
  } else {
    selectIds.value.push(item.id)
  }
}

async function goBookDetail(val: DictResource) {
  runtimeStore.editDict = getDefaultDict(val)
  nav('book-detail')
}

const totalSpend = computed(() => {
  if (base.sbook.statistics?.length) {
    return msToHourMinute(total(base.sbook.statistics, 'spend'))
  }
  return 0
})
const todayTotalSpend = computed(() => {
  if (base.sbook.statistics?.length) {
    return msToHourMinute(total(base.sbook.statistics.filter(v => dayjs(v.startDate).isSame(dayjs(), 'day')), 'spend'))
  }
  return 0
})

const totalDay = computed(() => {
  if (base.sbook.statistics?.length) {
    return new Set(base.sbook.statistics.map(v => dayjs(v.startDate).format('YYYY-MM-DD'))).size
  }
  return 0
})

const weekList = computed(() => {
  const list = Array(7).fill(false);

  // 獲取本週的起止時間
  const startOfWeek = dayjs().startOf('isoWeek'); // 週一
  const endOfWeek = dayjs().endOf('isoWeek');     // 週日

  store.sbook.statistics?.forEach(item => {
    const date = dayjs(item.startDate);
    if (date.isBetween(startOfWeek, endOfWeek, null, '[]')) {
      let idx = date.day();
      // dayjs().day() 0=週日, 1=週一, ..., 6=週六
      // 需要轉換為 0=週一, ..., 6=週日
      if (idx === 0) {
        idx = 6; // 週日放到最後
      } else {
        idx = idx - 1; // 其餘前移一位
      }
      list[idx] = true;
    }
  });
  return list
})

const {data: recommendBookList, isFetching} = useFetch(resourceWrap(DICT_LIST.ARTICLE.RECOMMENDED)).json()

</script>

<template>
  <BasePage>
    <!-- Main Dashboard Card -->
    <div class="bg-white dark:bg-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-zinc-700 mb-8 transition-all hover:shadow-md">
      <div class="flex flex-col md:flex-row gap-8 items-start">
        <!-- Left: Current Book -->
        <div class="w-full md:w-auto md:flex-shrink-0 flex justify-center md:items-start relative group">
          <div class="relative w-48 md:w-56 transition-transform transform group-hover:-translate-y-1 duration-300">
             <Book
              v-if="base.sbook.id"
              :is-add="false"
              quantifier="篇"
              :item="base.sbook"
              :show-progress="false"
              class="!shadow-lg !border-0"
              @click="goBookDetail(base.sbook)"/>
            <Book v-else
              :is-add="true"
              class="!shadow-lg !border-0"
              @click="router.push('/book-list')"/>
          </div>
          <!-- Decorative Blur Behind Book -->
          <div class="absolute -inset-4 bg-blue-100/50 dark:bg-blue-900/20 blur-2xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>

        <!-- Right: Stats & Actions -->
        <div class="flex-1 w-full min-w-0 flex flex-col justify-between h-full">
          <!-- Header and Week Tracker -->
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
            <div>
               <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">本週學習概覽</h2>
               <p class="text-gray-500 dark:text-gray-400 text-sm">保持每日學習的好習慣</p>
            </div>
            
            <div class="bg-gray-50 dark:bg-zinc-700/50 rounded-xl p-3 flex gap-3">
              <div 
                v-for="(item, i) in weekList" 
                :key="i"
                class="flex flex-col items-center gap-1"
              >
                  <div 
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-300"
                    :class="item ? 'bg-primary text-white shadow-md shadow-blue-200 dark:shadow-none' : 'bg-white dark:bg-zinc-600 text-gray-400 dark:text-gray-500 shadow-sm'"
                  >
                   <IconFluentCheckmark12Regular v-if="item" />
                   <span v-else>{{ ['一','二','三','四','五','六','日'][i] }}</span>
                  </div>
              </div>
            </div>
          </div>

          <!-- Statistics Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
             <div class="stat-card group">
                <div class="stat-icon bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400">
                   <IconFluentTimer24Regular />
                </div>
                <div>
                   <div class="stat-value group-hover:text-blue-600 dark:group-hover:text-blue-400">{{ todayTotalSpend }}</div>
                   <div class="stat-label">今日學習時長</div>
                </div>
             </div>
             
             <div class="stat-card group">
                <div class="stat-icon bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400">
                   <IconFluentCalendarLtr24Regular />
                </div>
                 <div>
                   <div class="stat-value group-hover:text-purple-600 dark:group-hover:text-purple-400">{{ totalDay }}</div>
                   <div class="stat-label">總學習天數</div>
                 </div>
             </div>

             <div class="stat-card group">
                <div class="stat-icon bg-teal-50 dark:bg-teal-900/30 text-teal-500 dark:text-teal-400">
                   <IconFluentClock24Regular />
                </div>
                 <div>
                   <div class="stat-value group-hover:text-teal-600 dark:group-hover:text-teal-400">{{ totalSpend }}</div>
                   <div class="stat-label">總學習時長</div>
                 </div>
             </div>
          </div>

          <!-- Progress & Action -->
          <div class="flex flex-col sm:flex-row gap-5 items-center mt-auto bg-gray-50 dark:bg-zinc-700/30 rounded-xl p-4 border border-gray-100 dark:border-zinc-700">
            <div class="flex-1 w-full pl-2">
               <div class="flex justify-between text-sm mb-2">
                 <span class="text-gray-600 dark:text-gray-300 font-medium">當前進度</span>
                 <span class="text-primary font-bold">{{ base.sbook?.lastLearnIndex || 0 }} / {{ base.sbook?.length || 0 }} 篇</span>
               </div>
               <Progress 
                  class="w-full"
                  size="large"
                  :percentage="base.currentBookProgress"
                  :show-text="false"
               />
            </div>
            
            <div class="w-full sm:w-auto flex items-center gap-3">
               <button 
                v-if="base.sbook.id" 
                class="button-text text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium mr-2"
                @click="router.push('/book-list')"
               >
                 更換書籍
               </button>
               
               <BaseButton 
                size="large" 
                class="w-full sm:w-auto !rounded-lg !px-8 shadow-lg shadow-blue-500/20"
                @click="startStudy"
                :disabled="!base.sbook.name">
                  <div class="flex items-center gap-2 justify-center w-full font-bold">
                    <span>{{ isSaveData ? '繼續學習' : '開始學習' }}</span>
                    <IconFluentArrowRight24Filled />
                  </div>
              </BaseButton>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- My Books Section -->
    <div class="mb-12">
      <div class="flex justify-between items-end mb-6">
        <div>
          <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
             <IconFluentBook24Regular class="text-primary"/>
             我的書籍
          </h3>
        </div>
        <div class="flex gap-4 items-center">
            
            <transition name="fade">
              <div v-if="selectIds.length" class="flex gap-2 items-center bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full text-red-600 text-sm">
                <span>已選 {{ selectIds.length }} 本</span>
                 <PopConfirm title="確認刪除所有選中書籍？" @confirm="handleBatchDel">
                    <span class="cursor-pointer hover:underline font-bold">刪除</span>
                 </PopConfirm>
              </div>
            </transition>

           <div class="h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-1" v-if="base.article.bookList.length > 1"></div>

          <div class="color-link cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 text-sm font-medium" v-if="base.article.bookList.length > 1"
               @click="isMultiple = !isMultiple; selectIds = []">
               <IconFluentEdit16Regular />
               {{ isMultiple ? '取消管理' : '管理書籍' }}
          </div>
          
           <div class="color-link cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 text-sm font-medium" 
                @click="nav('book-detail', { isAdd: true })">
                <IconFluentAddCircle20Regular />
                創建書籍
           </div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
        <div v-for="(item, j) in base.article.bookList" :key="item.id" class="relative group">
           <Book 
              :is-add="false"
              :is-user="true"
              quantifier="篇"
              :item="item"
              :checked="selectIds.includes(item.id)"
              @check="() => toggleSelect(item)"
              :show-checkbox="isMultiple && j >= 1"
              class="h-full"
              @click="goBookDetail(item)"/>
        </div>
        
        <Book :is-add="true" @click="router.push('/book-list')" class="h-full opacity-70 hover:opacity-100 hover:scale-[1.02] transition-all"/>
      </div>
    </div>

    <!-- Recommended Section -->
    <div class="mb-12" v-loading="isFetching">
      <div class="flex justify-between items-end mb-6">
        <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
           <IconFluentThumbLike24Regular class="text-amber-500"/>
           推薦閱讀
        </h3>
        <div class="flex gap-4 items-center">
          <div class="color-link cursor-pointer flex items-center gap-1 hover:translate-x-1 transition-transform" @click="router.push('/book-list')">
            更多
            <IconFluentChevronRight12Regular />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
        <Book :is-add="false"
              quantifier="篇"
              :item="item as any"
              class="h-full"
              v-for="(item, j) in recommendBookList" 
              :key="j"
              @click="goBookDetail(item as any)"/>
      </div>
    </div>
  </BasePage>
</template>

<style scoped lang="scss">
// Custom transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Utility classes for readability
.text-primary {
  @apply text-[#409eff];
}

.bg-primary {
  @apply bg-[#409eff];
}

.stat-card {
  @apply bg-gray-50 dark:bg-zinc-700/30 rounded-xl p-4 flex items-center gap-4 border border-transparent transition-all duration-300;
  
  &:hover {
    @apply bg-white dark:bg-zinc-700 border-gray-100 dark:border-zinc-600 shadow-sm;
  }
}

.stat-icon {
  @apply w-12 h-12 rounded-full flex items-center justify-center text-xl transition-transform duration-300;
  
  .group-hover & {
    @apply scale-110;
  }
}

.stat-value {
  @apply text-xl font-bold text-gray-800 dark:text-gray-100 transition-colors;
  font-family: 'Outfit', sans-serif; // Assuming you might have a different font for numbers
}

.stat-label {
  @apply text-xs text-gray-500 dark:text-gray-400 mt-0.5;
}

.button-text {
  @apply outline-none transition-colors;
}
</style>
