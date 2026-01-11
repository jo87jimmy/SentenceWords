<script setup lang="tsx">
import {useSettingStore} from "@/stores/setting.ts";
import Space from "@/pages/article/components/Space.vue";
import { PracticeArticleWordType } from "@/types/types.ts";
import { computed } from "vue";
//引入这个编译就报错
// import {ArticleWord} from "@/types/types.ts";

const props = defineProps<{
  word: any,
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
  // Guard against undefined word or input
  if (!props.word || props.word.input == null || props.word.word == null) {
    return t
  }
  if (props.word.input.length) {
    if (props.word.input.length === props.word.word.length) {
      if (settingStore.ignoreCase ? props.word.input.toLowerCase() === props.word.word.toLowerCase() : props.word.input === props.word.word) {
        t.push({type: 'word-complete', val: props.word.input})
        return t
      }
    }
    props.word.input.split('').forEach((k:any, i:any) => {
      if (k === ' ') {
        right = wrong = ''
        t.push({type: 'space'})
      }
      else {
        if (compare(k, props.word.word[i])) {
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

<template>
  <template v-for="(item, i) in list" :key="i">
    <span v-if="item.type === 'word-complete'">{{ item.val }}</span>
    <span v-else-if="item.type === 'word-end'" :class="['word-end', isHide]">{{ item.val }}</span>
    <span v-else-if="item.type === 'input-right'" :class="isTyping ? 'input-right' : ''">{{ item.val }}</span>
    <span v-else-if="item.type === 'input-wrong'" class="input-wrong">{{ item.val }}</span>
    <Space v-else-if="item.type === 'space'" :isWrong="true" />
  </template>
</template>


<style scoped lang="scss">
.input-right {
  // background-color: var(--color-select-bg);
  color: blue;
  background-color: aquamarine;
  border-radius: 2px;
}

.input-wrong {
  color: red;
  background-color: #fee2e2;
  border-radius: 2px;
}

.hide {
  opacity: 0;
}
</style>
