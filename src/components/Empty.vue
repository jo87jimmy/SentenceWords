<script setup lang="ts">
import BaseButton from "@/components/BaseButton.vue"; // 引入基礎按鈕組件

defineProps<{ // 定義 Props
  text?: string // 顯示文字 (可選)
  showAdd?: boolean // 是否顯示添加按鈕 (可選)
}>()

defineEmits<{ // 定義 Emits
  add: [] // add 事件
}>()
</script>

<template>
  <div class="empty"> <!-- 空狀態容器 -->
    <img src="@/assets/img/空白頁.svg" alt=""> <!-- 空白頁圖片 -->
    <span>{{ text ?? '空蕩蕩的~' }}</span> <!-- 顯示文字，預設 "空蕩蕩的~" -->
    <BaseButton v-if="showAdd" @click="$emit('add')">新增</BaseButton> <!-- 如果 showAdd 為真，顯示新增按鈕 -->
  </div>
</template>

<style scoped lang="scss">
.empty { // 空狀態樣式
  width: 100%; // 寬度 100%
  height: 100%; // 高度 100%
  min-height: 18rem; // 最小高度
  display: flex; // Flex 佈局
  justify-content: center; // 水平居中
  align-items: center; // 垂直居中
  flex-direction: column; // 垂直排列
  font-size: .9rem; // 字體大小
  gap: 1.3rem; // 間距

  span {
    font-family: var(--font-family); // 使用全域字體變數
  }

  img {
    margin-top: -3rem; // 向上偏移
    width: 9rem; // 圖片寬度
  }
}
</style>
