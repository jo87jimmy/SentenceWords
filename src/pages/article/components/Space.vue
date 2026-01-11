<script setup lang="ts">
import {useSettingStore} from "@/stores/setting.ts";
import {computed} from "vue";

// 定義 Space 組件的 Props
const props = withDefaults(defineProps<{
  // 是否為錯誤狀態 (顯示紅色樣式)
  isWrong: boolean,
  // 是否為等待輸入狀態 (顯示普通底線游標)
  isWait?: boolean,
  // 是否需要震動 (錯誤提示動畫)
  isShake?: boolean,
}>(), {
  isWrong: false,
  isShake: false,
})

const settingStore = useSettingStore()

// 計算是否需要向下移動游標
// 用途：在聽寫模式下且沒有錯誤時，將光標稍微下移，避免遮擋文字
const isMoveBottom = computed(() => {
  return settingStore.dictation && !props.isWrong
})
</script>

<template>
  <!-- 錯誤狀態：顯示紅色底線與 U 型游標 -->
  <span class="word-space wrong" v-if="isWrong"></span>
  <!-- 非錯誤狀態：顯示普通等待游標或隱藏佔位 -->
  <span v-bind="$attrs" v-else>
    <span class="word-space wait"
          :class="[
           /* 根據 isWait 屬性控制透明度：true 顯示(等待輸入)，false 隱藏(僅佔位) */
           isWait ? 'opacity-100':' opacity-0',
           /* 震動動畫類：根據是否下移選擇不同的動畫類名 */
           isShake ? isMoveBottom ? 'shakeBottom' : 'shake' : '',
           /* 下移樣式類 */
           isMoveBottom && 'to-bottom'
       ]"
    ></span>
  </span>
</template>

<style scoped lang="scss">
// 基礎空格樣式
.word-space {
  position: relative;
  display: inline-block;
  width: 0.8rem;
  height: 1.5rem;
  box-sizing: border-box;
  margin: 0 1px;
  border-bottom: 2px solid transparent; // 默認透明底線

  // 錯誤狀態樣式
  &.wrong {
    border-bottom: 2px solid red; // 紅色底線
  }

  // 下移樣式 (聽寫模式)
  &.to-bottom {
    transform: translateY(0.3rem);
  }

  // 等待輸入樣式 (Normal 狀態)
  &.wait {
    border-bottom: 2px solid var(--color-article); // 使用主題色底線
    margin-left: 0.125rem;
    margin-right: 0.125rem;

    // 右側豎線 (構成 U 型)
    &::after {
      content: ' ';
      position: absolute;
      width: 2px;
      height: .25rem;
      background: var(--color-article);
      bottom: 0;
      right: 0;
    }

    // 左側豎線 (構成 U 型)
    &::before {
      content: ' ';
      position: absolute;
      width: 2px;
      height: .26rem;
      background: var(--color-article);
      bottom: 0;
      left: 0;
    }
  }
}

// 錯誤震動動畫樣式
.shake {
  border-bottom: 2px solid red !important; // 強制紅色
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; // 引用全局 shake 動畫

  // 偽元素 (U型兩側) 也變為紅色
  &::after {
    background: red !important;
  }

  &::before {
    background: red !important;
  }
}

// 下移狀態的震動動畫
.shakeBottom {
  @extend .shake; // 繼承 shake 基礎樣式
  animation: shakeBottom 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; // 引用下移版 shake 動畫
}

</style>
