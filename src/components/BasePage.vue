<script setup lang="ts">
// 定義頁面樣式類別，使用 Tailwind CSS Utility Classes
const pageClass = [
  'page', // 自定義 class 名稱，可能有全局樣式
  'w-screen md:w-[70vw] 2xl:w-[50vw]', // 響應式寬度：手機版全寬 (100vw)，平板以上 70vw，超大螢幕 50vw
  'min-h-[calc(100vh-0.3rem)] min-[481px]:min-h-[calc(100vh-0.5rem)] md:min-h-[calc(100vh-1.2rem)]', // 最小高度計算：vh 減去不同裝置的頂部/底部留白
  'mt-[0.3rem] min-[481px]:mt-[0.5rem] md:mt-[1.2rem]', // 上方外邊距：根據裝置大小調整 (0.3rem ~ 1.2rem)
  'px-[0.3rem] min-[481px]:px-[0.5rem] md:px-0', // 左右內邊距：手機/小螢幕有內距，中螢幕以上無
  'box-border', // 盒模型設置：使用 border-box，padding 不增加元素總寬度
]
</script>

<template>
  <div class="flex justify-center"> <!-- 使用 Flexbox 居中對齊內容 -->
    <div :class="pageClass"> <!-- 應用上面定義的響應式樣式類別 -->
      <slot></slot> <!-- 插槽：用於渲染父組件傳入的內容 -->
    </div>
  </div>
</template>

<style scoped lang="scss">
/* Scoped SCSS 區塊，目前為空，可在此添加組件特定樣式 */
</style>
