<script setup lang="ts">
import {watch} from "vue"; // 引入 Vue 的 watch 函數
import {type DictResource} from "@/types/types.ts"; // 引入字典資源類型定義
import DictList from "@/components/list/DictList.vue"; // 引入字典列表組件
import { computed, ref } from "vue"; // 引入計算屬性和 ref

// 定義 Props
const props = defineProps<{
  category: string, // 類別名稱
  groupByTag: any, // 按標籤分組的數據
  selectId: string // 當前選中的字典 ID
}>()

// 定義 Emits
const emit = defineEmits<{
  selectDict: [val: { dict: DictResource, index: number }] // 選擇字典事件
  detail: [], // 詳情事件（未實作？）
}>()

// 計算標籤列表（從 groupByTag 的鍵獲取）
const tagList = computed(() => Object.keys(props.groupByTag))
// 當前選中的標籤，預設為第一個
const currentTag = ref(tagList.value[0])

// 計算當前顯示的列表（根據當前標籤過濾）
const list = computed(() => {
  return currentTag.value ? props.groupByTag[currentTag.value] : [] // 如果有當前標籤，返回對應列表，否則為空
})

// 監聽 groupByTag 變化，重置當前標籤為第一個
watch(() => props.groupByTag, () => {
  currentTag.value = tagList.value[0]
})

</script>

<template>
  <div> <!-- 根容器 -->
    <!-- 分類標題與標籤切換區 -->
    <div class="flex items-center"> <!-- Flex 容器，垂直居中 -->
      <div class="category shrink-0">{{ category }}：</div> <!-- 類別名稱，防止縮小 -->
      <div class="tags"> <!-- 標籤容器 -->
        <!-- 遍歷標籤，點擊切換當前標籤 -->
        <div class="tag" :class="i === currentTag &&'active'"
             @click="currentTag = i"
             v-for="i in Object.keys(groupByTag)">{{ i }} <!-- 標籤項 -->
        </div>
      </div>
    </div>

    <!-- 字典列表顯示組件 -->
    <DictList
        @selectDict="e => emit('selectDict',e)"
        :list="list"
        :select-id="selectId"/> <!-- 傳遞列表與選中 ID -->
  </div>
</template>

<style scoped lang="scss">

.tags {
  display: flex; // 彈性佈局
  flex-wrap: wrap; // 自適應換行
  margin: 1rem 0; // 上下邊距

  .tag {
    color: var(--color-font-1); // 字體顏色
    cursor: pointer; // 滑鼠手勢
    padding: 0.4rem 1rem; // 內邊距
    border-radius: 2rem; // 圓角

    &.active { // 激活狀態
      color: var(--color-font-active-1); // 激活字體顏色
      background: gray; // 激活背景色
    }
  }
}

// 移動端適配
@media (max-width: 768px) {
  .flex.items-center {
    flex-direction: column; // 垂直排列
    align-items: flex-start; // 左對齊
    gap: 0.5rem; // 間距
    
    .category {
      font-size: 1rem; // 字體大小
      font-weight: bold; // 粗體
    }
    
    .tags {
      margin: 0.5rem 0; // 邊距
      gap: 0.3rem; // 間距
      
      .tag {
        padding: 0.3rem 0.8rem; // 調整 padding
        font-size: 0.9rem; // 調整字體
        min-height: 44px; // 最小高度 (便於觸控)
        min-width: 44px; // 最小寬度
        display: flex; // 彈性佈局
        align-items: center; // 垂直居中
        justify-content: center; // 水平居中
      }
    }
  }
}

// 超小螢幕適配
@media (max-width: 480px) {
  .flex.items-center {
    .category {
      font-size: 0.9rem; // 更小的字體
    }
    
    .tags {
      .tag {
        padding: 0.2rem 0.6rem; // 更小的 padding
        font-size: 0.8rem; // 更小的字體
      }
    }
  }
}

</style>
