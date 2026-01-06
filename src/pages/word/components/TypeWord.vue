<script setup lang="ts">
import {ShortcutKey, type Word, WordPracticeType} from "@/types/types.ts";
import VolumeIcon from "@/components/icon/VolumeIcon.vue";
import {useSettingStore} from "@/stores/setting.ts";
import {usePlayBeep, usePlayCorrect, usePlayKeyboardAudio, usePlayWordAudio} from "@/hooks/sound.ts";
import {emitter, EventKey, useEvents} from "@/utils/eventBus.ts";
import {onMounted, onUnmounted, watch, computed, ref} from "vue";
import SentenceHightLightWord from "@/pages/word/components/SentenceHightLightWord.vue";
import {usePracticeStore} from "@/stores/practice.ts";
import {getDefaultWord} from "@/types/func.ts";
import {_nextTick, last} from "@/utils";
import BaseButton from "@/components/BaseButton.vue";
import Space from "@/pages/article/components/Space.vue";
import Toast from "@/components/base/toast/Toast.ts";

interface IProps {
  word: Word,
}

const props = withDefaults(defineProps<IProps>(), {
  word: () => getDefaultWord(),
})

const emit = defineEmits<{
  complete: [],
  wrong: [],
  know: [],
}>()

const input = ref('')
const wrong = ref('')
const showFullWord = ref(false)
// 輸入鎖定，因為跳轉到下一個單字有延時，如果重複在延時期間內重複輸入，導致會跳轉N次
let inputLock = false
let wordRepeatCount = 0
const cursor = ref({
  top: 0,
  left: 0,
})
const settingStore = useSettingStore()
const statStore = usePracticeStore()

const playBeep = usePlayBeep()
const playCorrect = usePlayCorrect()
const playKeyboardAudio = usePlayKeyboardAudio()
const playWordAudio = usePlayWordAudio()
// const ttsPlayAudio = useTTsPlayAudio()
const volumeIconRef: any = ref()
const typingWordRef = ref<HTMLDivElement>()
// const volumeTranslateIconRef: any = $ref()

const displayWord = computed(() => {
  return props.word.word.slice(input.value.length + wrong.value.length)
})

// 在全域物件中存儲當前單字資訊，以便其他模組可以訪問
function updateCurrentWordInfo() {
  (window as any).__CURRENT_WORD_INFO__ = {
    word: props.word.word,
    input: input.value,
    inputLock: inputLock,
    containsSpace: props.word.word.includes(' ')
  };
}

watch(() => props.word, reset, {deep: true})

function reset() {
  wrong.value = input.value = ''
  wordRepeatCount = 0
  showWordResult.value = inputLock = false
  if (settingStore.wordSound) {
    if (settingStore.wordPracticeType !== WordPracticeType.Dictation) {
      volumeIconRef.value?.play(400, true)
    }
  }
  // 更新當前單字資訊
  updateCurrentWordInfo();
  checkCursorPosition()
}

// 監聽輸入變化，更新當前單字資訊
watch(input, () => {
  updateCurrentWordInfo();
})

onMounted(() => {
  // 初始化當前單字資訊
  updateCurrentWordInfo();

  emitter.on(EventKey.resetWord, reset)
  emitter.on(EventKey.onTyping, onTyping)
})

onUnmounted(() => {
  emitter.off(EventKey.resetWord)
  emitter.off(EventKey.onTyping, onTyping)
})

function repeat() {
  setTimeout(() => {
    wrong.value = input.value = ''
    wordRepeatCount++
    inputLock = false

    if (settingStore.wordSound) volumeIconRef.value?.play()
  }, settingStore.waitTimeForChangeWord)
}

const showWordResult = ref(false)
let pressNumber = 0

const right = computed(() => {
  if (settingStore.ignoreCase) {
    return input.value.toLowerCase() === props.word.word.toLowerCase()
  } else {
    return input.value === props.word.word
  }
})

let showNotice = false

function know(e: any) {
  if (settingStore.wordPracticeType === WordPracticeType.Identify) {
    if (!showWordResult.value) {
      inputLock = true
      showWordResult.value = true
      input.value = props.word.word
      emit('know')
      if (!showNotice) {
        Toast.info('若誤選「我認識」，可按刪除鍵重新選擇！', {duration: 5000})
        showNotice = true
      }
      return
    }
  }
  onTyping(e)
}

function unknown(e: any) {
  if (settingStore.wordPracticeType === WordPracticeType.Identify) {
    if (!showWordResult.value) {
      showWordResult.value = true
      emit('wrong')
      if (settingStore.wordSound) volumeIconRef.value?.play()
      return
    }
  }
  onTyping(e)
}

async function onTyping(e: KeyboardEvent) {
  let word = props.word.word
  // 輸入完成會鎖死不能再輸入
  if (inputLock) {
    // 判斷是否是空白鍵以便切換到下一個單字
    if (e.code === 'Space') {
      // 正確時就切換到下一個單字
      if (right.value) {
        showWordResult.value = inputLock = false
        emit('complete')
      } else {
        if (showWordResult.value) {
          // 錯誤時，提示使用者按刪除鍵，僅默寫需要提示
          pressNumber++
          if (pressNumber >= 3) {
            Toast.info('請按刪除鍵重新輸入', {duration: 2000})
            pressNumber = 0
          }
        }
      }
    } else {
      // 當正確時，提醒使用者按空白鍵切下一個
      if (right.value) {
        pressNumber++
        if (pressNumber >= 3) {
          Toast.info('請按空白鍵繼續', {duration: 2000})
          pressNumber = 0
        }
      } else {
        // 當錯誤時，按任意鍵重新輸入
        showWordResult.value = inputLock = false
        input.value = wrong.value = ''
        onTyping(e)
      }
    }

    return
  }
  inputLock = true
  let letter = e.key
  console.log('letter',letter)
  // 默寫特殊邏輯
  if (settingStore.wordPracticeType === WordPracticeType.Dictation) {
    if (e.code === 'Space') {
      // 如果輸入長度大於單字長度/單字不包含空白，並且輸入不為空（開始直接輸入空白不行），則顯示單字；
      // 這裡 inputLock 不設為 false，不能再輸入了，只能刪除（刪除會重置 inputLock）或按空白鍵切下一格
      if (input.value.length && (input.value.length >= word.length || !word.includes(' '))) {
        // 比對是否一致
        if (input.value.toLowerCase() === word.toLowerCase()) {
          // 如果已顯示單字，則發射完成事件，並 return
          if (showWordResult.value) {
            return emit('complete')
          } else {
            // 未顯示單字，則播放正確音樂，並在後面設置為 showWordResult 為 true 來顯示單字
            playCorrect()
            if (settingStore.wordSound) volumeIconRef.value?.play()
          }
        } else {
          // 錯誤處理
          playBeep()
          if (settingStore.wordSound) volumeIconRef.value?.play()
          emit('wrong')
        }
        showWordResult.value = true
        return
      }
    }
    // 默寫途中不判斷是否正確，在按空白鍵再判斷
    input.value += letter
    wrong.value = ''
    playKeyboardAudio()
    updateCurrentWordInfo();
    inputLock = false
  } else if (settingStore.wordPracticeType === WordPracticeType.Identify && !showWordResult.value) {
    // 當辨認模式下，按1和2會單獨處理，如果按其他鍵則自動默認為不認識
    showWordResult.value = true
    emit('wrong')
    if (settingStore.wordSound) volumeIconRef.value?.play()
    inputLock = false
    onTyping(e)
  } else {
    let _right = false
    if (settingStore.ignoreCase) {
      _right = letter.toLowerCase() === word[input.value.length]?.toLowerCase()
    } else {
      _right = letter === word[input.value.length]
    }
    if (_right) {
      input.value += letter
      wrong.value = ''
      playKeyboardAudio()
    } else {
      emit('wrong')
      wrong.value = letter
      playBeep()
      if (settingStore.wordSound) volumeIconRef.value?.play()
      setTimeout(() => {
        if (settingStore.inputWrongClear) input.value = ''
        wrong.value = ''
      }, 500)
    }
    // 更新當前單字資訊
    updateCurrentWordInfo();
    // 不需要把 inputLock 設為 false，輸入完成不能再輸入了，只能刪除，刪除會打開鎖
    if (input.value.toLowerCase() === word.toLowerCase()) {
      playCorrect()
      if ([WordPracticeType.Listen, WordPracticeType.Identify].includes(settingStore.wordPracticeType) && !showWordResult.value) {
        showWordResult.value = true
      }
      if ([WordPracticeType.FollowWrite, WordPracticeType.Spell].includes(settingStore.wordPracticeType)) {
        if (settingStore.autoNextWord) {
          if (settingStore.repeatCount == 100) {
            if ((settingStore.repeatCustomCount || 1) <= wordRepeatCount + 1) {
              setTimeout(() => emit('complete'), settingStore.waitTimeForChangeWord)
            } else {
              repeat()
            }
          } else {
            if (settingStore.repeatCount <= wordRepeatCount + 1) {
              setTimeout(() => emit('complete'), settingStore.waitTimeForChangeWord)
            } else {
              repeat()
            }
          }
        }
      }
    } else {
      inputLock = false
    }
  }
}

function del() {
  playKeyboardAudio()
  inputLock = false
  if (showWordResult.value) {
    input.value = ''
    showWordResult.value = false
  } else {
    if (wrong.value) {
      wrong.value = ''
    } else {
      input.value = input.value.slice(0, -1)
    }
  }
  // 更新當前單字資訊
  updateCurrentWordInfo();
}

function showWord() {
  if (settingStore.allowWordTip) {
    if (settingStore.wordPracticeType === WordPracticeType.Dictation || settingStore.dictation) {
      emit('wrong')
    }
    showFullWord.value = true
    // 系統設定的預設模式情況下，如果看了單字統計到錯詞裡面去
    switch (statStore.step) {
      case 1:
      case 2:
      case 4:
      case 5:
      case 7:
      case 8:
      case 10:
        emit('wrong')
        break
    }
  }
}

function hideWord() {
  showFullWord.value = false
}

function play() {
  if (settingStore.wordPracticeType === WordPracticeType.Dictation || settingStore.dictation) {
    emit('wrong')
  }
  volumeIconRef.value?.play()
}

defineExpose({del, showWord, hideWord, play})

function mouseleave() {
  setTimeout(() => {
    showFullWord.value = false
  }, 50)
}

// 在釋義中隱藏單字本身及其變形
function hideWordInTranslation(text: string, word: string): string {
  if (!text || !word) {
    return text
  }

  // 建立正規表達式，匹配單字本身及其常見變形（如複數、過去式等）
  const wordBase = word.toLowerCase()
  const patterns = [
    `\\b${escapeRegExp(wordBase)}\\b`,  // 單字本身
    `\\b${escapeRegExp(wordBase)}s\\b`, // 複數形式
    `\\b${escapeRegExp(wordBase)}es\\b`, // 複數形式
    `\\b${escapeRegExp(wordBase)}ed\\b`, // 過去式
    `\\b${escapeRegExp(wordBase)}ing\\b`, // 進行時
  ]

  let result = text
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi')
    result = result.replace(regex, match => `<span class="word-shadow">${match}</span>`)
  })

  return result
}

// 轉義正規表達式特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

watch([input, showFullWord, () => settingStore.dictation], checkCursorPosition)

// 檢測遊標位置
function checkCursorPosition() {
  _nextTick(() => {
    // 選中目標元素
    const cursorEl = document.querySelector(`.cursor`);
    const inputList = document.querySelectorAll(`.l`);
    if (!typingWordRef.value) return; // Add check
    const typingWordRect = typingWordRef.value.getBoundingClientRect();

    if (cursorEl) { // Check if cursorEl exists
      if (inputList.length) {
        let inputRect = last(Array.from(inputList))!.getBoundingClientRect();
        cursor.value = {
          top: inputRect.top + inputRect.height - cursorEl.clientHeight - typingWordRect.top,
          left: inputRect.right - typingWordRect.left - 3,
        };
      } else {
        const dictation = document.querySelector(`.dictation`);
        let elRect
        if (dictation) {
          elRect = dictation.getBoundingClientRect();
        } else {
          const letter = document.querySelector(`.letter`);
          if (letter) {
             elRect = letter.getBoundingClientRect();
          }
        }
        if (elRect) {
            cursor.value = {
              top: elRect.top + elRect.height - cursorEl.clientHeight - typingWordRect.top,
              left: elRect.left - typingWordRect.left - 3,
            };
        }
      }
    }
  },)
}

useEvents([
  [ShortcutKey.KnowWord, know],
  [ShortcutKey.UnknownWord, unknown],
])
</script>

<template>
  <div class="typing-word" ref="typingWordRef" v-if="word.word.length">
    <div class="flex flex-col items-center">
      <div class="flex gap-1 mt-26">
        <div class="phonetic"
             :class="!(!settingStore.dictation || showFullWord || showWordResult) && 'word-shadow'"
             v-if="settingStore.soundType === 'us' && word.phonetic0">[{{ word.phonetic0 }}]
        </div>
        <div class="phonetic"
             :class="((settingStore.dictation || [WordPracticeType.Spell,WordPracticeType.Listen,WordPracticeType.Dictation].includes(settingStore.wordPracticeType)) && !showFullWord && !showWordResult) && 'word-shadow'"
             v-if="settingStore.soundType === 'uk' && word.phonetic1">[{{ word.phonetic1 }}]
        </div>
        <VolumeIcon
          :title="`發音(${settingStore.shortcutKeyMap[ShortcutKey.PlayWordPronunciation]})`"
          ref="volumeIconRef" :simple="true" :cb="() => playWordAudio(word.word)"/>
      </div>

      <div id="word" class="word my-1"
           :class="wrong && 'is-wrong'"
           :style="{fontSize: settingStore.fontSize.wordForeignFontSize +'px'}"
           @mouseenter="showWord"
           @mouseleave="mouseleave"
      >
        <div v-if="settingStore.wordPracticeType === WordPracticeType.Dictation">
          <div class="letter text-align-center w-full inline-block"
               v-opacity="!settingStore.dictation || showWordResult || showFullWord">
            {{ word.word }}
          </div>
          <div
            class="mt-2 w-120 dictation"
            :style="{minHeight: settingStore.fontSize.wordForeignFontSize +'px'}"
            :class="showWordResult ? (right ? 'right' : 'wrong') : ''">
            <template v-for="i in input">
              <span class="l" v-if="i !== ' '">{{ i }}</span>
              <Space class="l" v-else :is-wrong="showWordResult ? (!right) : false" :is-wait="!showWordResult"/>
            </template>
          </div>
        </div>
        <template v-else>
          <span class="input" v-if="input">{{ input }}</span>
          <span class="wrong" v-if="wrong">{{ wrong }}</span>
          <span class="letter" v-if="settingStore.dictation && !showFullWord">
                  {{ displayWord.split('').map((v) => (v === ' ' ? '&nbsp;' : '_')).join('') }}
          </span>
          <span class="letter" v-else>{{ displayWord }}</span>
        </template>
      </div>

      <div class="mt-4 flex gap-4"
           v-if="settingStore.wordPracticeType === WordPracticeType.Identify && !showWordResult">
        <BaseButton
          :keyboard="`快捷鍵(${settingStore.shortcutKeyMap[ShortcutKey.KnowWord]})`"
          size="large" @click="know">我認識
        </BaseButton>
        <BaseButton
          :keyboard="`快捷鍵(${settingStore.shortcutKeyMap[ShortcutKey.UnknownWord]})`"
          size="large" @click="unknown">不認識
        </BaseButton>
      </div>

      <div class="translate  flex flex-col gap-2 my-3"
           v-opacity="settingStore.translate || showWordResult || showFullWord"
           :style="{
      fontSize: settingStore.fontSize.wordTranslateFontSize +'px',
    }"
      >
        <div class="flex" v-for="v in word.trans">
          <div class="shrink-0" :class="v.pos ? 'w-12 en-article-family' : '-ml-3'">{{ v.pos }}</div>
          <span v-if="!settingStore.dictation || showWordResult || showFullWord">{{ v.cn }}</span>
          <span v-else v-html="hideWordInTranslation(v.cn, word.word)"></span>
        </div>
      </div>
    </div>
    <div class="other anim"
         v-opacity="![WordPracticeType.Listen,WordPracticeType.Dictation,WordPracticeType.Identify].includes(settingStore.wordPracticeType) || showFullWord || showWordResult">
      <div class="line-white my-2"></div>
      <template v-if="word?.sentences?.length">
        <div class="flex flex-col gap-3">
          <div class="sentence" v-for="item in word.sentences">
            <SentenceHightLightWord class="text-xl" :text="item.c" :word="word.word"
                                    :dictation="!(!settingStore.dictation || showFullWord || showWordResult)"/>
            <div class="text-base anim" v-opacity="settingStore.translate || showFullWord || showWordResult">
              {{ item.cn }}
            </div>
          </div>
        </div>
        <div class="line-white my-2 mb-5"></div>
      </template>

      <template v-if="word?.phrases?.length">
        <div class="flex">
          <div class="label">短語</div>
          <div class="flex flex-col">
            <div class="flex items-center gap-4" v-for="item in word.phrases">
              <SentenceHightLightWord class="en" :text="item.c" :word="word.word"
                                      :dictation="!(!settingStore.dictation || showFullWord || showWordResult)"/>
              <div class="cn anim" v-opacity="settingStore.translate || showFullWord || showWordResult">
                {{ item.cn }}
              </div>
            </div>
          </div>
        </div>
        <div class="line-white mt-3 mb-2"></div>
      </template>

      <template v-if="(settingStore.translate || !settingStore.dictation)">
        <template v-if="word?.synos?.length">
          <div class="flex">
            <div class='label'>同近義詞</div>
            <div class="flex flex-col gap-3">
              <div class="flex" v-for="item in word.synos">
                <div class="pos line-height-1.4rem!">{{ item.pos }}</div>
                <div>
                  <div class="cn anim" v-opacity="settingStore.translate || showFullWord || showWordResult">
                    {{ item.cn }}
                  </div>
                  <div class="anim" v-opacity="!settingStore.dictation || showFullWord || showWordResult">
                    <span class="en" v-for="(i,j) in item.ws">
                      {{ i }} {{ j !== item.ws.length - 1 ? ' / ' : '' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="line-white my-2"></div>
        </template>
      </template>

      <div class="anim"
           v-opacity="(settingStore.translate && !settingStore.dictation) || showFullWord || showWordResult">
        <template v-if="word?.etymology?.length">
          <div class="flex">
            <div class="label">詞源</div>
            <div class="text-base">
              <div class="mb-2" v-for="item in word.etymology">
                <div class="">{{ item.t }}</div>
                <div class="">{{ item.d }}</div>
              </div>
            </div>
          </div>
          <!--        <div class="line-white my-2"></div>-->
        </template>

        <template v-if="word?.relWords?.root && false">
          <div class="flex">
            <div class="label">同根詞</div>
            <div class="flex flex-col gap-3">
              <div v-if="word.relWords.root" class=" ">
                詞根：<span class="en">{{ word.relWords.root }}</span>
              </div>
              <div class="flex" v-for="item in word.relWords.rels">
                <div class="pos">{{ item.pos }}</div>
                <div>
                  <div class="flex items-center gap-4" v-for="itemj in item.words">
                    <div class="en">{{ itemj.c }}</div>
                    <div class="cn">{{ itemj.cn }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div class="cursor"
         :style="{top:cursor.top+'px',left:cursor.left+'px',height: settingStore.fontSize.wordForeignFontSize +'px'}"></div>
  </div>
</template>

<style scoped lang="scss">
.dictation {
  border-bottom: 2px solid black;
}

.typing-word {
  width: 100%;
  flex: 1;
  overflow: auto;
  word-break: break-word;
  position: relative;
  color: var(--color-font-2);
  padding-bottom: 8rem;

  .phonetic, .translate {
    font-size: 1.2rem;
  }

  .phonetic {
    color: var(--color-font-1);
    font-family: var(--word-font-family);
  }

  .word {
    font-size: 3rem;
    line-height: 1;
    font-family: var(--en-article-family);
    letter-spacing: .3rem;


    .input, .right {
      color: rgb(22, 163, 74);
    }

    .wrong {
      color: rgba(red, 0.6);
    }

    &.is-wrong {
      animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
  }

  .tabs {
    @apply: text-lg font-medium;
    display: flex;
    gap: 2rem;

    .tab {
      cursor: pointer;

      &.active {
        border-bottom: 2px solid var(--color-font-2);
      }
    }
  }

  .label {
    width: 6rem;
    padding-top: 0.2rem;
    flex-shrink: 0;
  }

  .cn {
    @apply text-base;
  }

  .en {
    @apply text-lg;
  }

  .pos {
    font-family: var(--en-article-family);
    @apply text-lg w-12;
  }
}

// 移动端适配
@media (max-width: 768px) {

  .typing-word {
    padding: 0 0.5rem 12rem;
    
    .word {
      font-size: 2rem !important;
      letter-spacing: 0.1rem;
      margin: 0.5rem 0;
    }
    
    .phonetic, .translate {
      font-size: 1rem;
    }
    
    .label {
      width: 4rem;
      font-size: 0.9rem;
    }
    
    .cn {
      font-size: 0.9rem;
    }
    
    .en {
      font-size: 1rem;
    }
    
    .pos {
      font-size: 0.9rem;
      width: 3rem;
    }
    
    // 移动端按钮组调整
    .flex.gap-4 {
      flex-direction: column;
      width: 100%;
      gap: 0.5rem;
      position: relative;
      z-index: 10; // 确保按钮不被其他元素遮挡
      
      .base-button {
        width: 100%;
        min-height: 48px;
        padding: 0.8rem;
        font-size: 1.1rem;
        font-weight: 500;
        cursor: pointer;
      }
    }
    
    // 确保短语和例句区域保持默认层级
    .phrase-section,
    .sentence {
      position: relative;
      z-index: auto;
    }
    
    // 移动端例句和短语调整
    .sentence,
    .phrase {
      font-size: 0.9rem;
      line-height: 1.4;
      margin-bottom: 0.5rem;
      pointer-events: auto; // 允许点击但不调起输入法
    }
    
    // 移动端短语调整
    .flex.items-center.gap-4 {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;
    }
  }
}

// 超小屏幕适配
@media (max-width: 480px) {
  .typing-word {
    padding: 0 0.3rem 12rem;
    
    .word {
      font-size: 1.5rem !important;
      letter-spacing: 0.05rem;
      margin: 0.3rem 0;
    }
    
    .phonetic, .translate {
      font-size: 0.9rem;
    }
    
    .label {
      width: 3rem;
      font-size: 0.8rem;
    }
    
    .cn {
      font-size: 0.8rem;
    }
    
    .en {
      font-size: 0.9rem;
    }
    
    .pos {
      font-size: 0.8rem;
      width: 2.5rem;
    }
    
    .sentence {
      font-size: 0.8rem;
      line-height: 1.3;
    }
  }
}
</style>
