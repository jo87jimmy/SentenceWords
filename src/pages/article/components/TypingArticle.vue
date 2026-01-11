<script setup lang="ts">
import {ref,computed,inject, onMounted, onUnmounted, watch} from "vue"
import {type Article, type ArticleWord, PracticeArticleWordType, type Sentence, ShortcutKey, type Word} from "@/types/types.ts";
import {useBaseStore} from "@/stores/base.ts";
import {useSettingStore} from "@/stores/setting.ts";
import {usePlayBeep, usePlayKeyboardAudio, usePlayWordAudio} from "@/hooks/sound.ts";
import {emitter, EventKey, useEvents} from "@/utils/eventBus.ts";
import {_dateFormat, _nextTick, isMobile, msToHourMinute, total} from "@/utils";
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'
import BaseButton from "@/components/BaseButton.vue";
import QuestionForm from "@/pages/article/components/QuestionForm.vue";
import {getDefaultArticle, getDefaultWord} from "@/types/func.ts";
import Toast from '@/components/base/toast/Toast.ts'
import TypingWord from "@/pages/article/components/TypingWord.vue";
import Space from "@/pages/article/components/Space.vue";
import {useWordOptions} from "@/hooks/dict.ts";
import nlp from "compromise/three";
import {nanoid} from "nanoid";
import {usePracticeStore} from "@/stores/practice.ts";
import {PracticeSaveArticleKey} from "@/config/env.ts";

// 定義組件的 Props 介面
interface IProps {
  article: Article, // 文章數據
  sectionIndex?: number, // 當前段落索引
  sentenceIndex?: number, // 當前句子索引
  wordIndex?: number, // 當前單詞索引
  stringIndex?: number, // 當前字元索引
}

// 設置 Props 默認值
const props = withDefaults(defineProps<IProps>(), {
  article: () => getDefaultArticle(), // 默認文章對象
  sectionIndex: 0, // 默認段落索引
  sentenceIndex: 0, // 默認句子索引
  wordIndex: 0, // 默認單詞索引
  stringIndex: 0, // 默認字元索引
})

// 定義組件發出的事件
const emit = defineEmits<{
  ignore: [], // 忽略單詞事件
  wrong: [val: Word], // 輸入錯誤事件，傳遞單詞對象
  play: [val: {
    sentence: Sentence,
    handle: boolean
  }], // 播放音頻事件
  nextWord: [val: ArticleWord], // 切換到下一個單詞事件
  complete: [], // 練習完成事件
  next: [], // 切換下一篇事件
  replay: [], // 重播事件
}>()

// --- Refs 定義 (DOM 元素與響應式數據) ---
let typeArticleRef = ref<HTMLDivElement | null>(null) // 文章容器 DOM 引用
let mobileInputRef = ref<HTMLInputElement | null>(null) // 移動端隱藏輸入框 DOM 引用
let articleWrapperRef = ref<HTMLDivElement | null>(null) // 文章內容 DOM 引用

// --- 練習進度狀態變量 ---
let sectionIndex = ref(0) // 當前段落索引
let sentenceIndex = ref(0) // 當前句子索引
let wordIndex = ref(0) // 當前單詞索引
let stringIndex = ref(0) // 當前字元索引
let input = ref('') // 用戶當前輸入的內容
let wrong = ref('') // 用戶輸入錯誤的內容
// 是否處於等待輸入空格的狀態
let isSpace = ref(false)
// 是否練習結束
let isEnd = ref(false)

// --- 介面狀態 ---
// 懸停高亮索引
let hoverIndex = ref({
  sectionIndex: -1,
  sentenceIndex: -1,
  wordIndex: -1,
})
// 當前光標位置
let cursor = ref({
  top: 0,
  left: 0,
})

// 計算當前進度的唯一標識字串
const currentIndex = computed(() => {
  return `${sectionIndex.value}${sentenceIndex.value}${wordIndex.value}`
})

// --- Hooks & Stores ---
const playBeep = usePlayBeep() // 錯誤音效 Hook
const playKeyboardAudio = usePlayKeyboardAudio() // 鍵盤音效 Hook
const playWordAudio = usePlayWordAudio() // 單詞發音 Hook

const {
  toggleWordCollect, // 切換單詞收藏功能
} = useWordOptions()

const store = useBaseStore() // 基礎 Store
const settingStore = useSettingStore() // 設置 Store
const statStore = usePracticeStore() // 統計 Store
const isMob = isMobile() // 是否為移動設備

// --- Watchers (監聽器) ---

// 監聽進度變化，保存練習狀態到 localStorage 並更新光標位置
watch([() => sectionIndex.value, () => sentenceIndex.value, () => wordIndex.value, () => stringIndex.value], ([a, b, c,]) => {
  localStorage.setItem(PracticeSaveArticleKey.key, JSON.stringify({
    version: PracticeSaveArticleKey.version,
    val: {
      practiceData: {
        sectionIndex: sectionIndex.value,
        sentenceIndex: sentenceIndex.value,
        wordIndex: wordIndex.value,
        stringIndex: stringIndex.value,
        id: props.article.id
      },
      statStoreData: statStore.$state,
    }
  }))
  checkCursorPosition(a, b, c)
})

// 監聽翻譯開關，重新計算翻譯位置和光標位置
watch(() => settingStore.translate, () => {
  checkTranslateLocation().then(() => checkCursorPosition())
})

// 監聽結束狀態，自動滾動到底部或頂部
watch(() => isEnd, n => {
  if (n) {
    _nextTick(() => {
      typeArticleRef.value?.scrollTo({top: typeArticleRef.value.scrollHeight, behavior: "smooth"})
    })
  } else {
    typeArticleRef.value?.scrollTo({top: 0, behavior: "smooth"})
  }
})

// --- 初始化函數 ---
function init() {
  if (!props.article.id) return // 無文章 ID 則不執行
  isSpace.value = isEnd.value = false // 重置狀態
  // 嘗試從 localStorage 獲取上次練習進度
  let d = localStorage.getItem(PracticeSaveArticleKey.key)
  if (d) {
    try {
      let obj = JSON.parse(d)
      let data = obj.val
      statStore.$patch(data.statStoreData)
      // 恢復進度跳轉
      jump(data.practiceData.sectionIndex, data.practiceData.sentenceIndex, data.practiceData.wordIndex)
    } catch (e) {
      // 解析失敗則清除存檔並重新初始化
      localStorage.removeItem(PracticeSaveArticleKey.key)
      init()
    }
  } else {
    // 無存檔，重置所有輸入狀態
    wrong.value = input.value = ''
    sectionIndex.value = 0
    sentenceIndex.value = 0
    wordIndex.value = 0
    stringIndex.value = 0
    // 遍歷清除所有單詞的輸入緩存
    props.article.sections.forEach((v) => {
      v.forEach((w) => {
        w.words.forEach(s => {
          s.input = ''
        })
      })
    })
    typeArticleRef.value?.scrollTo({top: 0, behavior: "smooth"})
  }
  // 設置初始焦點與播放
  _nextTick(() => {
    const sentence = props.article.sections[sectionIndex.value]?.[sentenceIndex.value]
    if (sentence) {
      emit('play', {sentence, handle: false})
    }
    // 如果是特殊單詞(如人名)則自動跳過
    if (isNameWord()) next()
  })
  checkTranslateLocation().then(() => checkCursorPosition())
  focusMobileInput()
}

// 檢查並更新光標位置，處理滾動
function checkCursorPosition(a = sectionIndex.value, b = sentenceIndex.value, c = wordIndex.value) {
  // console.log('checkCursorPosition')
  _nextTick(() => {
    // 選中當前單詞元素
    const currentWord = document.querySelector(`.section:nth-of-type(${a + 1}) .sentence:nth-of-type(${b + 1}) .word:nth-of-type(${c + 1})`);
    if (currentWord) {
      // 在 currentWord 內查找 .word-end 標記
      const end = currentWord.querySelector('.word-end');
      if (end) {
        // 獲取容器位置
        const articleRect = articleWrapperRef.value?.getBoundingClientRect();
        if (!articleRect) return;
        const endRect = end.getBoundingClientRect();
        // 如果當前輸入位置大於屏幕高度的 70%，則向下滾動屏幕的 30%
        if (endRect.y > window.innerHeight * 0.7) {
          typeArticleRef.value?.scrollTo({top: (typeArticleRef.value?.scrollTop ?? 0) + window.innerHeight * 0.3, behavior: "smooth"})
        }
        // 計算並設置光標的相對 top/left
        cursor.value = {
          top: endRect.top - articleRect.top,
          left: endRect.left - articleRect.left,
        };
      }
    }
  },)
}

// 檢查並更新翻譯文本的位置 (桌面端)
function checkTranslateLocation() {
  // console.log('checkTranslateLocation')
  return new Promise<void>(resolve => {
    if (isMob) {
      resolve()
      return
    }
    _nextTick(() => {
      let articleRect = articleWrapperRef.value?.getBoundingClientRect()
      if (!articleRect) {
        resolve()
        return
      }
      props.article.sections.map((v, i) => {
        v.map((w, j) => {
          let location = i + '-' + j
          let wordClassName = `.word${location}`
          let word = document.querySelector(wordClassName)
          if (!word) return
          let wordRect = word.getBoundingClientRect()
          let translateClassName = `.translate${location}`
          let translate: HTMLDivElement | null = document.querySelector(translateClassName)
          if (!translate) return
          translate.style.opacity = '1'
          translate.style.top = wordRect.top - articleRect.top + wordRect.height + 'px'
          // @ts-ignore
          // translate.firstChild.style.width = wordRect.left - articleRect.left + 'px'
          // console.log(word, wordRect.left - articleRect.left)
          // console.log('word-wordRect', wordRect)
        })
      })
      resolve()
    }, 300)
  })
}

// 聚焦移動端隱藏輸入框 (確保鍵盤彈出)
function focusMobileInput() {
  if (!isMob) return
  mobileInputRef.value?.focus()
}

// 處理移動端字符輸入邏輯
function processMobileCharacter(char: string) {
  if (!char) return
  // 映射字符到鍵盤 KeyCode
  const code = char === ' ' ? 'Space' : char === '\n' ? 'Enter' : `Key${char.toUpperCase()}`
  const fakeEvent = {
    key: char,
    code,
    preventDefault() {
    },
    stopPropagation() {
    },
  } as unknown as KeyboardEvent
  onTyping(fakeEvent)
}

// 監聽移動端 input 事件
function handleMobileInput(event: Event) {
  if (!isMob) return
  const target = event.target as HTMLInputElement
  const value = target?.value ?? ''
  if (!value) return
  for (const char of value) {
    processMobileCharacter(char)
  }
  target.value = ''
}

// 監聽移動端 beforeinput 事件 (處理刪除)
function handleMobileBeforeInput(event: InputEvent) {
  if (!isMob) return
  if (event.inputType === 'deleteContentBackward') {
    event.preventDefault()
    del()
  }
}

// 字符串標準化
const normalize = (s: string) => s.toLowerCase().trim()
// 構建特殊名稱/頭銜列表
const namePatterns = computed(() => {
  return Array.from(new Set((props.article?.nameList ?? []).map(normalize).filter(Boolean).map(s => s.split(/\s+/).filter(Boolean)).flat().concat([
    'Mr', 'Mrs', 'Ms', 'Dr', 'Miss',
  ].map(normalize))))
})

// 判斷是否為特殊名稱 (需自動跳過)
const isNameWord = () => {
  let currentSection = props.article.sections[sectionIndex.value]
  if (!currentSection) return false
  let currentSentence = currentSection[sentenceIndex.value]
  if (!currentSentence) return false
  let w = currentSentence.words[wordIndex.value]
  if (!w) return false
  return w.type === PracticeArticleWordType.Word && namePatterns.value.length > 0 && namePatterns.value.includes(normalize(w.word))
}

let isTyping = false
// 專用鎖，防止 nextSentence 被重複調用
let lock = false

// 切換到下一個句子
function nextSentence() {
  if (lock || isEnd.value) return
  checkTranslateLocation()
  lock = true
  let currentSection = props.article.sections[sectionIndex.value]
  if (!currentSection) {
    lock = false
    return
  }
  let currentSentence = currentSection[sentenceIndex.value]
  if (!currentSentence) {
    lock = false
    return
  }
  // 補全未輸入的單詞內容，確保完整顯示
  currentSentence.words.forEach((word) => {
    word.input = word.input + word.word.slice(word.input?.length ?? 0)
  })

  //todo 記得把略過的單詞加上統計裡面去
  // if (!store.allIgnoreWords.includes(currentWord.word.toLowerCase()) && currentWord.type === PracticeArticleWordType.Word) {
  //   statisticsStore.inputNumber++
  // }
  isSpace.value = false;
  input.value = wrong.value = ''
  stringIndex.value = 0;
  wordIndex.value = 0
  sentenceIndex.value++
  // 檢查是否還有下一句
  if (!currentSection[sentenceIndex.value]) {
    // 當前段落結束，進入下一段
    sentenceIndex.value = 0
    sectionIndex.value++
    // 檢查是否還有下一段
    if (!props.article.sections[sectionIndex.value]) {
      console.log('練習結束')
      isEnd.value = true
      emit('complete')
    } else {
      // 處理下一段的開始
      if (isNameWord()) next()
      const sentence = props.article.sections[sectionIndex.value]?.[0]
      if (sentence) {
        emit('play', {sentence, handle: false})
      }
    }
  } else {
    // 進入當前段落的下一句
    if (isNameWord()) next()
    const sentence = currentSection?.[sentenceIndex.value]
    if (sentence) {
      emit('play', {sentence, handle: false})
    }
  }
  lock = false
  focusMobileInput()
}

// 切換到下一個單詞
const next = () => {
  isSpace.value = false;
  input.value = wrong.value = ''
  stringIndex.value = 0;

  let currentSection = props.article.sections[sectionIndex.value]
  if (!currentSection) return
  let currentSentence = currentSection[sentenceIndex.value]
  if (!currentSentence) return
  let currentWord = currentSentence.words[wordIndex.value]
  if (!currentWord) return

  // 檢查下一個單詞是否存在
  if (wordIndex.value + 1 < currentSentence.words.length) {
    wordIndex.value++;
    currentWord = currentSentence.words[wordIndex.value]
    // 補全跳過單詞的輸入狀態
    currentSentence.words.slice(0, wordIndex.value).forEach((word, i) => {
      word.input = word.input + word.word.slice(word.input?.length ?? 0)
    })
    if (!currentWord) return
    // 如果是符號或數字且設置了忽略，則遞歸跳過
    if ([PracticeArticleWordType.Symbol, PracticeArticleWordType.Number].includes(currentWord.type) && settingStore.ignoreSymbol) {
      next()
    } else if (isNameWord()) { // 特殊單詞跳過
      next()
    } else {
      emit('nextWord', currentWord);
    }
  } else {
    // 無下一個單詞，切換句子
    nextSentence()
  }
}

// 鍵盤輸入事件處理 (核心邏輯)
function onTyping(e: KeyboardEvent) {
  // debugger
  if (!props.article.sections.length) return
  if (isTyping || isEnd.value) return;
  isTyping = true;
  // console.log('keyDown', e.key, e.code, e.keyCode)
  try {
    let currentSection = props.article.sections[sectionIndex.value]
    if (!currentSection) return
    let currentSentence = currentSection[sentenceIndex.value]
    if (!currentSentence) return
    let currentWord = currentSentence.words[wordIndex.value]
    if (!currentWord) return
    wrong.value = ''

    // 處理空格階段
    if (isSpace.value) {
      if (e.code === 'Space') {
        next() // 輸入正確，切換單詞
      } else {
        // 如果在單詞結尾未按空格直接輸入下一個字母
        // 舊邏輯：next(); isTyping = false; onTyping(e);
        // 新邏輯：提示錯誤
        wrong.value = ' '
        playBeep()
      }
    } else {
      // 處理普通字符階段
      let letter = e.key
      let key = currentWord.word[stringIndex.value]
      if (!key) return

      let isRight = false
      // 判斷是否忽略大小寫
      if (settingStore.ignoreCase) {
        isRight = key.toLowerCase() === letter.toLowerCase()
      } else {
        isRight = key === letter
      }
      
      // 輸入錯誤處理
      if (!isRight) {
        if (currentWord.type === PracticeArticleWordType.Word) {
          emit('wrong', currentWord)
        }
        playBeep()
      }

      // 更新輸入
      input.value += letter
      currentWord.input = input.value
      stringIndex.value++
      
      // 單詞輸入完畢檢查
      if (!currentWord.word[stringIndex.value]) {
        input.value = ''
        if (currentWord.nextSpace) {
          isSpace.value = true // 需要輸入空格
        } else {
          next() // 無需空格，直接下一個
        }
      }
    }
    playKeyboardAudio()
    e.preventDefault()
  } catch (e) {
    //todo 異常上報
    localStorage.removeItem(PracticeSaveArticleKey.key)
    init()
  } finally {
    isTyping = false
  }
}

// 播放當前句子
function play() {
  const sentence = props.article.sections[sectionIndex.value]?.[sentenceIndex.value]
  if (sentence) {
    emit('play', {sentence, handle: true})
  }
}

// 刪除 (Backspace) 邏輯
function del() {
  if (wrong.value) {
    wrong.value = '' // 僅清除錯誤提示
  } else {
    if (isEnd.value) return;
    if (isSpace.value) {
      isSpace.value = false // 取消等待空格
    }
    let endSentence = false
    let endWord = false
    let endString = false
    // 判斷刪除邊界
    if (stringIndex.value === 0) {
      if (wordIndex.value === 0) {
        if (sentenceIndex.value === 0) {
          if (sectionIndex.value === 0) {
            return // 文章開頭，無法刪除
          } else {
            endSentence = endString = endWord = true
            sectionIndex.value--
          }
        } else {
          endString = endWord = true
          sentenceIndex.value--
        }
      } else {
        endString = true
        wordIndex.value--
      }
    } else stringIndex.value--
    
    // 更新狀態到上一個位置
    let currentSection = props.article.sections[sectionIndex.value]
    if (!currentSection) return
    if (endSentence) sentenceIndex.value = currentSection.length - 1
    let currentSentence = currentSection[sentenceIndex.value]
    if (!currentSentence) return
    if (endWord) wordIndex.value = currentSentence.words.length - 1
    let currentWord = currentSentence.words[wordIndex.value]
    if (!currentWord) return
    
    // 恢復光標和輸入狀態
    if (endString) {
      checkTranslateLocation()
      if (currentWord.nextSpace) {
        isSpace.value = true
        stringIndex.value = currentWord.word.length
      } else {
        stringIndex.value = currentWord.word.length - 1
      }
    }
    input.value = currentWord.input = currentWord.input.slice(0, stringIndex.value)
    checkCursorPosition()
    focusMobileInput()
  }
}

// 顯示句子高亮
function showSentence(i1: number = sectionIndex.value, i2: number = sentenceIndex.value, i3: number = wordIndex.value) {
  hoverIndex.value = {sectionIndex: i1, sentenceIndex: i2, wordIndex: i3}
}

// 隱藏句子高亮
function hideSentence() {
  hoverIndex.value = {sectionIndex: -1, sentenceIndex: -1, wordIndex: -1}
}

// 跳轉到指定位置 (點擊等操作)
function jump(i: number, j: number, w: number, sentence?: Sentence) {
  sectionIndex.value = i
  sentenceIndex.value = j
  //todo 這裡是符號的處理
  wordIndex.value = w
  stringIndex.value = 0
  input.value = wrong.value = ''
  isEnd.value = isSpace.value = false
  // 重置輸入狀態：之前的設為完成，之後的設為空
  props.article.sections.map((v, i) => {
    v.map((w, j) => {
      w.words.map((v, k) => {
        if (i <= sectionIndex.value && j <= sentenceIndex.value && k < wordIndex.value) {
          v.input = v.word
        } else {
          v.input = ''
        }
      })
    })
  })
  if (sentence) {
    emit('play', {sentence: sentence, handle: false})
  }
}

// 右鍵菜單處理
function onContextMenu(e: MouseEvent, sentence: Sentence, i: number, j: number, w: number) {
  const selectedText = window.getSelection()?.toString() ?? '';
  console.log(selectedText);
  // 阻止瀏覽器默認菜單
  e.preventDefault();
  // 顯示自定義菜單
  ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    items: [
      {
        label: "收藏單詞",
        onClick: () => {
          const section = props.article.sections[i]
          if (!section) return
          const sentence = section[j]
          if (!sentence) return
          let word = sentence.words[w]
          if (!word) return
          let text = word.word
          let doc = nlp(text)
          // 優先判斷是否為動詞 (轉為不定式)
          if (doc.verbs().found) {
            text = doc.verbs().toInfinitive().text()
          }
          // 如果是名詞 (轉為單數)
          if (doc.nouns().found) {
            text = doc.nouns().toSingular().text()
          }
          if (!text.length) text = word.word
          console.log('text', text)
          toggleWordCollect(getDefaultWord({word: text, id: nanoid()}))
          Toast.success(text + ' 添加成功')
        }
      },
      {
        label: "複製",
        children: [
          {
            label: "複製句子",
            onClick: () => {
              navigator.clipboard.writeText(sentence.text).then(r => {
                Toast.success('已複製')
              })
            }
          },
          {
            label: "複製單詞",
            onClick: () => {
              const section = props.article.sections[i]
              if (!section) return
              const sentence = section[j]
              if (!sentence) return
              const word = sentence.words[w]
              if (!word) return
              navigator.clipboard.writeText(word.word).then(r => {
                Toast.success('已複製')
              })
            }
          }
        ]
      },
      {
        label: "從這開始",
        onClick: () => {
          jump(i, j, w + 1, sentence)
        }
      },
      {
        label: "播放句子",
        onClick: () => {
          emit('play', {sentence: sentence, handle: true})
        }
      },
      {
        label: "語法分析",
        onClick: () => {
          navigator.clipboard.writeText(sentence.text).then(r => {
            Toast.success('已複製！隨後將打開語法分析網站！')
            setTimeout(() => {
              window.open('https://enpuz.com/')
            }, 1000)
          })
        }
      },
      {
        label: "有道詞典翻譯",
        children: [
          {
            label: "翻譯單詞",
            onClick: () => {
              const section = props.article.sections[i]
              if (!section) return
              const sentence = section[j]
              if (!sentence) return
              const word = sentence.words[w]
              if (!word) return
              window.open(`https://www.youdao.com/result?word=${word.word}&lang=en`, '_blank')
            }
          },
          {
            label: "翻譯句子",
            onClick: () => {
              window.open(`https://www.youdao.com/result?word=${sentence.text}&lang=en`, '_blank')
            }
          },
        ]
      },
    ]
  });
}

// 組件掛載
onMounted(() => {
  emitter.on(EventKey.resetWord, () => {
    wrong.value = input.value = ''
  })
  emitter.on(EventKey.onTyping, onTyping)
  if (isMob) {
    focusMobileInput()
  }
})

// 組件卸載
onUnmounted(() => {
  emitter.off(EventKey.resetWord,)
  emitter.off(EventKey.onTyping, onTyping)
})

// 全局快捷鍵綁定
useEvents([
  [ShortcutKey.KnowWord, onTyping],
  [ShortcutKey.UnknownWord, onTyping],
])

// 暴露內部方法
defineExpose({showSentence, play, del, hideSentence, nextSentence, init})

// 判斷是否為當前處理的單詞
function isCurrent(i: number, j: number, w: number) {
  return `${i}${j}${w}` === currentIndex.value
}

// 顯示題目開關
let showQuestions = ref(false)

// 注入當前練習記錄
const currentPractice = inject<{ startDate: Date; spend: number }[]>('currentPractice', [])

</script>

<template>
  <div class="typing-article" ref="typeArticleRef" @click="focusMobileInput">
    <!-- 移動端隱藏輸入框 -->
    <input
      v-if="isMob"
      ref="mobileInputRef"
      class="mobile-input"
      type="text"
      inputmode="text"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="none"
      @beforeinput="handleMobileBeforeInput"
      @input="handleMobileInput"
    />
    <header class="mb-4">
      <div class="title"><span class="font-family text-3xl">{{
          store.sbook.lastLearnIndex + 1
        }}. </span>{{ props.article?.title ?? '' }}
      </div>
      <div class="titleTranslate" v-if="settingStore.translate">{{ props.article.titleTranslate }}</div>
    </header>

    <div id="article-content" class="article-content"
         :class="[
          settingStore.translate && 'tall',
          settingStore.dictation && 'dictation',
      ]"
         ref="articleWrapperRef">
      <article>
        <!-- 文章打字區域-->
        <div class="section" v-for="(section,indexI) in props.article.sections">
                <span class="sentence"
                      v-for="(sentence,indexJ) in section">
                  <span
                    v-for="(word,indexW) in sentence.words"
                    @contextmenu="e=>onContextMenu(e,sentence,indexI,indexJ,indexW)"
                    class="word"
                    :class="[(sectionIndex>indexI
                        ?'wrote': // 以前的段落
                        (sectionIndex>=indexI &&sentenceIndex>indexJ)
                        ?'wrote' : // 以前的句子
                        (sectionIndex>=indexI &&sentenceIndex>=indexJ && wordIndex>indexW)
                        ?'wrote': // 以前的單詞
                         (sectionIndex>=indexI &&sentenceIndex>=indexJ && wordIndex>=indexW && stringIndex>=word.word.length)
                        ?'wrote': // 當前已完成的單詞
                        ''),
                        indexW === 0 && `word${indexI}-${indexJ}`,
                        ]">
                    <!-- 單詞容器：懸停高亮 -->
                    <span class="word-wrap"
                          @mouseenter="showSentence(indexI,indexJ,indexW)"
                          @mouseleave="hideSentence"
                          :class="[
                           hoverIndex.sectionIndex === indexI && hoverIndex.sentenceIndex === indexJ && hoverIndex.wordIndex === indexW
                          &&'hover-show',
                          word.type === PracticeArticleWordType.Number && 'font-family text-xl'
                          ]"
                          @click="playWordAudio(word.word)"
                    >
                      <!-- 正在輸入的單詞 -->
                      <TypingWord :word="word"
                                  :is-typing="true"
                                  v-if="isCurrent(indexI,indexJ,indexW) && !isSpace"/>
                      <!-- 其他單詞 -->
                      <TypingWord :word="word" :is-typing="false" v-else/>
                      <!-- 聽寫模式底線 -->
                      <span class="border-bottom" v-if="settingStore.dictation"></span>
                    </span>
                   <!-- 空格組件：控制等待或錯誤狀態 -->
                   <Space
                     v-if="word.nextSpace"
                     class="word-end"
                     :is-wrong="false"
                     :is-wait="isCurrent(indexI,indexJ,indexW) && isSpace"
                     :is-shake="isCurrent(indexI,indexJ,indexW) && isSpace && wrong !== ''"
                   />
                  </span>
                  <!-- 移動端句子翻譯 -->
                  <span
                    class="sentence-translate-mobile"
                    v-if="isMob && settingStore.translate && sentence.translate">
                    {{ sentence.translate }}
                  </span>
                </span>
        </div>
      </article>
      <!-- 桌面端翻譯(中文部分)行層 -->
      <div class="translate" v-show="settingStore.translate">
        <template v-for="(v,indexI) in props.article.sections">
          <div class="row"
               :class="[
                   `translate${indexI+'-'+indexJ}`,
                   (sectionIndex>indexI
                        ?'wrote':
                        (sectionIndex>=indexI &&sentenceIndex>indexJ)
                        ?'wrote' :
                        ''),
                        ]"
               v-for="(item,indexJ) in v">
            <span class="space"></span>
            <Transition name="fade">
              <span class="text" v-if="item.translate">{{ item.translate }}</span>
            </Transition>
          </div>
        </template>
      </div>
      <!-- 跟隨光標 -->
      <div class="cursor" v-if="!isEnd" :style="{top:cursor.top+'px',left:cursor.left+'px'}"></div>
    </div>

    <!-- 練習結束操作欄 -->
    <div class="options flex justify-center" v-if="isEnd">
      <BaseButton
        @click="emit('replay')">重新練習
      </BaseButton>
      <BaseButton
        v-if="store.sbook.lastLearnIndex < store.sbook.articles.length - 1"
        @click="emit('next')">下一篇
      </BaseButton>
    </div>

    <!-- 學習記錄列表 -->
    <div class="font-family text-base pr-2 mb-50 mt-10" v-if="currentPractice.length && isEnd">
      <div class="text-2xl font-bold">學習記錄</div>
      <div class="mt-1 mb-3">總學習時長：{{ msToHourMinute(total(currentPractice, 'spend')) }}</div>
      <div class="item border border-item border-solid mt-2 p-2 bg-[var(--bg-history)] rounded-md flex justify-between"
           :class="i === currentPractice.length-1 && 'color-red!'"
           v-for="(item,i) in currentPractice">
        <span :class="i === currentPractice.length-1 ? 'color-red':'color-gray'"
        >{{
            i === currentPractice.length - 1 ? '當前' : i + 1
          }}.&nbsp;&nbsp;{{ _dateFormat(item.startDate) }}</span>
        <span>{{ msToHourMinute(item.spend) }}</span>
      </div>
    </div>

    <!-- 題目區域 (隱藏) -->
    <template v-if="false">
      <div class="center">
        <BaseButton @click="showQuestions =! showQuestions">顯示題目</BaseButton>
      </div>
      <div class="toggle" v-if="showQuestions">
        <QuestionForm :questions="article.questions"
                      :duration="300"
                      :immediateFeedback="false"
                      :randomize="true"
        />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">

.wrote {
  color: grey;
}

$translate-lh: 0.5;
$article-lh: 2.5;

.typing-article {
  height: 100%;
  overflow: auto;
  color: var(--color-article);
  width: var(--article-width);
  font-size: 1.6rem;

  header {
    word-wrap: break-word;
    position: relative;
    padding-top: 3rem;

    .title {
      text-align: center;
      font-size: 2.2rem;
      font-family: var(--en-article-family);
    }

    .titleTranslate {
      @extend .title;
      font-size: 1.2rem;
      margin-top: 0.5rem;
      font-family: var(--zh-article-family);
      font-weight: bold;
    }
  }

  .mobile-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    height: 0;
    width: 0;
  }

  .article-content {
    position: relative;
  }

  .dictation {
    .border-bottom {
      display: inline-block !important; // 強制顯示下劃線
    }
    .translate{
      color: var(--color-reverse-black);
    }
  }

  .tall {
    article {
      line-height: $article-lh;
    }
  }

  article {
    word-break: keep-all;
    word-wrap: break-word;
    white-space: pre-wrap;
    font-family: var(--en-article-family);

    .wrote, .hover-show {
      :deep(.hide) {
        opacity: 1 !important; // 已寫或懸停時顯示隱藏內容
      }

      .border-bottom {
        display: none !important;
      }
    }
    /* 懸停時的單詞高亮樣式 */
    .hover-show {
      border-radius: 0.2rem;
      background-color: #bbf7d0 !important;

      :deep(.hide) {
        opacity: 1 !important;
      }
    }

    .section {
      margin-bottom: 1.5rem;

      .sentence {
        transition: all .3s;
      }

      .word {
        display: inline-block;

        .word-wrap {
          position: relative;
          transition: background-color .3s;
        }

        .border-bottom {
          position: absolute;
          width: 100%;
          height: 100%;
          left: 0;
          top: 0;
          border-bottom: 2px solid var(--color-article);
          display: none;
          transform: translateY(-0.2rem);
        }
      }
    }
  }

  .translate {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    font-size: 1.2rem;
    line-height: $translate-lh;
    letter-spacing: .2rem;
    font-family: var(--zh-article-family);
    font-weight: bold;
    color: #818181;

    .row {
      position: absolute;
      left: 0;
      width: 100%;
      opacity: 0;
      transition: all .3s;

      .space {
        transition: all .3s;
        display: inline-block;
      }
    }
  }
}

.sentence-translate-mobile {
  display: none; // 默認隱藏移動端翻譯
}

// 移動端適配樣式
@media (max-width: 768px) {
  .typing-article {
    width: 100vw;
    max-width: 100%;
    padding: 1rem 0.5rem;

    // 標題優化
    header {
      .title {
        font-size: 1.2rem;
        line-height: 1.4;
        word-break: break-word;
        margin-bottom: 1rem;

        .font-family {
          font-size: 1rem;
        }
      }

      .titleTranslate {
        font-size: 0.9rem;
        margin-top: 0.5rem;
        opacity: 0.8;
      }
    }

    // 句子顯示優化
    .article-content {
      article {
        .section {
          margin-bottom: 1rem;

          .sentence {
            font-size: 1rem;
            line-height: 1.6;
            word-break: break-word;
            margin-bottom: 0.5rem;

            .word {
              .word-wrap {
                padding: 0.1rem 0.05rem;
                min-height: 24px;
                display: inline-flex;
                align-items: center;
              }
            }
          }
        }
      }
    }

    .sentence-translate-mobile {
      display: block; // 移動端顯示翻譯
      margin-top: 0.4rem;
      font-size: 0.9rem;
      line-height: 1.4;
      color: var(--color-font-3);
      font-family: var(--zh-article-family);
      word-break: break-word;
    }

    // 翻譯區域優化
    .translate {
      display: none;
    }

    // 問答表單優化
    .question-form {
      padding: 0.5rem;

      .base-button {
        width: 100%;
        min-height: 48px;
        margin-top: 0.5rem;
      }
    }
  }
}

@media (max-width: 480px) {
  .typing-article {
    padding: 0.5rem 0.3rem;

    header {
      .title {
        font-size: 1rem;

        .font-family {
          font-size: 0.9rem;
        }
      }

      .titleTranslate {
        font-size: 0.8rem;
      }
    }

    .article-content {
      article {
        .section {
          .sentence {
            font-size: 0.9rem;
            line-height: 1.5;
          }
        }
      }
    }

    .sentence-translate-mobile {
      font-size: 0.85rem;
      line-height: 1.35;
    }
  }
}
</style>
