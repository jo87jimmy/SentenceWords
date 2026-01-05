<script setup lang="ts">
import {type Dict} from "@/types/types.ts"; // 引入字典類型定義
import Book from "@/components/Book.vue"; // 引入書籍組件

// 定義 Props
defineProps<{
  list?: Partial<Dict>[], // 字典列表數據
  selectId?: string // 選中的 ID
  quantifier?: string // 量詞（如：個單字）
}>()

// 定義 Emits
const emit = defineEmits<{
  selectDict: [val: { dict: any, index: number }] // 選擇字典事件
  del: [val: { dict: any, index: number }] // 刪除事件
  detail: [], // 詳情事件
  add: [] // 添加事件
}>()

</script>

<template>
  <div class="flex gap-4 flex-wrap"> <!-- Flex 容器，間距 4，換行 -->
    <!-- 遍歷列表渲染 Book 組件 -->
    <Book v-for="(dict,index) in list"
          :is-add="false"
          @click="emit('selectDict',{dict,index})"
          :quantifier="quantifier"
          :item="dict"/> <!-- 書籍項目 -->
  </div>
</template>

<style scoped lang="scss">
.dict-list {
  display: flex; // 彈性佈局
  flex-wrap: wrap; // 換行
  gap: 1rem; // 間距
}

// 移動端適配
@media (max-width: 768px) {
  .flex.gap-4.flex-wrap {
    gap: 0.5rem; // 縮小間距
    
    .book {
      width: 5rem; // 寬度
      height: calc(5rem * 1.4); // 高度比例
      padding: 0.5rem; // 內邊距
      cursor: pointer; // 手勢
      position: relative; // 相對定位
      z-index: 10; // 層級
      
      .text-base {
        font-size: 0.8rem; // 字體
        line-height: 1.2; // 行高
        word-break: break-word; // 換行
        margin-bottom: 0.2rem; // 底部間距
      }
      
      .text-sm {
        font-size: 0.7rem; // 小字體
        line-height: 1.1; // 行高
        margin-bottom: 0.3rem; // 底部間距
      }
      
      .absolute.bottom-4.right-3 {
        bottom: 0.8rem; // 定位
        right: 0.3rem;
        font-size: 0.7rem; // 字體
        line-height: 1;
      }
      
      .absolute.bottom-2.left-3.right-3 {
        bottom: 0.2rem;
        left: 0.3rem;
        right: 0.3rem;
      }
      
      .absolute.left-3.bottom-3 {
        left: 0.3rem;
        bottom: 0.3rem;
      }
    }
  }
}

// 超小螢幕適配
@media (max-width: 480px) {
  .flex.gap-4.flex-wrap {
    gap: 0.3rem; // 更小間距
    
    .book {
      width: 4.5rem; // 更窄
      height: calc(4.5rem * 1.4); // 高度
      padding: 0.4rem; // padding
      
      .text-base {
        font-size: 0.7rem; // 字體
        line-height: 1.1;
      }
      
      .text-sm {
        font-size: 0.6rem; // 字體
        line-height: 1;
      }
      
      .absolute.bottom-4.right-3 {
        font-size: 0.6rem; // 字體
      }
    }
  }
}

</style>
