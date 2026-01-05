<script setup lang="ts">
import { type Dict } from "@/types/types.ts"; // 引入 Dict 類型定義
import { computed } from "vue"; // 引入計算屬性
import Checkbox from 'primevue/checkbox';
import ProgressBar from 'primevue/progressbar';

interface IProps { // 定義組件 Props 介面
  item?: Partial<Dict>; // 字典數據物件 (可選)
  quantifier?: string // 量詞 (例如 '個', '本')
  isAdd: boolean // 是否為添加按鈕模式
  showCheckbox?: boolean // 是否顯示複選框
  checked?: boolean // 是否選中
  showProgress?: boolean // 是否顯示進度
}

const props = withDefaults(defineProps<IProps>(), { // 定義 Props 並設定預設值
  showProgress: true // 預設顯示進度
})

defineEmits<{ // 定義 Emits
  check: [] // check 事件
}>()

const progress = computed(() => { // 計算進度百分比
  if (props.item?.complete) return 100 // 如果已完成，返回 100
  const lastLearnIndex = props.item?.lastLearnIndex ?? 0 // 獲取上次學習位置，默認為 0
  const length = props.item?.length ?? 1 // 獲取總長度，防止除以 0
  return Number(((lastLearnIndex / length) * 100).toFixed()) // 計算百分比並轉為數字
})

const studyProgress = computed(() => { // 計算顯示用的學習進度字串
  if (!props.showProgress) return // 如果不顯示進度則返回 undefined
  if (props.item?.complete) return (props.item?.length || 0) + '/' // 如果已完成，顯示 "總數/"
  return props.item?.lastLearnIndex ? props.item?.lastLearnIndex + '/' : '' // 顯示 "已學/"
})
</script>

<template>
  <div class="book relative overflow-hidden bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300" :id="item?.id ?? 'no-book'"> <!-- 書籍卡片容器 -->
    <template v-if="!isAdd"> <!-- 如果不是添加模式 -->
      <div class="p-4">
        <div class="text-base font-medium text-gray-900 dark:text-gray-100">{{ item?.name }}</div> <!-- 顯示書名 -->
        <div class="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mt-1 transition-opacity duration-300" :class="{ 'opacity-0': item?.name === item?.description }">{{ item?.description }}</div> <!-- 顯示描述，最多3行 -->
      </div>
      <div class="h-24"></div> <!-- Spacer for content -->
    <div class="absolute bottom-0 left-0 right-0 p-3 pt-0"> <!-- Footer container -->
        <div class="flex justify-end mb-1 text-xs text-gray-400 dark:text-gray-500"> <!-- Text row -->
          <span>{{ studyProgress }}</span>
          <span>{{ item?.length }}</span>
          <span class="ml-0.5">{{ quantifier }}</span>
        </div>
        
        <div class="relative h-2 flex items-center"> <!-- Progress bar row -->
           <ProgressBar v-if="(item?.lastLearnIndex || item?.complete) && showProgress" 
                      class="w-full !h-1.5"
                      :value="progress"
                      :showValue="false"></ProgressBar>
           
           <div v-if="showCheckbox" class="absolute left-0 top-1/2 -translate-y-1/2 z-10"> <!-- Checkbox overlay on left -->
               <Checkbox :modelValue="checked" :binary="true" @update:modelValue="$emit('check')" /> 
           </div>
        </div>
    </div>
      
    <div class="custom" v-if="item?.custom">自定義</div> <!-- 顯示自定義標籤 -->
    </template>
    <div v-else class="flex justify-center items-center h-48 text-2xl text-gray-400 hover:text-primary transition-colors cursor-pointer"> <!-- 如果是添加模式 -->
      <IconFluentAdd16Regular/> <!-- 顯示加號圖標 -->
    </div>
  </div>
</template>

<style scoped lang="scss">
.custom { // 自定義標籤樣式
  position: absolute; // 絕對定位
  top: 10px; // 頂部距離
  right: -24px; // 右側距離 (移出邊界以旋轉)
  padding: 2px 24px; // 內邊距
  background: var(--p-primary-color); // 背景色 使用 PrimeVue 變量
  color: #fff;
  font-size: 10px; // 字體大小
  transform: rotate(45deg); // 旋轉 45 度
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
