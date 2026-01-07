<script setup lang="ts">
import BasePage from '@/components/BasePage.vue'; // 引入基礎頁面組件
import Button from 'primevue/button'; // 引入 PrimeVue 按鈕組件
import ProgressBar from 'primevue/progressbar'; // 引入進度條組件
import ConfirmPopup from 'primevue/confirmpopup'; // 引入確認彈窗組件
import Card from 'primevue/card'; // 引入 PrimeVue 卡片組件
import { useConfirm } from 'primevue/useconfirm'; // 引入確認框 Hook
import { useRouter } from 'vue-router'; // 引入路由 Hook
import { ref, computed } from 'vue'; // 引入 Vue 響應式 API
import { type DictResource, WordPracticeMode } from "@/types/types.ts"; // 引入字典資源類型和練習模式枚舉
import { getDefaultDict } from "@/types/func.ts"; // 引入獲取預設字典函數
import { _getAccomplishDate, useNav } from '@/utils/index.ts'; // 引入日期計算工具和導航 Hook
import { useRuntimeStore } from "@/stores/runtime.ts"; // 引入 Runtime Store
import { useBaseStore } from '@/stores/base.ts'; // 引入 Base Store
import Toast from '@/components/base/toast/Toast.ts'; // 引入 Toast 提示
import { useSettingStore } from "@/stores/setting.ts"; // 引入 Setting Store

const store = useBaseStore() // 獲取 Base Store 實例
const router = useRouter(); // 獲取 Router 實例
const confirm = useConfirm(); // 獲取 Confirm 實例
const {nav} = useNav() // 獲取導航函數
const runtimeStore = useRuntimeStore() // 獲取 Runtime Store 實例
const isSaveData = ref(false) // 是否保存數據的狀態，預設 false
const settingStore = useSettingStore() // 獲取 Setting Store 實例
let loading = ref(true) // 加載狀態，預設 true

// 處理確認對話框的函數
const handleConfirm = (event: Event, message: string, acceptCallback: () => void) => {
    confirm.require({ // 調用 PrimeVue 的 confirm 方法
        target: event.currentTarget as HTMLElement, // 設定觸發目標
        message: message, // 設定提示訊息
        icon: 'pi pi-exclamation-triangle', // 設定圖示
        accept: acceptCallback, // 設定接受時的回調函數
    });
};

// 檢查條件並執行操作的輔助函數
const confirmAndExecute = (event: Event, condition: boolean, message: string, action: () => void) => {
    if (condition) { // 如果滿足條件（例如有未保存數據）
        handleConfirm(event, message, action); // 顯示確認框
    } else {
        action(); // 否則直接執行操作
    }
};

// 跳轉到字典詳情頁
async function goDictDetail(val: DictResource) {
  if (!val.id) return nav('dict-list') // 如果沒有 ID，跳轉到字典列表
  runtimeStore.editDict = getDefaultDict(val) // 設定當前編輯的字典
  nav('dict-detail', {}) // 跳轉到詳情頁
}

// 計算屬性：左側進度文本
const progressTextLeft = computed(() => {
  if (store.sdict.complete) return '已學完，進入總複習階段' // 如果已完成
  return '已學習' + store.currentStudyProgress + '%' // 顯示學習百分比
})

// 計算屬性：右側進度文本（已學習數量）
const progressTextRight = computed(() => {
  // if (store.sdict.complete) return store.sdict?.length
  return store.sdict?.lastLearnIndex // 返回上次學習的索引
})

// 檢查是否選擇了字典
function check(cb: Function) {
  if (!store.sdict.id) { // 如果沒有字典 ID
    Toast.warning('請先選擇一本詞典') // 提示警告
  } else {
    runtimeStore.editDict = getDefaultDict(store.sdict) // 設定編輯字典
    cb() // 執行回調
  }
}

// 定義各種彈窗的顯示狀態
let showChangeLastPracticeIndexDialog = ref(false) // 顯示更改進度彈窗
let showPracticeWordListDialog = ref(false) // 顯示練習詞表彈窗
let showPracticeSettingDialog = ref(false) // 顯示練習設定彈窗
let showShufflePracticeSettingDialog = ref(false) // 顯示隨機練習設定彈窗
let currentStudy = ref({ // 當前學習內容的統計數據
  new: [], // 新詞
  review: [], // 複習
  write: [], // 書寫
  shuffle: [], // 亂序
})

// 開始練習函數
function startPractice() {
    debugger
  if (store.sdict.id) { // 如果有選擇字典
    if (!store.sdict.words.length) { // 如果字典為空
      return Toast.warning('沒有單字可學習！') // 提示
    }
    // 埋點追蹤：開始學習
    window.umami?.track('startStudyWord', {
      name: store.sdict.name,
      index: store.sdict.lastLearnIndex,
      perDayStudyNumber: store.sdict.perDayStudyNumber,
      custom: store.sdict.custom,
      complete: store.sdict.complete,
      wordPracticeMode: settingStore.wordPracticeMode
    })
    // 把是否是第一次設置為 false
    settingStore.first = false
    // 跳轉到練習頁面
    nav('practice-words/' + store.sdict.id, {}, {taskWords: currentStudy.value})
  } else {
    window.umami?.track('no-dict') // 埋點：無字典
    Toast.warning('請先選擇一本詞典') // 提示
  }
}

</script>

<template>
    <BasePage> <!-- 基礎頁面組件 -->
        <Card> <!-- 卡片組件 -->
            <template #content> <!-- 內容插槽 -->
            <div class="flex flex-col md:flex-row gap-8"> <!-- 彈性佈局容器 -->
            <div class="flex-1 w-full flex flex-col justify-between"> <!-- 左側區域 -->
                <div class="flex gap-3"> <!-- 標題區 -->
                    <div class="p-1 flex justify-center items-center rounded-full bg-white"> <!-- 圖示背景 -->
                        <IconFluentBookNumber20Filled class="text-xl text-blue-600" /> <!-- 圖示 -->
                    </div>
                    <div @click="goDictDetail(store.sdict)" class="text-2xl font-bold cursor-pointer"> <!-- 標題點擊區域 -->
                        {{ store.sdict.name || '目前無正在學習的詞典' }} <!-- 顯示字典名稱或提示 -->
                    </div>
                </div>

                <template v-if="store.sdict.id"> <!-- 如果有選字典 -->
                    <div class="mt-4 flex flex-col gap-2"> <!-- 進度區 -->
                        <div class="">目前進度：{{ progressTextLeft }}</div> <!-- 進度文字 -->
                        <ProgressBar :value="store.currentStudyProgress" :showValue="false" class="h-2" /> <!-- 進度條 -->
                        <div class="text-sm flex justify-between"> <!-- 統計信息 -->
                            <span>已完成 {{ progressTextRight }} 詞 / 共 {{ store.sdict.words.length }} 詞</span> <!-- 統計 -->
                            <span v-if="store.sdict.id"> <!-- 如果有字典ID -->
                                預計完成日期：{{ _getAccomplishDate(store.sdict.words.length, store.sdict.perDayStudyNumber) }} <!-- 預計日期 -->
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center mt-4 gap-4"> <!-- 操作按鈕區 -->
                        <Button severity="info" size="small" @click="router.push('/dict-list')"> <!-- 選擇詞典按鈕 -->
                            <div class="flex justify-center items-center gap-1"> <!-- 按鈕內容容器 -->
                                <IconFluentArrowSwap20Regular /> <!-- 圖示 -->
                                <span>選擇詞典</span> <!-- 文字 -->
                            </div>
                        </Button>
                        <Button severity="info" size="small" v-if="store.sdict.id"
                            :disabled="!isSaveData"
                            @click="confirmAndExecute($event, isSaveData, '目前存在未完成的學習任務，修改會重新生成學習任務，是否繼續？', () => check(() => showChangeLastPracticeIndexDialog = true))"> <!-- 更改進度按鈕 -->
                            <div class="flex justify-center items-center gap-1"> <!-- 按鈕內容容器 -->
                                <IconFluentSlideTextTitleEdit20Regular /> <!-- 圖示 -->
                                <span>更改進度</span> <!-- 文字 -->
                            </div>
                        </Button>
                    </div>
                </template>

                <div class="flex items-center gap-4 mt-2 flex-1" v-else> <!-- 無字典時顯示 -->
                    <div class="title">請選擇一本詞典開始學習</div> <!-- 提示文字 -->
                    <Button id="step1" severity="primary" size="large" @click="router.push('/dict-list')"> <!-- 選擇詞典按鈕 -->
                        <div class="flex justify-center items-center gap-1"> <!-- 按鈕內容容器 -->
                            <IconFluentAdd16Regular /> <!-- 圖示 -->
                            <span>選擇詞典</span> <!-- 文字 -->
                        </div>
                    </Button>
                </div>
            </div>

            <!-- 分隔線 -->
            <div class="hidden md:block w-px bg-gray-300 dark:bg-gray-600 self-stretch"></div>
            <!-- 右側區域 -->
            <div class="flex-1 w-full transition-opacity duration-200"
                :class="!store.sdict.id && 'opacity-30 cursor-not-allowed'"> <!-- 右側區域，無字典時變淡 -->
                <div class="flex justify-between"> <!-- 任務標題區 -->
                    <div class="flex items-center gap-2"> <!-- 左側標題 -->
                        <div class="p-2 flex justify-center items-center rounded-full bg-white"> <!-- 圖示背景 -->
                            <IconFluentStar20Filled class="text-lg text-amber-500" /> <!-- 圖示 -->
                        </div>
                        <div class="text-xl font-bold"> <!-- 標題文字 -->
                            {{ isSaveData ? '上次任務' : '今日任務' }}
                        </div>
                        <span class="text-blue-600 cursor-pointer" v-if="store.sdict.id"
                            @click="showPracticeWordListDialog = true">詞表</span> <!-- 詞表按鈕 -->

                    </div>
                    <div class="flex gap-1 items-center" v-if="store.sdict.id"> <!-- 右側目標設定 -->
                        每日目標
                        <div style="color:#ac6ed1;" class="bg-purple-100 px-2 h-10 flex justify-center items-center text-2xl rounded"> <!-- 目標數字 -->
                            {{ store.sdict.id ? store.sdict.perDayStudyNumber : 0 }}
                        </div>
                        個單字
                        <Button severity="info" size="small"
                                :disabled="!isSaveData"
                                @click="confirmAndExecute($event, isSaveData, '目前存在未完成的學習任務，修改會重新生成學習任務，是否繼續？', () => check(() => showPracticeSettingDialog = true))"> <!-- 更改按鈕 -->
                            更改
                        </Button>
                    </div>
                </div>
                <div class="flex mt-4 justify-between"> <!-- 任務統計 -->
                    <div class="stat"> <!-- 新詞統計 -->
                        <div class="num">{{ currentStudy.new.length }}</div>
                        <div class="txt">新詞數</div>
                    </div>
                    <template v-if="settingStore.wordPracticeMode === WordPracticeMode.System"> <!-- 系統模式統計 -->
                        <div class="stat"> <!-- 複習上次 -->
                            <div class="num">{{ currentStudy.review.length }}</div>
                            <div class="txt">複習上次</div>
                        </div>
                        <div class="stat"> <!-- 複習之前 -->
                            <div class="num">{{ currentStudy.write.length }}</div>
                            <div class="txt">複習之前</div>
                        </div>
                    </template>
                </div>
                <div class="flex items-end mt-4"> <!-- 開始按鈕區 -->
                    <Button size="large" class="flex-1" :disabled="!store.sdict.id" :loading="loading"
                        @click="startPractice"> <!-- 開始學習按鈕 -->
                        <div class="flex items-center gap-2"> <!-- 內容容器 -->
                            <span class="leading-[2]">{{ isSaveData ? '繼續學習' : '開始學習' }}</span> <!-- 按鈕文字 -->
                            <IconFluentArrowCircleRight16Regular class="text-xl" /> <!-- 圖示 -->
                        </div>
                    </Button>

                    <Button v-if="store.sdict.id && store.sdict.lastLearnIndex" size="large" severity="warn" class="ml-2"
                        :loading="loading" @click="check(() => showShufflePracticeSettingDialog = true)"> <!-- 隨機複習按鈕 -->
                        <div class="flex items-center gap-2"> <!-- 內容容器 -->
                            <span class="leading-[2]">隨機複習</span> <!-- 文字 -->
                            <IconFluentArrowShuffle20Filled class="text-xl" /> <!-- 圖示 -->
                        </div>
                    </Button>
                </div>
            </div>
            </div>
            </template>
        </Card>
        <ConfirmPopup /> <!-- 確認彈窗組件 -->
    </BasePage>
</template>
