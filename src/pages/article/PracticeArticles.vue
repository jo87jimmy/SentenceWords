<script setup lang="ts">

import { computed, onMounted, onUnmounted, provide, watch } from "vue";
import { useBaseStore } from "@/stores/base.ts";
import { emitter, EventKey, useEvents } from "@/utils/eventBus.ts";
import { useSettingStore } from "@/stores/setting.ts";
import {
  type Article,
  type ArticleItem,
  type ArticleWord,
  type Dict,
  DictType,
  PracticeArticleWordType,
  ShortcutKey,
  type Statistics,
  type Word
} from "@/types/types.ts";
import { useDisableEventListener, useOnKeyboardEventListener, useStartKeyboardEventListener } from "@/hooks/event.ts";
import useTheme from "@/hooks/theme.ts";
import Toast from '@/components/base/toast/Toast.ts'
import { _getDictDataByUrl, _nextTick, cloneDeep, isMobile, loadJsLib, msToMinute, resourceWrap, total } from "@/utils";
import { usePracticeStore } from "@/stores/practice.ts";
import { useArticleOptions } from "@/hooks/dict.ts";
import { genArticleSectionData, usePlaySentenceAudio } from "@/hooks/article.ts";
import { getDefaultArticle, getDefaultDict, getDefaultWord } from "@/types/func.ts";
import TypingArticle from "@/pages/article/components/TypingArticle.vue";
import BaseIcon from "@/components/BaseIcon.vue";
import Panel from "@/components/Panel.vue";
import ArticleList from "@/components/list/ArticleList.vue";
import EditSingleArticleModal from "@/pages/article/components/EditSingleArticleModal.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import ConflictNotice from "@/components/ConflictNotice.vue";
import { useRoute, useRouter } from "vue-router";
import PracticeLayout from "@/components/PracticeLayout.vue";
import ArticleAudio from "@/pages/article/components/ArticleAudio.vue";
import { AppEnv, DICT_LIST, LIB_JS_URL, PracticeSaveArticleKey, TourConfig } from "@/config/env.ts";
import { addStat, setUserDictProp } from "@/apis";
import { useRuntimeStore } from "@/stores/runtime.ts";
import SettingDialog from "@/components/setting/SettingDialog.vue";
import ArticlesFooter from "@/pages/article/components/ArticlesFooter.vue";
import { ref } from "vue";

const store = useBaseStore()
const runtimeStore = useRuntimeStore()
const settingStore = useSettingStore()
const statStore = usePracticeStore()
const {toggleTheme} = useTheme()

let articleData = ref<{
  list: Article[],
  article: Article
}>({
  list: [],
  article: getDefaultArticle(),
})
let showEditArticle = ref(false)
let typingArticleRef = ref<any>()
let showConflictNotice = ref(false)
let loading = ref<boolean>(false)
let allWrongWords = new Set()
let editArticle = ref<Article>(getDefaultArticle())
let audioRef = ref<HTMLAudioElement>()
let timer: any = 0
let isFocus = true

function write() {
  // console.log('write')
  settingStore.dictation = true
  repeat()
}

//TODO 需要判断是否已忽略
//todo 使用场景是？
function repeat() {
  // console.log('repeat')
  getCurrentPractice()
}

function prev() {
  // console.log('next')
  if (store.sbook.lastLearnIndex === 0) {
    Toast.warning('已经在第一章了~')
  } else {
    store.sbook.lastLearnIndex--
    getCurrentPractice()
  }
}

const toggleShowTranslate = () => settingStore.translate = !settingStore.translate
const toggleDictation = () => settingStore.dictation = !settingStore.dictation
const togglePanel = () => settingStore.showPanel = !settingStore.showPanel
const skip = () => typingArticleRef.value?.nextSentence()
const collect = () => toggleArticleCollect(articleData.value.article)
const shortcutKeyEdit = () => edit()

function toggleConciseMode() {
  settingStore.showToolbar = !settingStore.showToolbar
  settingStore.showPanel = settingStore.showToolbar
}

function next() {
  if (store.sbook.lastLearnIndex >= articleData.value.list.length - 1) {
    store.sbook.complete = true
    store.sbook.lastLearnIndex = 0
    //todo 这里应该弹窗
  } else store.sbook.lastLearnIndex++
  getCurrentPractice()
}

const router = useRouter()
const route = useRoute()

async function init() {
  // console.log('load好了开始加载')
  let dict: Dict | undefined = getDefaultDict()
  let dictId = route.params.id
  if (dictId) {
    //先在自己的词典列表里面找，如果没有再在资源列表里面找
    dict = store.article.bookList.find(v => v.id == dictId)
    let r = await fetch(resourceWrap(DICT_LIST.ARTICLE.ALL))
    let book_list = await r.json()
    if (!dict) dict = book_list.find((v:any) => v.id === dictId) as Dict
    if (dict && dict.id) {
      //如果是不是自定义词典，就请求数据
      if (!dict.custom) dict = await _getDictDataByUrl(dict, DictType.article)
      if (!dict.articles.length) {
        router.push('/articles')
        return Toast.warning('没有文章可学习！')
      }
      await store.changeBook(dict)
      articleData.value.list = cloneDeep(store.sbook.articles)
      getCurrentPractice()
      loading.value = false
    } else {
      router.push('/articles')
    }
  } else {
    router.push('/articles')
  }
}

const initAudio = () => {
  _nextTick(() => {
    if(audioRef.value) {
        audioRef.value.volume = settingStore.articleSoundVolume / 100
        audioRef.value.playbackRate = settingStore.articleSoundSpeed
    }
  })
}

const handleVolumeUpdate = (volume: number) => {
  settingStore.setState({
    articleSoundVolume: volume
  })
}

const handleSpeedUpdate = (speed: number) => {
  settingStore.setState({
    articleSoundSpeed: speed
  })
}

watch([() => store.load, () => loading.value], ([a, b]) => {
  if (a && b) init()
}, {immediate: true})

watch(() => articleData.value?.article?.id, id => {
  if (id) {
    _nextTick(async () => {
      const Shepherd = await loadJsLib('Shepherd', LIB_JS_URL.SHEPHERD);
      const tour = new Shepherd.Tour(TourConfig);
      tour.on('cancel', () => {
        localStorage.setItem('tour-guide', '1');
      });
      tour.addStep({
        id: 'step8',
        text: '这里可以练习文章，只需要按下键盘上对应的按键即可，没有输入框！',
        attachTo: {
          element: '#article-content',
          on: 'auto'
        },
        buttons: [
          {
            text: `关闭`,
            action() {
              settingStore.first = false
              tour.next()
              setTimeout(() => {
                showConflictNotice.value = true
              }, 1500)
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
})

watch(() => settingStore.$state, (n) => {
  initAudio()
}, {immediate: true, deep: true})

onMounted(() => {
  if (store.sbook?.articles?.length) {
    articleData.value.list = cloneDeep(store.sbook.articles)
    getCurrentPractice()
  } else {
    loading.value = true
  }

  if (route.query.guide) {
    showConflictNotice.value = false
  } else {
    showConflictNotice.value = true
  }
})

onUnmounted(() => {
  runtimeStore.disableEventListener = false
  clearInterval(timer)
  savePracticeData(true, false)
})

useStartKeyboardEventListener()
useDisableEventListener(() => loading.value)

function savePracticeData(init = true, regenerate = true) {
  let d = localStorage.getItem(PracticeSaveArticleKey.key)
  if (d) {
    try {
      let obj = JSON.parse(d)
      if (obj.val.practiceData.id !== articleData.value.article.id) {
        throw new Error()
      }
      if (init) {
        let data = obj.val
        //如果全是0，说明未进行练习，直接重置
        if (
          data.practiceData.sectionIndex === 0 &&
          data.practiceData.sentenceIndex === 0 &&
          data.practiceData.wordIndex === 0
        ) {
          throw new Error()
        }
        //初始化时spend为0，把本地保存的值设置给statStore里面，再保存，保持一致。不然每次进来都是0
        statStore.$patch(data.statStoreData)
      }

      obj.val.statStoreData = statStore.$state
      localStorage.setItem(PracticeSaveArticleKey.key, JSON.stringify(obj))
    } catch (e) {
      localStorage.removeItem(PracticeSaveArticleKey.key)
      regenerate && savePracticeData()
    }
  } else {
    localStorage.setItem(PracticeSaveArticleKey.key, JSON.stringify({
      version: PracticeSaveArticleKey.version,
      val: {
        practiceData: {
          sectionIndex: 0,
          sentenceIndex: 0,
          wordIndex: 0,
          stringIndex: 0,
          id: articleData.value.article.id
        },
        statStoreData: statStore.$state,
      }
    }))
  }
}

function setArticle(val: Article) {
  statStore.wrong = 0
  statStore.total = 0
  statStore.startDate = Date.now()
  statStore.spend = 0
  allWrongWords = new Set()
  articleData.value.list[store.sbook.lastLearnIndex] = val
  articleData.value.article = val
  let ignoreList = (settingStore.ignoreSimpleWord ? store.allIgnoreWords : store.knownWords) || []
  articleData.value.article.sections.map((v) => {
    v.map((w) => {
      w.words.map(s => {
        if (!ignoreList.includes(s.word.toLowerCase()) && s.type === PracticeArticleWordType.Word) {
          statStore.total++
        }
      })
    })
  })

  savePracticeData()
  clearInterval(timer)
  timer = setInterval(() => {
    if (isFocus) {
      statStore.spend += 1000
      savePracticeData(false)
    }
  }, 1000)

  _nextTick(() => {
      typingArticleRef.value?.init && typingArticleRef.value.init()
  })
}

async function complete() {
  clearInterval(timer)
  setTimeout(() => {
    localStorage.removeItem(PracticeSaveArticleKey.key)
  }, 1500)

  //todo 有空了改成实时保存
  let data: Partial<Statistics> & { title: string, articleId: number } = {
    articleId: articleData.value.article.id ?? 0,
    title: articleData.value.article.title,
    spend: statStore.spend,
    startDate: statStore.startDate,
    total: statStore.total,
    wrong: statStore.wrong,
  }

  let reportData = {
    name: store.sbook.name,
    index: store.sbook.lastLearnIndex,
    custom: store.sbook.custom,
    complete: store.sbook.complete,
    title: articleData.value.article.title,
    spend: Number(statStore.spend / 1000 / 60).toFixed(1),
    s: ''
  }
  reportData.s = `name:${store.sbook.name},title:${store.sbook.lastLearnIndex}.${data.title},spend:${Number(statStore.spend / 1000 / 60).toFixed(1)}`
  window.umami?.track('endStudyArticle', reportData)

  if (store.sbook.lastLearnIndex >= store.sbook.length - 1) {
    store.sdict.complete = true
  }
  if (AppEnv.CAN_REQUEST) {
    let res = await addStat({
      ...data, type: 'article',
      complete: store.sdict.complete,
    })
    if (!res.success) {
      Toast.error(res.msg)
    }
  }

  store.sbook.statistics.push(data as any)

  //重置
  statStore.wrong = 0
  statStore.startDate = Date.now()
}

function getCurrentPractice() {
  emitter.emit(EventKey.resetWord)
  let currentArticle = articleData.value.list[store.sbook.lastLearnIndex]
  let article = getDefaultArticle(currentArticle)
  if (article.sections.length) {
    setArticle(article)
  } else {
    genArticleSectionData(article)
    setArticle(article)
  }
}

function saveArticle(val: Article) {
  console.log('saveArticle', val, JSON.stringify(val.lrcPosition))
  console.log('saveArticle', val.textTranslate)
  showEditArticle.value = false
  let rIndex = store.sbook.articles.findIndex(v => v.id === val.id)
  if (rIndex > -1) {
    store.sbook.articles[rIndex] = cloneDeep(val)
  }
  setArticle(val)
  store.sbook.custom = true
  if (!store.sbook.id.includes('_custom')) {
    store.sbook.id += '_custom'
  }
}

function edit(val: Article = articleData.value.article) {
  editArticle.value = val
  showEditArticle.value = true
}

function wrong(word: Word) {
  let temp = word.word.toLowerCase();
  //过滤简单词
  if (settingStore.ignoreSimpleWord) {
    if (store.simpleWords.includes(temp)) return
  }
  if (!allWrongWords.has(temp)) {
    allWrongWords.add(temp)
    statStore.wrong++
  }

  if (!store.wrong.words.find((v: Word) => v.word.toLowerCase() === temp)) {
    store.wrong.words.push(getDefaultWord(word))
    store.wrong.length = store.wrong.words.length
  }
}

function nextWord(word: ArticleWord) {
  if (!store.allIgnoreWords.includes(word.word.toLowerCase()) && word.type === PracticeArticleWordType.Word) {
    statStore.inputWordNumber++
  }
}

async function changeArticle(val: ArticleItem) {
  let rIndex = articleData.value.list.findIndex(v => v.id === val.item.id)
  if (rIndex > -1) {
    store.sbook.lastLearnIndex = rIndex
    getCurrentPractice()

    if (AppEnv.CAN_REQUEST) {
      let res = await setUserDictProp(null, store.sbook)
      if (!res.success) {
        Toast.error(res.msg)
      }
    }
  }
  initAudio()
}

const handlePlayNext = (nextArticle: Article) => {
  let rIndex = articleData.value.list.findIndex(v => v.id === nextArticle.id)
  if (rIndex > -1) {
    store.sbook.lastLearnIndex = rIndex
    getCurrentPractice()
  }
}

const {
  isArticleCollect,
  toggleArticleCollect
} = useArticleOptions()

function play() {
  typingArticleRef.value?.play()
}

function show() {
  typingArticleRef.value?.showSentence()
}

function onKeyUp() {
  typingArticleRef.value?.hideSentence()
}

async function onKeyDown(e: KeyboardEvent) {
  switch (e.key) {
    case 'Backspace':
      typingArticleRef.value?.del()
      break
  }
}

useOnKeyboardEventListener(onKeyDown, onKeyUp)

useEvents([
  [EventKey.write, write],
  [EventKey.repeatStudy, repeat],
  [EventKey.continueStudy, next],

  [ShortcutKey.PreviousChapter, prev],
  [ShortcutKey.RepeatChapter, repeat],
  [ShortcutKey.DictationChapter, write],
  [ShortcutKey.ToggleShowTranslate, toggleShowTranslate],
  [ShortcutKey.ToggleDictation, toggleDictation],
  [ShortcutKey.ToggleTheme, toggleTheme],
  [ShortcutKey.ToggleConciseMode, toggleConciseMode],
  [ShortcutKey.TogglePanel, togglePanel],
  [ShortcutKey.NextChapter, next],
  [ShortcutKey.PlayWordPronunciation, play],
  [ShortcutKey.ShowWord, show],
  [ShortcutKey.Next, skip],
  [ShortcutKey.ToggleCollect, collect],
  [ShortcutKey.EditArticle, shortcutKeyEdit],
])


onMounted(() => {
  document.addEventListener('visibilitychange', () => {
    isFocus = !document.hidden
  })
})

onUnmounted(() => {
  timer && clearInterval(timer)
})

const {playSentenceAudio} = usePlaySentenceAudio()

function play2(e: any) {
  _nextTick(() => {
    if (settingStore.articleSound || e.handle) {
      playSentenceAudio(e.sentence, audioRef.value)
    }
  })
}

const currentPractice = computed(() => {
  if (store.sbook.statistics?.length) {
    return store.sbook.statistics.filter((v: any) => v.title === articleData.value.article.title)
  }
  return []
})

provide('currentPractice', currentPractice)
</script>
<template>
  <PracticeLayout
    v-loading="loading"
    panelLeft="var(--article-panel-margin-left)">
    <template v-slot:practice>
      <TypingArticle
        ref="typingArticleRef"
        @wrong="wrong"
        @next="next"
        @nextWord="nextWord"
        @play="play2"
        @replay="setArticle(articleData.article)"
        @complete="complete"
        :article="articleData.article"
      />
    </template>
    <template v-slot:panel>
      <Panel :style="{width:'var(--article-panel-width)'}">
        <template v-slot:title>
          <div class="center gap-space">
            <span>{{
                store.sbook.name
              }} ({{ store.sbook.lastLearnIndex + 1 }} / {{ articleData.list.length }})</span>

            <BaseIcon @click="next" :title="`下一組(${settingStore.shortcutKeyMap[ShortcutKey.NextChapter]})`">
              <IconFluentArrowRight16Regular class="arrow" width="22" />
            </BaseIcon>
          </div>
        </template>
        <div class="panel-page-item pl-4">
          <ArticleList
            :isActive="settingStore.showPanel"
            :static="false"
            :show-translate="settingStore.translate"
            @click="changeArticle"
            :active-id="articleData.article.id??''"
            :list="articleData.list ">
          </ArticleList>
        </div>
      </Panel>
    </template>
    <template v-slot:footer>
      <ArticlesFooter
        :article="articleData.article"
        :is-collect="isArticleCollect(articleData.article)"
        :current-practice="currentPractice"
        @collect="collect"
        @skip="skip"
        @play="play"
        @next="next"
        @update-speed="handleSpeedUpdate"
        @update-volume="handleVolumeUpdate"
      />
    </template>
  </PracticeLayout>

  <EditSingleArticleModal
    v-model="showEditArticle"
    :article="editArticle"
    @save="saveArticle"
  />

  <ConflictNotice v-if="showConflictNotice"/>
</template>

<style scoped lang="scss">
// 移动端适配
@media (max-width: 768px) {
  // 优化练习区域布局
  .practice-article {
    padding-top: 3rem; // 为固定标题留出空间
  }

  // 优化标题区域
  .typing-article {
    header {
      position: fixed;
      top: 4.5rem; // 避开顶部导航栏
      left: 0;
      right: 0;
      z-index: 100;
      background: var(--bg-color);
      padding: 0.5rem 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-bottom: 0;

      .title {
        font-size: 1rem;
        line-height: 1.4;
        word-break: break-word;

        .font-family {
          font-size: 0.9rem;
        }
      }

      .titleTranslate {
        font-size: 0.8rem;
        margin-top: 0.2rem;
        opacity: 0.8;
      }
    }

    .article-content {
      margin-top: 2rem; // 为固定标题留出空间
    }
  }
}
</style>
