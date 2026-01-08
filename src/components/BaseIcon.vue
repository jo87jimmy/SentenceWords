<script setup lang="ts">

import Tooltip from "@/components/base/Tooltip.vue"; // 引入 Tooltip 組件

defineProps<{ // 定義 Props
  title?: string, // 提示文字
  disabled?: boolean, // 是否禁用
  noBg?: boolean, // 是否無背景色
}>()

const emit = defineEmits(['click']) // 定義 click 事件

</script>

<template>
  <Tooltip :title="title"> <!-- Tooltip 包裹 -->
    <div v-bind="$attrs" @click="e => (!disabled) && emit('click', e)" class="icon-wrapper" :class="{ disabled, noBg }">
      <!-- 圖標容器，處理點擊和樣式 -->
      <slot /> <!-- 插槽內容 -->
    </div>
  </Tooltip>
</template>

<style scoped lang="scss">
$w: 1.4rem; // 圖標寬度變數

.icon-wrapper {
  cursor: pointer; // 滑鼠游標
  //padding: 2rem;
  width: 2rem; // 容器寬度
  // height: 2rem; // 容器高度
  display: inline-flex; // 行內 Flex
  align-items: center; // 垂直居中
  justify-content: center; // 水平居中
  border-radius: .3rem; // 圓角
  background: transparent; // 背景透明
  transition: all .3s; // 過渡

  &:hover:not(.disabled, .noBg) {
    // 懸停且未禁用無背景時
    background: var(--color-icon-hightlight); // 高亮背景色

    :deep(svg) {
      // 內部 SVG
      color: white; // 白色
    }
  }

  &.disabled {
    // 禁用狀態
    cursor: not-allowed; // 禁止圖示
    opacity: .3; // 透明度
  }

  :deep(svg) {
    // 默認 SVG 樣式
    width: $w;
    height: $w;
  }
}
</style>
