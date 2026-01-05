<script setup lang="ts">
// 使用 <script setup> 語法糖，啟用 TypeScript 支援
</script>

<template>
<router-view></router-view>
<!-- 路由出口元件，用於渲染當前路由匹配到的元件 -->
</template>

<style scoped>
/* Scoped CSS，樣式僅應用於當前元件 */
.logo {
  height: 6em; /* 設定 logo 高度 */
  padding: 1.5em; /* 設定內距 */
  will-change: filter; /* 告知瀏覽器 filter 屬性即將變化，進行最佳化 */
  transition: filter 300ms; /* 設定 filter 屬性的過渡效果為 300ms */
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa); /* 滑鼠懸停時新增紫色陰影 */
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa); /* Vue logo 懸停時新增綠色陰影 */
}
</style>
