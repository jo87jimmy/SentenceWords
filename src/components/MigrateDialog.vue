<script setup lang="ts">

import {Origin} from "@/config/env.ts";
import {set} from 'idb-keyval'
import {defineAsyncComponent} from "vue";
import Toast from "@/components/base/toast/Toast.ts";

const Dialog = defineAsyncComponent(() => import('@/components/dialog/Dialog.vue'))

const model = defineModel<boolean>()

const emit = defineEmits<{ ok: [] }>()

async function migrateFromOldSite() {
  return new Promise(async (resolve, reject) => {
    // 舊網域位址
    var OLD_ORIGIN = 'https://2study.top';
    // 需要遷移的 IndexedDB key
    var IDB_KEYS = [
      'type-words-app-version',
      'typing-word-dict',
      'typing-word-setting',
      'typing-word-files'
    ];
    // 需要遷移的 localStorage key
    var LS_KEYS = [
      'PracticeSaveWord',
      'PracticeSaveArticle'
    ];
    const migrateWin = window.open(`${OLD_ORIGIN}/migrate.html`, '_blank', 'width=400,height=400');

    if (!migrateWin) return reject('彈跳視窗被封鎖，請在網址列最右邊，點擊允許彈跳視窗');

    async function onMessage(event:any) {
      if (event.origin !== OLD_ORIGIN) return;
      if (event.data?.type !== 'MIGRATION_RESULT') return;
      const payload = event.data.payload;
      console.log('payload', payload);

      // 寫入 localStorage
      LS_KEYS.forEach(key => {
        if (payload.localStorage[key] !== undefined) {
          localStorage.setItem(key, payload.localStorage[key]);
        }
      });

      // 寫入 IndexedDB
      for (let key of IDB_KEYS) {
        if (payload.indexedDB[key] !== undefined) {
          await set(key, payload.indexedDB[key]);
        }
      }

      window.removeEventListener('message', onMessage);
      resolve(true);
    }

    window.addEventListener('message', onMessage);

    // 等窗口加载完毕后发请求
    const timer = setInterval(() => {
      if (!migrateWin || migrateWin.closed) {
        clearInterval(timer);
        reject('遷移視窗已關閉');
      } else {
        try {
          migrateWin.postMessage({type: 'REQUEST_MIGRATION_DATA'}, OLD_ORIGIN);
        } catch (e) {
          // 跨域安全錯誤忽略，等視窗完全載入後再試
        }
      }
    }, 100);
  });
}

async function transfer() {
  try {
    await migrateFromOldSite();
    localStorage.setItem('__migrated_from_2study_top__', '1');
    console.log('遷移完成');
    Toast.success('遷移完成')
    model.value = false
    emit('ok')
  } catch (e) {
    Toast.error('遷移失敗：' + e)
    console.error('遷移失敗', e);
  }
}
</script>

<template>
  <Dialog v-model="model"
          :footer="true"
          @ok="transfer"
          confirmButtonText="遷移資料"
          title="遷移資料">
    <div class="px-4 flex-col center w-100">
      <h2 class="text-align-center">
        本網站已啟用新網域 <span class="color-blue">{{ Origin }}</span>
      </h2>
      <h3>
        舊網域即將停用，由於瀏覽器安全限制，新舊網站資料無法互通，需要您手動點擊轉移資料
      </h3>
      <div>
        如果您不想此時遷移，關閉彈跳視窗後，您可隨時在「設定」 -> 「資料管理」 裡面再次進行
      </div>
    </div>
  </Dialog>
</template>

<style scoped lang="scss">

</style>