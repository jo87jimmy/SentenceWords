<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog';
// 使用 <script setup> 語法糖，啟用 TypeScript 支持
</script>

<template>
<router-view></router-view>
<ConfirmDialog />
<!-- 路由出口組件，用於渲染當前路由匹配到的組件 -->
</template>

<style scoped>
/* Scoped CSS，樣式僅應用於當前組件 */
.logo {
  height: 6em; /* 設定 logo 高度 */
  padding: 1.5em; /* 設定內邊距 */
  will-change: filter; /* 告知瀏覽器 filter 屬性即將變化，進行優化 */
  transition: filter 300ms; /* 設定 filter 屬性的過渡效果為 300ms */
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa); /* 滑鼠懸停時添加紫色陰影 */
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa); /* Vue logo 懸停時添加綠色陰影 */
}
</style>
