<script setup lang="ts">
import { _getAccomplishDays } from "@/utils";
import { watch, ref } from "vue";
import { useSettingStore } from "@/stores/setting.ts";
import Toast from "@/components/base/toast/Toast.ts";
import ChangeLastPracticeIndexDialog from "@/pages/word/components/ChangeLastPracticeIndexDialog.vue";
import { useRuntimeStore } from "@/stores/runtime.ts";

import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Slider from 'primevue/slider';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import Tooltip from 'primevue/tooltip';

const vTooltip = Tooltip;
const settings = useSettingStore()
const runtimeStore = useRuntimeStore()

// 使用 defineModel 對應父組件的 v-model
const model = defineModel<boolean>()

defineProps<{
  showLeftOption: boolean,
}>()

const emit = defineEmits<{
  ok: [];
}>()

const show = ref(false)
const tempPerDayStudyNumber = ref(0)
const tempLastLearnIndex = ref(0)
const tempPracticeMode = ref(0)
const tempDisableShowPracticeSettingDialog = ref(false)

function changePerDayStudyNumber() {
  runtimeStore.editDict.perDayStudyNumber = tempPerDayStudyNumber.value
  runtimeStore.editDict.lastLearnIndex = tempLastLearnIndex.value
  settings.wordPracticeMode = tempPracticeMode.value
  settings.disableShowPracticeSettingDialog = tempDisableShowPracticeSettingDialog.value
  model.value = false // 關閉 Dialog
  emit('ok')
}

// 監聽 model 變化，打開時初始化數據
watch(() => model.value, (n) => {
  if (n) {
    if (runtimeStore.editDict.id) {
      tempPerDayStudyNumber.value = runtimeStore.editDict.perDayStudyNumber || 10
      tempLastLearnIndex.value = runtimeStore.editDict.lastLearnIndex || 0
      tempPracticeMode.value = settings.wordPracticeMode
      tempDisableShowPracticeSettingDialog.value = settings.disableShowPracticeSettingDialog
    } else {
      Toast.warning('請先選擇一本詞典')
      model.value = false // 防止在沒有詞典時打開
    }
  }
})
</script>

<template>
  <Dialog v-model:visible="model" header="學習設定" modal :draggable="false" class="w-[90vw] md:w-[30rem]">
    <div class="flex flex-col gap-6 text-[var(--p-text-color)]">
      <!-- 模式選擇 -->
      <div class="flex gap-4 h-32 md:h-30">
        <div 
          class="flex-1 border rounded-lg p-4 cursor-pointer transition-colors flex flex-col items-center justify-center text-center"
          :class="tempPracticeMode === 0 ? 'bg-primary text-primary-contrast border-primary' : 'border-surface-300 dark:border-surface-600 hover:border-primary'"
          @click="tempPracticeMode = 0"
        >
          <div class="font-bold text-lg mb-2">智能模式</div>
          <div class="text-sm opacity-90">自動規劃學習、複習、聽寫、默寫</div>
        </div>
        <div 
          class="flex-1 border rounded-lg p-4 cursor-pointer transition-colors flex flex-col items-center justify-center text-center"
          :class="tempPracticeMode === 1 ? 'bg-primary text-primary-contrast border-primary' : 'border-surface-300 dark:border-surface-600 hover:border-primary'"
          @click="tempPracticeMode = 1"
        >
          <div class="font-bold text-lg mb-2">自由模式</div>
          <div class="text-sm opacity-90">自由練習，系統不強制複習與默寫</div>
        </div>
      </div>

      <!-- 統計資訊 -->
      <div class="text-center bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
        <p class="leading-loose">
          從第 <span class="text-2xl font-bold text-primary mx-1">{{ tempLastLearnIndex }}</span> 個開始，
          每日 <span class="text-2xl font-bold text-primary mx-1">{{ tempPerDayStudyNumber }}</span> 個，
          預計 <span class="text-2xl font-bold text-primary mx-1">{{ 
            _getAccomplishDays((runtimeStore.editDict.words?.length || 0) - (tempLastLearnIndex || 0), tempPerDayStudyNumber) 
          }}</span> 天完成
        </p>
      </div>

      <!-- 每日學習 Slider -->
      <div class="flex flex-col gap-2">
        <span class="font-medium">每日學習</span>
        <div class="flex items-center gap-4">
          <Slider v-model="tempPerDayStudyNumber" :min="10" :max="200" :step="10" class="flex-1" />
          <InputNumber 
            v-model="tempPerDayStudyNumber" 
            :min="10" 
            :max="200" 
            :step="10" 
            :pt="{ input: { class: 'text-center' } }" 
            class="w-36"
            showButtons 
            buttonLayout="horizontal" 
            :allowEmpty="false"
          />
        </div>
      </div>

      <!-- 學習進度 Slider -->
      <div class="flex flex-col gap-2">
        <span class="font-medium">學習進度</span>
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-4">
             <Slider v-model="tempLastLearnIndex" :min="0" :max="runtimeStore.editDict.words?.length || 100" :step="1" class="flex-1" />
             <span class="w-16 text-right font-mono">{{ tempLastLearnIndex }}</span>
          </div>
          <Button label="從詞典選起始位置" severity="secondary" outlined size="small" @click="show = true" class="w-full" />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex items-center justify-between w-full mt-4">
        <div v-if="showLeftOption" class="flex items-center gap-2">
           <Checkbox v-model="tempDisableShowPracticeSettingDialog" binary inputId="notShowAgain" />
           <label for="notShowAgain" class="text-sm cursor-pointer select-none text-muted-color" v-tooltip="'可在設定頁面更改'">
             保持默認，不再顯示
           </label>
        </div>
        <div class="flex gap-2 ml-auto">
          <Button label="取消" severity="secondary" text @click="model = false" />
          <Button label="確定" @click="changePerDayStudyNumber" />
        </div>
      </div>
    </template>
  </Dialog>

  <ChangeLastPracticeIndexDialog
    v-model="show"
    @ok="e => {
        tempLastLearnIndex = e
        show = false
      }"
  />
</template>

<style scoped>
/* 移除 scoped scss，全部使用 Tailwind CSS */
</style>
