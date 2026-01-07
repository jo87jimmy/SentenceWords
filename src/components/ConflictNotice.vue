<script setup lang="ts">

import {defineAsyncComponent, watch} from "vue";
import {useSettingStore} from "@/stores/setting.ts";
import { jump2Feedback } from "@/utils";
import {ref} from "vue";
const Dialog = defineAsyncComponent(() => import('@/components/dialog/Dialog.vue'))

let settingStore = useSettingStore()
let show = ref(false)

watch(() => settingStore.load, (n) => {
  if (n && settingStore.conflictNotice) {
    setTimeout(() => {
      show.value = true
    }, 300)
  }
}, {immediate: true})

</script>

<template>
  <Dialog v-model="show"
          title="提示"
          footer
          :closeOnClickBg="false"
          cancel-button-text="不再提醒"
          confirm-button-text="關閉"
          @cancel="settingStore.conflictNotice = false"
  >
    <div class="card w-120 center flex-col color-main py-0 mb-0 bg-white dark:bg-zinc-800">
      <div>
        <div class="text">
          <div>
            1、 如果您安裝了 <span class="font-bold text-red">「調速」「Vim」</span> 等外掛/腳本，將導致本網站無法正常使用。
          </div>
          <div>
            因為它們會強行接管鍵盤按下事件，<span class="font-bold text-red">導致使用本網站時按 'A'、 'S' 等等按鈕無反應</span>
          </div>
        </div>
        <div class="pl-4">
          <div>①：在對應外掛/腳本的設定裡面排除本網站</div>
          <div>②：臨時禁用對應外掛/腳本</div>
          <div>③：請開啟瀏覽器無痕模式嘗試</div>
        </div>
        <div class="text mt-2">
          2、如果您未安裝以上外掛/腳本，還是無法使用
        </div>
        <div class="pl-4">
          <div>①：請開啟瀏覽器無痕模式嘗試</div>
          <div>②：無痕模式下無法正常使用，請給<span class="color-link mx-1 cp" @click="jump2Feedback">點此</span>給作者反饋
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>
