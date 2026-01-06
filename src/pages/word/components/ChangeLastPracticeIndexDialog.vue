<script setup lang="ts">
import BaseTable from "@/components/BaseTable.vue";
import WordItem from "@/components/WordItem.vue";
import { useRuntimeStore } from "@/stores/runtime.ts";
import Dialog from 'primevue/dialog';
import { ref, watch } from "vue";

const model = defineModel<boolean>()
const runtimeStore = useRuntimeStore()

// 使用 ref 存儲列表副本
const wordList = ref<any[]>([])

// 監聽 model，當 Dialog 打開時初始化數據
watch(model, (val) => {
  if (val) {
    // 複製一份數據以供列表顯示
    wordList.value = [...(runtimeStore.editDict.words || [])]
  }
}, { immediate: true })

defineEmits<{
  ok: [number]
}>()
</script>

<template>
  <Dialog 
    v-model:visible="model" 
    header="修改學習進度" 
    modal 
    maximizable 
    :draggable="false"
    class="w-[95vw] md:w-[60rem]"
    :contentStyle="{ height: '80vh', padding: '1rem' }"
  >
    <div class="h-full">
      <BaseTable
          class="h-full"
          v-model:list="wordList"
          :loading="false"
          :show-toolbar="false"
      >
        <template v-slot="item">
          <WordItem
              class="cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors rounded p-2"
              @click="$emit('ok', item.index)"
              :item="item.item"
              :show-translate="false"
              :index="item.index"
              :show-option="false"
          />
        </template>
      </BaseTable>
    </div>
  </Dialog>
</template>

<style scoped>
</style>
