<script setup lang="ts">
import { useBaseStore } from "@/stores/base.ts";
import { ShortcutKey, type Statistics, type TaskWords } from "@/types/types.ts";
import { emitter, EventKey, useEvents } from "@/utils/eventBus.ts";
import { useSettingStore } from "@/stores/setting.ts";
import { usePracticeStore } from "@/stores/practice.ts";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { inject, watch, computed, ref } from "vue";
import isoWeek from 'dayjs/plugin/isoWeek'
import { msToHourMinute } from "@/utils";
import ChannelIcons from "@/components/ChannelIcons.vue";
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';

dayjs.extend(isoWeek)
dayjs.extend(isBetween);

const store = useBaseStore()
const settingStore = useSettingStore()
const statStore = usePracticeStore()
const model = defineModel({default: false})
let list = ref<boolean[]>([])
let dictIsEnd = ref(false)
let practiceTaskWords = inject<TaskWords>('practiceTaskWords')

function calcWeekList() {
  // 獲取本週的起止時間
  const startOfWeek = dayjs().startOf('isoWeek'); // 週一
  const endOfWeek = dayjs().endOf('isoWeek');     // 週日
  // 初始化 7 天的陣列，默認 false
  const weekList = Array(7).fill(false);

  store.sdict.statistics.forEach(item => {
    const date = dayjs(item.startDate);
    if (date.isBetween(startOfWeek, endOfWeek, null, '[]')) {
      let idx = date.day();
      // dayjs().day() 0=週日, 1=週一, ..., 6=週六
      // 需要轉換為 0=週一, ..., 6=週日
      if (idx === 0) {
        idx = 6; // 週日放到最後
      } else {
        idx = idx - 1; // 其餘前移一位
      }
      weekList[idx] = true;
    }
  });
  // 今天的必定為 true，但上面邏輯依賴歷史統計，可能還沒存，所以目前先不管
  // 原代碼強制 weekList[2] = true 是測試用？ 這裡保留原邏輯但註釋掉測試行，或者假設需要顯示當天？
  // 下面這行看起來是 debug 用的，我先註釋掉或移除，根據邏輯應該是顯示真實數據
  // weekList[2] = true; 
  // 修正：應該標記今天。
  const todayIdx = dayjs().day() === 0 ? 6 : dayjs().day() - 1;
  weekList[todayIdx] = true;

  list.value = weekList;
}

// 監聽 model 彈窗打開時重新計算
watch(model, (newVal) => {
  if (newVal) {
    dictIsEnd.value = false;
    let data: Statistics = {
      spend: statStore.spend,
      startDate: statStore.startDate,
      total: statStore.total,
      wrong: statStore.wrong,
      new: statStore.newWordNumber,
      review: statStore.reviewWordNumber + statStore.writeWordNumber
    }
    window.umami?.track('endStudyWord', {
      name: store.sdict.name,
      spend: Number(statStore.spend / 1000 / 60).toFixed(1),
      index: store.sdict.lastLearnIndex,
      perDayStudyNumber: store.sdict.perDayStudyNumber,
      custom: store.sdict.custom,
      complete: store.sdict.complete,
      str: `name:${store.sdict.name},per:${store.sdict.perDayStudyNumber},spend:${Number(statStore.spend / 1000 / 60).toFixed(1)},index:${store.sdict.lastLearnIndex}`
    })
    //如果 shuffle 陣列不為空，就說明是複習，不用修改 lastLearnIndex
    if (!practiceTaskWords?.shuffle.length) {
      store.sdict.lastLearnIndex = store.sdict.lastLearnIndex + statStore.newWordNumber
      if (store.sdict.lastLearnIndex >= store.sdict.length) {
        dictIsEnd.value = true;
        store.sdict.complete = true
        store.sdict.lastLearnIndex = 0
      }
    }

    store.sdict.statistics.push(data as any)
    calcWeekList(); // 新增：計算本週學習記錄
  }
})

const close = () => model.value = false

useEvents([
  //特意註釋掉，因為在練習界面用快捷鍵下一組時，需要判斷是否在結算界面
  // [ShortcutKey.NextChapter, close],
  [ShortcutKey.RepeatChapter, close],
  [ShortcutKey.DictationChapter, close],
])

function options(emitType: string) {
  emitter.emit(emitType)
  close()
}

// 計算學習進度百分比
const studyProgress = computed(() => {
  if (!store.sdict.length) return 0
  return Math.round((store.sdict.lastLearnIndex / store.sdict.length) * 100)
})

// 計算正確率
const accuracyRate = computed(() => {
  if (statStore.total === 0) return 100
  return Math.round(((statStore.total - statStore.wrong) / statStore.total) * 100)
})

// 獲取鼓勵文案
const encouragementText = computed(() => {
  const rate = accuracyRate.value
  if (rate >= 95) return '🎉 太棒了！繼續保持！'
  if (rate >= 85) return '👍 表現很好，再接再厲！'
  if (rate >= 70) return '💪 不錯的成績，繼續加油！'
  return '🌟 每次練習都是進步，堅持下去！'
})

// 格式化學習時間
const formattedStudyTime = computed(() => {
  const time = msToHourMinute(statStore.spend)
  return time.replace('小時', 'h ').replace('分鐘', 'm') // 原函數可能返回簡體，這裡直接替換
})

calcWeekList(); // 新增：計算本週學習記錄

</script>

<template>
  <Dialog
      v-model:visible="model"
      modal
      :dismissableMask="false"
      :closable="false"
      :showHeader="false"
      :pt="{
        root: { class: '!bg-transparent !shadow-none !border-none w-[90vw] max-w-[550px]' },
        mask: { class: 'backdrop-blur-sm' },
        content: { class: '!p-0 !bg-transparent !shadow-none !border-none !rounded-2xl' }
      }"
  >
    <div class="p-8 px-4 md:px-8 bg-[var(--bg-card-primary)] rounded-2xl space-y-6 shadow-xl border border-gray-700/50">
      <!-- Header Section -->
      <div class="text-center relative">
        <div
          class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
          <template v-if="practiceTaskWords?.shuffle.length">
            🎯 隨機複習完成
          </template>
          <template v-else>
            🎉 今日任務完成
          </template>
        </div>
        <p class="font-medium text-lg text-gray-200">{{ encouragementText }}</p>
      </div>

      <!-- Main Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Study Time -->
        <div class="bg-[var(--bg-card-secend)] rounded-xl p-3 text-center border border-gray-700/50 flex flex-col items-center justify-center h-24">
          <IconFluentClock20Regular class="text-purple-400 w-6 h-6 mx-auto mb-1"/>
          <div class="text-sm mb-1 font-medium text-gray-400">學習時長</div>
          <div class="text-xl font-bold text-gray-100">{{ formattedStudyTime }}</div>
        </div>

        <!-- Accuracy Rate -->
        <div class="bg-[var(--bg-card-secend)] rounded-xl p-3 text-center border border-gray-700/50 flex flex-col items-center justify-center h-24">
          <IconFluentTarget20Regular class="text-purple-400 w-6 h-6 mx-auto mb-1"/>
          <div class="text-sm mb-1 font-medium text-gray-400">正確率</div>
          <div class="text-xl font-bold text-gray-100">{{ accuracyRate }}%</div>
        </div>

        <!-- New Words -->
        <div class="bg-[var(--bg-card-secend)] rounded-xl p-3 text-center border border-gray-700/50 flex flex-col items-center justify-center h-24">
          <IconFluentSparkle20Regular class="text-purple-400 w-6 h-6 mx-auto mb-1"/>
          <div class="text-sm mb-1 font-medium text-gray-400">新詞</div>
          <div class="text-xl font-bold text-gray-100">{{ statStore.newWordNumber }}</div>
        </div>

        <!-- Review Words -->
        <div class="bg-[var(--bg-card-secend)] rounded-xl p-3 text-center border border-gray-700/50 flex flex-col items-center justify-center h-24">
          <IconFluentBook20Regular class="text-purple-400 w-6 h-6 mx-auto mb-1"/>
          <div class="text-sm mb-1 font-medium text-gray-400">複習</div>
          <div class="text-xl font-bold text-gray-100">{{ statStore.reviewWordNumber + statStore.writeWordNumber }}</div>
        </div>
      </div>

      <div class="w-full flex flex-col md:flex-row gap-4">
        <div class="space-y-4 flex-1">

          <!-- Weekly Progress -->
          <div class="bg-[var(--bg-card-secend)] rounded-xl p-3 border border-gray-700/50">
            <div class="text-center mb-3">
              <div class="text-lg font-semibold text-gray-200">本週學習記錄</div>
            </div>
            <div class="flex justify-between gap-2">
              <div
                v-for="(item, i) in list"
                :key="i"
                class="flex-1 text-center py-2 rounded-lg transition-all"
                :class="item ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-700/30 text-gray-500'"
              >
                <div class="text-xs font-semibold mb-1">週{{ ['一','二','三','四','五','六','日'][i] }}</div>
                <div class="w-1.5 h-1.5 rounded-full mx-auto"
                     :class="item ? 'bg-white' : 'bg-gray-600'"></div>
              </div>
            </div>
          </div>

          <!-- Progress Overview -->
          <div class="bg-[var(--bg-card-secend)] rounded-xl py-3 px-5 border border-gray-700/50">
            <div class="flex justify-between items-center mb-2">
              <div class="text-lg font-semibold text-gray-200">學習進度</div>
              <div class="text-xl font-bold text-purple-400">{{ studyProgress }}%</div>
            </div>
            <ProgressBar :value="studyProgress" :showValue="false" class="h-2.5 !bg-gray-700" :pt="{ value: { class: '!bg-purple-500' } }"></ProgressBar>
            <div class="flex justify-between text-xs font-medium mt-3 text-gray-400">
              <span>已學習: {{ store.sdict.lastLearnIndex }}</span>
              <span>總詞數: {{ store.sdict.length }}</span>
            </div>
          </div>
        </div>
        <div class="flex flex-col justify-center">
            <ChannelIcons class="scale-90 origin-top"/>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Button
          v-tooltip.bottom="settingStore.shortcutKeyMap[ShortcutKey.RepeatChapter]"
          @click="options(EventKey.repeatStudy)"
          severity="help"
          outlined
          class="w-full justify-center !flex gap-2"
        >
          <IconFluentArrowClockwise20Regular class="w-5 h-5"/>
          <span class="whitespace-nowrap">重學一遍</span>
        </Button>

        <Button
          v-tooltip.bottom="settingStore.shortcutKeyMap[ShortcutKey.NextChapter]"
          @click="options(EventKey.continueStudy)"
          severity="help"
          class="w-full justify-center !flex gap-2"
        >
          <IconFluentPlay20Regular class="w-5 h-5"/>
          <span class="whitespace-nowrap">{{ dictIsEnd ? '從頭開始' : '再來一組' }}</span>
        </Button>

        <Button
          v-tooltip.bottom="settingStore.shortcutKeyMap[ShortcutKey.NextRandomWrite]"
          @click="options(EventKey.randomWrite)"
          severity="secondary"
          outlined
          class="w-full justify-center !flex gap-2"
        >
          <IconFluentPen20Regular class="w-5 h-5"/>
          <span class="whitespace-nowrap">繼續默寫</span>
        </Button>

        <Button 
          @click="$router.back"
          severity="secondary"
          outlined
          class="w-full justify-center !flex gap-2"
        >
          <IconFluentHome20Regular class="w-5 h-5"/>
          <span class="whitespace-nowrap">返回主頁</span>
        </Button>
      </div>
    </div>
  </Dialog>
</template>

