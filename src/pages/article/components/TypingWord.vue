<script setup lang="tsx">
import {useSettingStore} from "@/stores/setting.ts";
import Space from "@/pages/article/components/Space.vue";
import { PracticeArticleWordType } from "@/types/types.ts";
import { computed } from "vue";
// 引入這個編譯就會報錯 (類型導入問題)
// import {ArticleWord} from "@/types/types.ts";

// 定義 Props
const props = defineProps<{
  word: any, // 單詞對象
  isTyping: boolean, // 是否正在輸入該單詞
}>()
const settingStore = useSettingStore()

// 比較兩個字元是否相等
// 用途：根據全局設置決定是否忽略大小寫進行比較
function compare(a: string, b: string) {
  return settingStore.ignoreCase ? a.toLowerCase() === b.toLowerCase() : a === b
}

// 計算是否需要隱藏單詞
// 用途：在聽寫模式下，如果是普通單詞類型，則返回 'hide' 類名以隱藏文字
const isHide = computed(() => {
  if (settingStore.dictation && props.word.type === PracticeArticleWordType.Word) return 'hide'
  return ''
})

// 計算單詞的渲染列表
// 用途：將單詞拆分為 正確部分、錯誤部分、剩餘未輸入部分，以便分別渲染樣式
const list = computed(() => {
  let t: any[] = [] // 結果列表
  let right = '' // 緩存連續正確的字符
  let wrong = '' // 緩存連續錯誤的字符
  
  // 1. 防呆檢查：防止單詞數據或輸入為 undefined / null
  if (!props.word || props.word.input == null || props.word.word == null) {
    return t
  }
  
  // 2. 當有輸入內容時的處理邏輯
  if (props.word.input.length) {
    // 2.1 檢查是否完全匹配 (長度相同且內容一致)
    if (props.word.input.length === props.word.word.length) {
      if (settingStore.ignoreCase ? props.word.input.toLowerCase() === props.word.word.toLowerCase() : props.word.input === props.word.word) {
        // 完全正確，直接返回一個 'word-complete' 類型的項
        t.push({type: 'word-complete', val: props.word.input})
        return t
      }
    }
    
    // 2.2 逐字比較輸入內容與目標單詞
    props.word.input.split('').forEach((k:any, i:any) => {
      // 處理輸入為空格的情況 (通常不應發生在單詞內部，除非是特殊情況)
      if (k === ' ') {
        right = wrong = '' // 重置緩存
        t.push({type: 'space'})
      }
      else {
        // 比較當前輸入字符 k 與目標字符 props.word.word[i]
        if (compare(k, props.word.word[i])) {
          // --- 輸入正確 ---
          right += k
          wrong = ''
          // 合併連續的正確輸入，減少 DOM 節點
          if (t.length) {
            let last = t[t.length - 1]
            if (last.type === 'input-right') {
              last.val = right
            } else {
              t.push({type: 'input-right', val: right})
            }
          } else {
            t.push({type: 'input-right', val: right})
          }
        } else {
          // --- 輸入錯誤 ---
          wrong += k
          right = ''
          // 合併連續的錯誤輸入
          if (t.length) {
            let last = t[t.length - 1]
            if (last.type === 'input-wrong') {
              last.val = wrong
            } else {
              t.push({type: 'input-wrong', val: wrong})
            }
          } else {
            t.push({type: 'input-wrong', val: wrong})
          }
        }
      }
    })
    
    // 3. 處理剩餘未輸入的文字
    // 如果輸入長度小於單詞長度，將剩餘部分標記為 'word-end'
    if (props.word.input.length < props.word.word.length) {
      t.push({type: 'word-end', val: props.word.word.slice(props.word.input.length)})
    }
  } else {
    // 4. 無任何輸入時
    // word-end 這個 class 用於遊標定位，遊標會定位到第一個 word-end 的位置
    t.push({type: 'word-end', val: props.word.word})
  }
  return t
})

</script>

<template>
  <!-- 根據計算出的 list 渲染單詞的各個部分 -->
  <template v-for="(item, i) in list" :key="i">
    <!-- 完全正確 -->
    <span v-if="item.type === 'word-complete'">{{ item.val }}</span>
    <!-- 剩餘未輸入部分 (可能隱藏) -->
    <span v-else-if="item.type === 'word-end'" :class="['word-end', isHide]">{{ item.val }}</span>
    <!-- 輸入正確部分 -->
    <span v-else-if="item.type === 'input-right'" class="input-right">{{ item.val }}</span>
    <!-- 輸入錯誤部分 -->
    <span v-else-if="item.type === 'input-wrong'" class="input-wrong">{{ item.val }}</span>
    <!-- 空格錯誤 (顯示 Space 組件) -->
    <Space v-else-if="item.type === 'space'" :isWrong="true" />
  </template>
</template>


<style scoped lang="scss">
// 輸入正確時的樣式 (綠色背景)
.input-right {
  color: green !important;
  background-color: var(--color-select-bg) !important;
  border-radius: 2px;
}

// 輸入錯誤時的樣式 (紅色字體 + 紅色背景)
.input-wrong {
  color: red !important;
  background-color: #fee2e2 !important;
  border-radius: 2px;
}

// 隱藏樣式 (用於聽寫模式)
.hide {
  opacity: 0;
}
</style>
