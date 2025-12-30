<script setup lang="ts">
// 定義頁面樣式類別 (Tailwind CSS)
const pageClass = [
  'page', //class 名稱
  'w-screen md:w-[70vw] 2xl:w-[50vw]', // 寬度：手機版全寬 (100vw)，平板以上 70vw，超大螢幕 50vw
  'min-h-[calc(100vh-0.3rem)] min-[481px]:min-h-[calc(100vh-0.5rem)] md:min-h-[calc(100vh-1.2rem)]', // 最小高度：手機版減 0.3rem，小螢幕減 0.5rem，桌機減 1.2rem
  'mt-[0.3rem] min-[481px]:mt-[0.5rem] md:mt-[1.2rem]', // 上方邊距：手機版 0.3rem，小螢幕 0.5rem，桌機 1.2rem
  'px-[0.3rem] min-[481px]:px-[0.5rem] md:px-0', // 左右內距：手機版 0.3rem，小螢幕 0.5rem，桌機無內距
  'box-border', // 盒模型：使用 border-box 避免 padding 增加寬度
]
</script>

<template>
  <div class="flex justify-center">
    <div :class="pageClass">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
