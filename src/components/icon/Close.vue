<script setup lang="ts">
// @ts-ignore
import Tooltip from "@/components/base/Tooltip.vue"; // 引入 Tooltip 組件

defineEmits(['click']) // 定義 click 事件
defineProps<{ // 定義 Props
  title?: string // 標題屬性 (可選)
}>()
</script>

<template>
  <div class="close"
       @click="$emit('click')"
  > <!-- 關閉按鈕容器，點擊觸發事件 -->
    <Tooltip :title="title"> <!-- Tooltip 包裹 -->
      <IconFluentDismissCircle16Regular/> <!-- 關閉圖標 -->
    </Tooltip>
  </div>
</template>

<style scoped lang="scss">
.close {
  cursor: pointer; // 鼠標手勢
  display: flex; // 彈性佈局
  align-items: center; // 垂直居中
  justify-content: center; // 水平居中
  font-size: 1.1rem; // 字體大小
}
</style>
