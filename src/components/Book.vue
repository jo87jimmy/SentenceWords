<script setup lang="ts">
import { type Dict } from "@/types/types.ts"; // 引入 Dict 類型定義
import Progress from '@/components/base/Progress.vue' // 引入進度條組件
import Checkbox from "@/components/base/checkbox/Checkbox.vue"; // 引入複選框組件
import { computed } from "vue"; // 引入計算屬性

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
  <div class="book relative overflow-hidden" :id="item?.id ?? 'no-book'"> <!-- 書籍卡片容器，相對定位，隱藏溢出 -->
    <template v-if="!isAdd"> <!-- 如果不是添加模式 -->
      <div>
        <div class="text-base">{{ item?.name }}</div> <!-- 顯示書名 -->
        <div class="text-sm line-clamp-3" v-opacity="item?.name !== item?.description">{{ item?.description }}</div> <!-- 顯示描述，最多3行 -->
      </div>
      <div class="absolute bottom-4 right-3"> <!-- 進度文字位置 -->
        <div>{{ studyProgress }}{{ item?.length }}{{ quantifier }}</div> <!-- 顯示進度文字，例如 "10/100本" -->
      </div>
      <div class="absolute bottom-2 left-3 right-3"> <!-- 進度條位置 -->
        <Progress v-if="(item?.lastLearnIndex || item?.complete) && showProgress" class="mt-1"
                  :percentage="progress"
                  :show-text="false"></Progress> <!-- 顯示進度條 -->
      </div>
      <Checkbox v-if="showCheckbox"
                :model-value="checked"
                @change="$emit('check')"
                class="absolute left-3 bottom-3"/> <!-- 顯示複選框 -->
      <div class="custom" v-if="item?.custom">自定義</div> <!-- 顯示自定義標籤 -->
    </template>
    <div v-else class="center h-full text-2xl"> <!-- 如果是添加模式 -->
      <IconFluentAdd16Regular/> <!-- 顯示加號圖標 -->
    </div>
  </div>
</template>

<style scoped lang="scss">
.custom { // 自定義標籤樣式
  position: absolute; // 絕對定位
  top: 4px; // 頂部距離
  right: -22px; // 右側距離 (移出邊界以旋轉)
  padding: 1px 20px; // 內邊距
  background: var(--color-label-bg); // 背景色
  font-size: 11px; // 字體大小
  transform: rotate(45deg); // 旋轉 45 度
}
</style>
