<script setup lang="ts">
import BaseIcon from "@/components/BaseIcon.vue"; // 引入 BaseIcon 組件
import { useAttrs } from "vue"; // 引入 useAttrs
import { useNav } from "@/utils"; // 引入導航工具

const attrs = useAttrs() // 獲取組件屬性
const router = useNav() // 獲取路由導航實例

function onClick() { // 點擊處理函數
  if (!attrs.onClick) { // 如果沒有傳入 onClick 事件
    router.back() // 執行路由返回
  }
}
</script>

<template>
  <BaseIcon
      title="返回"
      @click="onClick"
  > <!-- 使用 BaseIcon，設定標題為 "返回" -->
    <IconFluentChevronLeft28Filled/> <!-- 顯示左箭頭圖標 -->
  </BaseIcon>
</template>

<style scoped lang="scss">

</style>
