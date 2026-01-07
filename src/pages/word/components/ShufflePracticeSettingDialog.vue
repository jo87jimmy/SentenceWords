<script setup lang="ts">

import Slider from "@/components/base/Slider.vue";
import {defineAsyncComponent, watch} from "vue";
import {useBaseStore} from "@/stores/base.ts";
import { ref } from "vue";

const Dialog = defineAsyncComponent(() => import('@/components/dialog/Dialog.vue'))

const store = useBaseStore()

const model = defineModel<boolean>()

const emit = defineEmits<{
  ok: [val: number];
}>()

let num = ref(0)
let min = ref(0)

watch(() => model.value, (n) => {
  if (n) {
    debugger
    const nVal = Math.floor(store.sdict.lastLearnIndex / 3)
    num.value = nVal > 50 ? 50 : nVal
    min.value = num.value < 10 ? num.value : 10
  }
})
</script>

<template>
  <Dialog v-model="model" title="隨機復習設定"
          :footer="true"
          @ok="emit('ok',num)">
    <div class="target-modal color-main">
      <div class="flex gap-4 items-end  mb-2">
        <span>隨機復習：<span class="font-bold">{{ store.sdict.name }}</span></span>
        <span class="text-3xl mx-2 lh">{{ num }}</span>個詞
      </div>
      <div class="flex gap-space">
        <span class="shrink-0">隨機數量</span>
        <Slider :min="min"
                :step="10"
                show-text
                class="m-1"
                :max="store.sdict.lastLearnIndex"
                v-model="num"/>
      </div>
    </div>
  </Dialog>
</template>

<style scoped lang="scss">

.target-modal {
  width: 30rem;
  padding: 0 var(--space);

  .lh {
    color: rgb(176, 116, 211)
  }

  .mode-item {
    @apply w-50% border border-blue border-solid p-2 rounded-lg cursor-pointer;
  }

  .active {
    @apply bg-blue color-white;
  }
}
</style>
