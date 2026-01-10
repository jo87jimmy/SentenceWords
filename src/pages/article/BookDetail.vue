<script setup lang="ts">

import BasePage from "@/components/BasePage.vue";
import BackIcon from "@/components/BackIcon.vue";
import Empty from "@/components/Empty.vue";
import ArticleList from "@/components/list/ArticleList.vue";
import { useBaseStore } from "@/stores/base.ts";
import {type Article,type Dict, DictId, DictType } from "@/types/types.ts";
import { useRuntimeStore } from "@/stores/runtime.ts";
import BaseButton from "@/components/BaseButton.vue";
import { useRoute, useRouter } from "vue-router";
import EditBook from "@/pages/article/components/EditBook.vue";
import { ref,computed, onMounted, nextTick } from "vue";
import { _dateFormat, _getDictDataByUrl, msToHourMinute, resourceWrap, total, useNav } from "@/utils";

import { getDefaultArticle, getDefaultDict } from "@/types/func.ts";
import Toast from "@/components/base/toast/Toast.ts";
import ArticleAudio from "@/pages/article/components/ArticleAudio.vue";
import { MessageBox } from "@/utils/MessageBox.tsx";
import { useSettingStore } from "@/stores/setting.ts";
import { useFetch } from "@vueuse/core";
import { AppEnv, DICT_LIST } from "@/config/env.ts";
import { detail } from "@/apis";

const runtimeStore = useRuntimeStore()
const settingStore = useSettingStore()
const base = useBaseStore()
const router = useRouter()
const route = useRoute()
const {nav} = useNav()

const isEdit = ref(false)
const isAdd = ref(false)
const loading = ref(false)
const studyLoading = ref(false)

const selectArticle = ref<Article>(getDefaultArticle())

function handleCheckedChange(val:any) {
  selectArticle.value = val.item
}

const articleAudioRef = ref()

function handlePlay(val: any) {
  selectArticle.value = val.item
  nextTick(() => {
    console.log('play', articleAudioRef.value)
    articleAudioRef.value?.play()
  })
}

async function addMyStudyList() {
  let sbook = runtimeStore.editDict
  if (!sbook.articles.length) {
    return Toast.warning('沒有文章可學習！')
  }

  studyLoading.value = true
  await base.changeBook(sbook)
  studyLoading.value = false

  window.umami?.track('startStudyArticle', {
    name: sbook.name,
    custom: sbook.custom,
    complete: sbook.complete,
    s:`name:${sbook.name},index:${sbook.lastLearnIndex},title:${sbook.articles[sbook.lastLearnIndex]?.title}`,
  })
  nav('/practice-articles/' + sbook.id)
}

const showBookDetail = computed(() => {
  return !(isAdd.value || isEdit.value);
})

async function init() {
  if (route.query?.isAdd) {
    isAdd.value = true
    runtimeStore.editDict = getDefaultDict()
  } else {
    if (!runtimeStore.editDict.id) {
      await router.push("/articles")
    } else {
      if (!runtimeStore.editDict?.articles?.length
          && !runtimeStore.editDict?.custom
          && ![DictId.articleCollect].includes(runtimeStore.editDict.en_name || runtimeStore.editDict.id)
          && !runtimeStore.editDict?.is_default
      ) {
        loading.value = true
        let r = await _getDictDataByUrl(runtimeStore.editDict, DictType.article)
        runtimeStore.editDict = r
      }

      if (base.article.bookList.find(book => book.id === runtimeStore.editDict.id)) {
        if (AppEnv.CAN_REQUEST) {
          let res = await detail({id: runtimeStore.editDict.id})
          if (res.success) {
            runtimeStore.editDict.statistics = res.data.statistics
            if (res.data.articles.length) {
              runtimeStore.editDict.articles = res.data.articles
            }
          }
        }
      }
      if (runtimeStore.editDict.articles.length) {
        selectArticle.value = runtimeStore.editDict.articles[0] || getDefaultArticle()
      }
      loading.value = false
    }
  }
}

onMounted(init)

function formClose() {
  if (isEdit.value) isEdit.value = false
  else router.back()
}



const {data: book_list} = useFetch(resourceWrap(DICT_LIST.ARTICLE.ALL)).json()

function reset() {
  MessageBox.confirm(
      '繼續此操作會重置所有文章，並從官方書籍獲取最新文章列表，學習記錄不會被重置。確認恢復預設嗎？',
      '恢復預設',
      async () => {
        let dict = book_list.value.find((v: any) => v.url === runtimeStore.editDict.url) as Dict
        if (dict && dict.id) {
          dict = await _getDictDataByUrl(dict, DictType.article)
          let rIndex = base.article.bookList.findIndex(v => v.id === runtimeStore.editDict.id)
          if (rIndex > -1) {
            let item = base.article.bookList[rIndex]
            if (item) {
              item.custom = false
              item.id = dict.id
              item.articles = dict.articles
              if (item.lastLearnIndex >= item.articles.length) {
                item.lastLearnIndex = item.articles.length - 1
              }
              runtimeStore.editDict = item
              Toast.success('恢復成功')
              return
            }
          }
        }
        Toast.error('恢復失敗')
      }
  )
}

const currentPractice = computed(() => {
  if (runtimeStore.editDict.statistics?.length) {
    return runtimeStore.editDict.statistics.filter(v => v.title === selectArticle.value.title)
  }
  return []
})

const totalSpend = computed(() => {
  if (runtimeStore.editDict.statistics?.length) {
    return msToHourMinute(total(runtimeStore.editDict.statistics, 'spend'))
  }
  return 0
})

function next() {
  if (!settingStore.articleAutoPlayNext) return
  let index = runtimeStore.editDict.articles.findIndex(v => v.id === selectArticle.value.id)
  if (index > -1) {
    //如果是最后一个
    if (index === runtimeStore.editDict.articles.length - 1) index = -1
    const nextArticle = runtimeStore.editDict.articles[index + 1]
    if (nextArticle) {
      selectArticle.value = nextArticle
    }
  }
}
</script>

<template>
  <BasePage>
    <div class="h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)] flex flex-col gap-4" v-if="showBookDetail">
      <!-- Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2 shrink-0 border-b border-gray-100 dark:border-zinc-800 pb-4">
        <div class="flex items-center gap-3 w-full md:w-auto">
          <BackIcon class="shrink-0"/>
          <div class="flex flex-col overflow-hidden">
            <h1 class="text-xl md:text-2xl font-bold truncate text-gray-900 dark:text-gray-100">{{ runtimeStore.editDict.name }}</h1>
            <p v-if="totalSpend" class="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">總學習時長：{{ totalSpend }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 w-full md:w-auto justify-end">
           <BaseButton v-if="runtimeStore.editDict.custom && runtimeStore.editDict.url" type="secondary" @click="reset" class="!px-3 !py-1 text-sm">
            恢復預設
          </BaseButton>
          <BaseButton :loading="studyLoading||loading" type="secondary" @click="isEdit = true" class="!px-3 !py-1 text-sm">編輯</BaseButton>
          <BaseButton type="secondary" @click="router.push('batch-edit-article')" class="!px-3 !py-1 text-sm">文章管理</BaseButton>
          <BaseButton :loading="studyLoading||loading" type="primary" @click="addMyStudyList" class="!px-4 !py-1 text-sm font-medium shadow-md shadow-primary/20">學習</BaseButton>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex flex-col md:flex-row flex-1 gap-4 overflow-hidden min-h-0">
        
        <!-- Left Sidebar: Info & List -->
        <aside class="w-full md:w-80 flex flex-col gap-4 shrink-0 overflow-hidden md:h-full h-[40vh]">
          <!-- Book Info Card -->
           <div class="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm shrink-0 flex gap-3 h-32 md:h-auto">
             <img :src="runtimeStore.editDict?.cover" v-if="runtimeStore.editDict?.cover" class="w-20 md:w-24 h-full object-cover rounded-lg bg-gray-100 dark:bg-zinc-800 shrink-0" alt="Book Cover">
             <div class="flex-1 overflow-y-auto custom-scrollbar">
                <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ runtimeStore.editDict.description || '暫無介紹' }}</div>
             </div>
           </div>

           <!-- Article List -->
           <div class="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
              <ArticleList
                  v-if="runtimeStore.editDict.length"
                  class="h-full overflow-y-auto custom-scrollbar"
                  @title="handleCheckedChange"
                  @click="handleCheckedChange"
                  @play="handlePlay"
                  :list="runtimeStore.editDict.articles"
                  :active-id="selectArticle.id">
              </ArticleList>
              <Empty v-else text="暫無文章" />
           </div>
        </aside>

        <!-- Right Content: Article Detail -->
        <section class="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col relative md:h-full h-[60vh]">
           <div class="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth" v-if="selectArticle.id">
              <div class="max-w-3xl mx-auto pb-20">
                <!-- Learning History -->
                <div v-if="currentPractice.length" class="mb-8 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-700/50">
                  <div class="flex justify-between items-center mb-3">
                    <span class="text-sm font-bold text-gray-700 dark:text-gray-200">學習記錄</span>
                    <span class="text-xs text-gray-500 bg-white dark:bg-zinc-700 px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-600">{{ msToHourMinute(total(currentPractice, 'spend')) }}</span>
                  </div>
                  <div class="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    <div v-for="i in currentPractice" :key="i.startDate" class="flex justify-between text-xs text-gray-600 dark:text-gray-400 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors">
                      <span>{{ _dateFormat(i.startDate) }}</span>
                      <span class="font-mono">{{ msToHourMinute(i.spend) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Article Header -->
                <div class="text-center mb-10 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-10 py-4 -mt-4 border-b border-transparent transition-all">
                  <h2 class="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-gray-50 drop-shadow-sm">{{ selectArticle.title }}</h2>
                  <div class="flex justify-center">
                    <ArticleAudio
                        ref="articleAudioRef"
                        :article="selectArticle"
                        :autoplay="settingStore.articleAutoPlayNext"
                        @ended="next"/>
                  </div>
                </div>

                <!-- Article Text -->
                <article class="prose prose-lg dark:prose-invert max-w-none mb-12">
                   <div class="text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-200 font-serif tracking-wide">
                      <p v-for="(t, idx) in selectArticle.text?.split('\n\n')" :key="'text-'+idx" class="mb-6 indent-8 text-justify">{{ t }}</p>
                   </div>
                </article>

                <!-- Translation -->
                <div v-if="selectArticle.textTranslate" class="mt-12 pt-8 border-t border-dashed border-gray-200 dark:border-zinc-700">
                  <h3 class="text-lg font-medium mb-6 text-gray-500 dark:text-gray-400 text-center uppercase tracking-widest">{{ selectArticle.titleTranslate }}</h3>
                  <div class="text-base md:text-lg leading-loose text-gray-500 dark:text-gray-400 font-light">
                     <p v-for="(t, idx) in selectArticle.textTranslate?.split('\n\n')" :key="'trans-'+idx" class="mb-4 indent-8 text-justify">{{ t }}</p>
                  </div>
                </div>
              </div>
           </div>
           
           <div v-else class="h-full flex flex-col items-center justify-center text-gray-400">
              <Empty text="請選擇文章開始學習" />
           </div>
        </section>

      </main>
    </div>

    <!-- Edit/Create Mode -->
    <div class="h-[calc(100vh-2rem)] flex flex-col" v-else>
      <div class="flex justify-between items-center py-4 border-b border-gray-200 dark:border-zinc-700 mb-4 px-2">
         <div class="flex items-center gap-2">
            <BackIcon class="cursor-pointer hover:text-primary transition-colors" @click="isAdd ? $router.back():(isEdit = false)"/>
            <span class="text-xl font-bold">{{ runtimeStore.editDict.id ? '修改' : '建立' }}書籍</span>
         </div>
      </div>
      <div class="flex-1 overflow-auto flex justify-center">
        <div class="w-full max-w-3xl">
           <EditBook
              :is-add="isAdd"
              :is-book="true"
              @close="formClose"
              @submit="isEdit = isAdd = false"
          />
        </div>
      </div>
    </div>
  </BasePage>
</template>

<style scoped lang="scss">
/* Custom Scrollbar for better consistency */
.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.3);
    border-radius: 3px;
    
    &:hover {
      background-color: rgba(156, 163, 175, 0.5);
    }
  }
}

:deep(.prose) {
  min-width: 100%;
}
</style>
