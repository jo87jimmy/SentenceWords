<script setup lang="ts">
import { _nextTick, groupBy, isMobile, loadJsLib, resourceWrap, useNav } from "@/utils"; // 引入工具函數
import BasePage from "@/components/BasePage.vue"; // 引入基礎頁面組件
import { type DictResource } from "@/types/types.ts"; // 引入字典資源類型定義
import { useRuntimeStore } from "@/stores/runtime.ts"; // 引入 Runtime Store
import BaseIcon from "@/components/BaseIcon.vue"; // 引入基礎圖標組件
import Empty from "@/components/Empty.vue"; // 引入空狀態組件
import BaseButton from "@/components/BaseButton.vue"; // 引入基礎按鈕組件
import DictList from "@/components/list/DictList.vue"; // 引入字典列表組件
import BackIcon from "@/components/BackIcon.vue"; // 引入返回圖標組件
import DictGroup from "@/components/list/DictGroup.vue"; // 引入字典分組組件
import { useBaseStore } from "@/stores/base.ts"; // 引入 Base Store
import { useRouter } from "vue-router"; // 引入 Vue Router
import { computed, watch, ref } from "vue"; // 引入 Vue 響應式 API
import { getDefaultDict } from "@/types/func.ts"; // 引入獲取預設字典函數
import { useFetch } from "@vueuse/core"; // 引入 useFetch Hook
import { DICT_LIST, LIB_JS_URL, TourConfig } from "@/config/env.ts"; // 引入環境配置
import BaseInput from "@/components/base/BaseInput.vue"; // 引入輸入框組件
import { useSettingStore } from "@/stores/setting.ts"; // 引入 Setting Store

const {nav} = useNav() // 獲取導航函數
const runtimeStore = useRuntimeStore() // 獲取 Runtime Store 實例
const settingStore = useSettingStore() // 獲取 Setting Store 實例
const store = useBaseStore() // 獲取 Base Store 實例
const router = useRouter() // 獲取 Router 實例

// 選擇並進入字典詳情
function selectDict(e:{dict: DictResource}) {
  console.log(e.dict) // 輸出選擇的字典信息
  getDictDetail(e.dict) // 獲取字典詳情
}

// 獲取字典詳情並導航
async function getDictDetail(val: DictResource) {
  runtimeStore.editDict = getDefaultDict(val) // 設定當前編輯的字典為選中的字典（使用預設值填充）
  nav('dict-detail', {from: 'list'}) // 導航到字典詳情頁，並傳遞來源參數
}

// 按標籤對字典進行分組
function groupByDictTags(dictList: DictResource[]) {
  return dictList.reduce<Record<string, DictResource[]>>((result, dict) => { // 使用 reduce 遍歷字典列表
    dict.tags.forEach((tag) => { // 遍歷每個字典的標籤
      if (result[tag]) { // 如果結果對象中已有該標籤
        result[tag].push(dict) // 將字典加入該標籤數組
      } else {
        result[tag] = [dict] // 否則初始化該標籤數組
      }
    })
    return result // 返回分組結果
  }, {})
}

// 獲取所有字典列表數據
const {data: dict_list, isFetching} = useFetch(resourceWrap(DICT_LIST.WORD.ALL)).json()

// 計算屬性：按類別和標籤分組的字典數據
const groupedByCategoryAndTag = computed(() => {
  let data = [] as any[] // 初始化數據數組
  if (!dict_list.value) return data // 如果沒有數據則返回空
  const groupByCategory = groupBy(dict_list.value, 'category') // 先按類別分組
  for (const [key, value] of Object.entries(groupByCategory)) { // 遍歷類別分組
    data.push([key, groupByDictTags(value as DictResource[])]) // 對每個類別下的字典再按標籤分組，並推入 data
  }
  // 交換第3和第4個元素的位置 (索引2和3) - 特定排序需求
  [data[2], data[3]] = [data[3], data[2]];
  console.log('data', data) // 輸出處理後的數據
  return data // 返回最終分組數據
})

let showSearchInput = ref(false) // 控制搜尋輸入框顯示狀態
let searchKey = ref('') // 搜尋關鍵字

// 計算屬性：搜尋結果列表
const searchList = computed<any[]>(() => {
  if (searchKey.value) { // 如果有搜尋關鍵字
    let s = searchKey.value.toLowerCase() // 轉為小寫
    return dict_list.value.filter((item:any) => { // 過濾字典列表
      return item.id.toLowerCase().includes(s) // 匹配 ID
          || item.name.toLowerCase().includes(s) // 匹配名稱
          || item.category.toLowerCase().includes(s) // 匹配類別
          || item.tags.join('').replace('所有', '').toLowerCase().includes(s) // 匹配標籤（過濾掉'所有'）
          || item?.url?.toLowerCase?.().includes?.(s) // 匹配 URL
    })
  }
  return [] // 無關鍵字返回空
})

// 監聽字典列表數據變化，用於引導
watch(dict_list, (val) => {
  if (!val.length) return // 如果無數據返回
  let cet4 = val.find((v:any) => v.id === 'cet4') // 查找四級詞彙字典
  if (!cet4) return // 如果沒找到返回
  _nextTick(async () => { // 等待 DOM 更新
    const Shepherd = await loadJsLib('Shepherd', LIB_JS_URL.SHEPHERD); // 加載引導庫
    const tour = new Shepherd.Tour(TourConfig); // 創建引導實例
    tour.on('cancel', () => { // 監聽取消事件
      localStorage.setItem('tour-guide', '1'); // 標記已完成引導
    });
    tour.addStep({ // 添加引導步驟
      id: 'step2',
      text: '選一本自己準備學習的字典', // 提示文字 (繁體)
      attachTo: {element: '#cet4', on: 'bottom'}, // 綁定元素
      buttons: [
        {
          text: `下一步（2/${TourConfig.total}）`, // 按鈕文字
          action() { // 點擊動作
            tour.next() // 下一步
            selectDict({dict: cet4}) // 選擇該字典
          }
        }
      ]
    });

    const r = localStorage.getItem('tour-guide'); // 獲取本地存儲的引導標記
    if (settingStore.first && !r && !isMobile()) { // 如果是首次且無標記且非移動端
      tour.start(); // 開始引導
    }
  }, 500) // 延遲 500ms
})

</script>

<template>
  <BasePage> <!-- 基礎頁面容器 -->
    <div class="card min-h-200 dict-list-page" v-loading="isFetching"> <!-- 卡片容器，帶加載狀態 -->
      <!-- 頂部標題與搜尋欄 -->
      <div class="flex items-center relative gap-2 header-section"> <!-- 頭部區域 Flex 容器 -->
        <BackIcon class="z-2" @click='router.back'/> <!-- 返回按鈕 -->
        <div class="flex flex-1 gap-4" v-if="showSearchInput"> <!-- 如果顯示搜尋框 -->
          <BaseInput clearable placeholder="請輸入字典名稱/縮寫/類別" v-model="searchKey" class="flex-1" autofocus/> <!-- 輸入框 -->
          <BaseButton @click="showSearchInput = false, searchKey = ''">取消</BaseButton> <!-- 取消按鈕 -->
        </div>
        <div class="py-1 flex flex-1 justify-end" v-else> <!-- 否則顯示標題 -->
          <span class="page-title absolute w-full center">字典列表</span> <!-- 頁面標題 -->
          <BaseIcon
              title="搜尋"
              @click="showSearchInput = true" 
              class="z-1"
              icon="fluent:search-24-regular">
            <IconFluentSearch24Regular/> <!-- 搜尋圖標 -->
          </BaseIcon>
        </div>
      </div>
      
      <!-- 搜尋結果顯示區域 -->
      <div class="mt-4" v-if="searchKey"> <!-- 如果有搜尋關鍵字 -->
        <DictList
            v-if="searchList.length "
            @selectDict="selectDict"
            :list="searchList"
            quantifier="個單字"
            :select-id="'-1'"/> <!-- 顯示搜尋結果列表 -->
        <Empty v-else text="沒有相關字典"/> <!-- 無結果顯示空狀態 -->
      </div>
      
      <!-- 默認列表顯示區域 -->
      <div class="w-full" v-else> <!-- 否則顯示默認列表 -->
        <DictGroup
            v-for="item in groupedByCategoryAndTag"
            :select-id="store.currentStudyWordDict.id"
            @selectDict="selectDict"
            quantifier="個單字"
            :groupByTag="item[1]"
            :category="item[0]"
        /> <!-- 按分組顯示字典 -->
      </div>
    </div>
  </BasePage>
</template>

<style scoped lang="scss">
// 移動端適配
@media (max-width: 768px) {
  .dict-list-page {
    padding: 0.8rem; // 調整內邊距
    margin-bottom: 1rem; // 調整底部邊距

    .header-section {
      flex-direction: column; // 垂直排列
      gap: 0.5rem; // 間距

      .flex.flex-1.gap-4 {
        width: 100%; // 寬度 100%

        .base-input {
          font-size: 0.9rem; // 調整字體大小
        }

        .base-button {
          padding: 0.5rem 0.8rem; // 調整 padding
          font-size: 0.9rem; // 調整字體
        }
      }

      .py-1.flex.flex-1.justify-end {
        width: 100%;

        .page-title {
          font-size: 1.2rem; // 標題字體大小
        }

        .base-icon {
          font-size: 1.2rem; // 圖標大小
        }
      }
    }

    .mt-4 {
      margin-top: 0.8rem; // 調整頂部邊距
    }
  }
}

// 超小螢幕適配
@media (max-width: 480px) {
  .dict-list-page {
    padding: 0.5rem; // 調整內邊距

    .header-section {
      .flex.flex-1.gap-4 {
        .base-input {
          font-size: 0.8rem; // 更小的字體
        }

        .base-button {
          padding: 0.4rem 0.6rem; // 更小的 padding
          font-size: 0.8rem;
        }
      }

      .py-1.flex.flex-1.justify-end {
        .page-title {
          font-size: 1rem; // 更小的標題
        }

        .base-icon {
          font-size: 1rem; // 更小的圖標
        }
      }
    }
  }
}
</style>
