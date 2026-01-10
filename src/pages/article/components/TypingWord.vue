<template>
  <template v-for="(item, i) in list" :key="i">
    <span v-if="item.type === 'word-complete'">{{ item.val }}</span>
    <span 
      v-else-if="item.type === 'word-end'" 
      class="word-end"
      :class="isHide"
    >{{ item.val }}</span>
    <span 
      v-else-if="item.type === 'input-right'" 
      :class="{ 'input-right': props.isTyping }"
    >{{ item.val }}</span>
    <span 
      v-else-if="item.type === 'input-wrong'" 
      class="input-wrong"
    >{{ item.val }}</span>
    <Space v-else-if="item.type === 'space'" :is-wrong="true" />
  </template>
</template>

<script setup lang="ts">
import { useSettingStore } from "@/stores/setting"; // .ts extension is optional in imports usually, but if user uses it, keep consistent or cleaner.
import Space from "@/pages/article/components/Space.vue";
import { PracticeArticleWordType } from "@/types/types";
import type { ArticleWord } from "@/types/types";
import { computed } from "vue";

const props = defineProps<{
  word: ArticleWord,
  isTyping: boolean,
}>()
const settingStore = useSettingStore()

function compare(a: string, b: string) {
  return settingStore.ignoreCase ? a.toLowerCase() === b.toLowerCase() : a === b
}

const isHide = computed(() => {
  if (settingStore.dictation && props.word.type === PracticeArticleWordType.Word) return 'hide'
  return ''
})

const list = computed(() => {
  let t: any[] = []
  let right = ''
  let wrong = ''
  if (props.word.input.length) {
    if (props.word.input.length === props.word.word.length) {
      if (settingStore.ignoreCase ? props.word.input.toLowerCase() === props.word.word.toLowerCase() : props.word.input === props.word.word) {
        t.push({type: 'word-complete', val: props.word.input})
        return t
      }
    }
    props.word.input.split('').forEach((k: string, i: number) => {
      if (k === ' ') {
        right = wrong = ''
        t.push({type: 'space'})
      }
      else {
        if (compare(k, props.word.word[i] || '')) {
          right += k
          wrong = ''
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
          wrong += k
          right = ''
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
    if (props.word.input.length < props.word.word.length) {
      t.push({type: 'word-end', val: props.word.word.slice(props.word.input.length)})
    }
  } else {
    //word-end这个class用于光标定位，光标会定位到第一个word-end的位置
    t.push({type: 'word-end', val: props.word.word})
  }
  return t
})
</script>


<style scoped lang="scss">
.input-right {
  color: var(--color-select-bg);
}

.input-wrong {
  @apply color-red
}

.hide {
  opacity: 0;
}
</style>
