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
import {type DictResource, DictType } from "@/types/types.ts";
import { useRuntimeStore } from "@/stores/runtime.ts";
import BaseIcon from "@/components/BaseIcon.vue";
import Book from "@/components/Book.vue";
import Progress from '@/components/base/Progress.vue';
import Toast from '@/components/base/toast/Toast.ts'
import BaseButton from "@/components/BaseButton.vue";
import PopConfirm from "@/components/PopConfirm.vue";
import { watch } from "vue";
import { getDefaultDict } from "@/types/func.ts";
import DeleteIcon from "@/components/icon/DeleteIcon.vue";
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

let isNewHost = ref(window.location.host === Host)

</script>

<template>
  <BasePage>
    <div class="mb-4" v-if="!isNewHost">
      新域名已啟用，後續請訪問 <a href="https://typewords.cc/words?from_old_site=1">https://typewords.cc</a>。當前
      2study.top 域名將在不久後停止使用
    </div>

    <div class="card flex flex-col md:flex-row justify-between gap-space p-4 md:p-6">
      <div class="">
        <Book
          v-if="base.sbook.id"
          :is-add="false"
          quantifier="篇"
          :item="base.sbook"
          :show-progress="false"
          @click="goBookDetail(base.sbook)"/>
        <Book v-else
              :is-add="true"
              @click="router.push('/book-list')"/>
      </div>
      <div class="flex-1">
        <div class="flex justify-between items-start">
          <div class="flex items-center min-w-0">
            <div class="title mr-4 truncate">本週學習記錄</div>
            <div class="flex gap-4 color-gray">
              <div
                class="w-6 h-6 md:w-8 md:h-8 rounded-md center text-sm md:text-base"
                :class="item ? 'bg-[#409eff] color-white' : 'bg-gray-200'"
                v-for="(item, i) in weekList"
                :key="i"
              >{{ i + 1 }}
              </div>
            </div>
          </div>
          <div class="flex gap-4 items-center" v-opacity="base.sbook.id">
            <div class="color-link cursor-pointer" @click="router.push('/book-list')">更換</div>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 items-center mt-3 gap-space w-full">
          <div
            class="w-full sm:flex-1 rounded-xl p-4 box-border relative bg-[var(--bg-history)] border border-gray-200">
            <div class="text-[#409eff] text-xl font-bold">{{ todayTotalSpend }}</div>
            <div class="text-gray-500">今日學習時長</div>
          </div>
          <div
            class="w-full sm:flex-1 rounded-xl p-4 box-border relative bg-[var(--bg-history)] border border-gray-200">
            <div class="text-[#409eff] text-xl font-bold">{{ totalDay }}</div>
            <div class="text-gray-500">總學習天數</div>
          </div>
          <div
            class="w-full sm:flex-1 rounded-xl p-4 box-border relative bg-[var(--bg-history)] border border-gray-200">
            <div class="text-[#409eff] text-xl font-bold">{{ totalSpend }}</div>
            <div class="text-gray-500">總學習時長</div>
          </div>
        </div>
        <div class="flex gap-3 mt-3">
          <Progress class="w-full md:w-auto"
                    size="large"
                    :percentage="base.currentBookProgress"
                    :format="()=> `${ base.sbook?.lastLearnIndex || 0 }/${base.sbook?.length || 0}篇`"
                    :show-text="true"></Progress>

          <BaseButton size="large" class="w-full md:w-auto"
                      @click="startStudy"
                      :disabled="!base.sbook.name">
            <div class="flex items-center gap-2 justify-center w-full">
              <span class="line-height-[2]">{{ isSaveData ? '繼續學習' : '開始學習' }}</span>
              <IconFluentArrowCircleRight16Regular class="text-xl"/>
            </div>
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="card  flex flex-col">
      <div class="flex justify-between">
        <div class="title">我的書籍</div>
        <div class="flex gap-4 items-center">
          <PopConfirm title="確認刪除所有選中書籍？" @confirm="handleBatchDel" v-if="selectIds.length">
            <BaseIcon class="del" title="刪除">
              <DeleteIcon/>
            </BaseIcon>
          </PopConfirm>

          <div class="color-link cursor-pointer" v-if="base.article.bookList.length > 1"
               @click="isMultiple = !isMultiple; selectIds = []">{{ isMultiple ? '取消' : '管理書籍' }}
          </div>
          <div class="color-link cursor-pointer" @click="nav('book-detail', { isAdd: true })">創建個人書籍</div>
        </div>
      </div>
      <div class="flex gap-4 flex-wrap mt-4">
        <Book :is-add="false"
              :is-user="true"
              quantifier="篇"
              :item="item"
              :checked="selectIds.includes(item.id)"
              @check="() => toggleSelect(item)"
              :show-checkbox="isMultiple && j >= 1"
              v-for="(item, j) in base.article.bookList"
              @click="goBookDetail(item)"/>
        <Book :is-add="true" @click="router.push('/book-list')"/>
      </div>
    </div>

    <div class="card flex flex-col min-h-50" v-loading="isFetching">
      <div class="flex justify-between">
        <div class="title">推薦</div>
        <div class="flex gap-4 items-center">
          <div class="color-link cursor-pointer" @click="router.push('/book-list')">更多</div>
        </div>
      </div>

      <div class="flex gap-4 flex-wrap  mt-4">
        <Book :is-add="false"
              quantifier="篇"
              :item="item as any"
              v-for="(item, j) in recommendBookList" @click="goBookDetail(item as any)"/>
      </div>
    </div>
  </BasePage>
</template>

<style scoped lang="scss">
.stat {
  @apply rounded-xl p-4 box-border relative flex-1 bg-[var(--bg-history)];
  border: 1px solid gainsboro;

  .num {
    @apply color-[#409eff] text-xl font-bold;
  }

  .txt {
    @apply color-gray-500;
  }
}
</style>
