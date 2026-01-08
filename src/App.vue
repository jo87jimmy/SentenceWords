<script setup lang="ts">
import { onMounted, watch } from "vue";
import { type BaseState, useBaseStore } from "@/stores/base.ts";
import { useRuntimeStore } from "@/stores/runtime.ts";
import { useSettingStore } from "@/stores/setting.ts";
import useTheme from "@/hooks/theme.ts";
import { shakeCommonDict } from "@/utils";
import { get, set } from 'idb-keyval'

import { DictId } from "@/types/types.ts";
import { APP_VERSION, AppEnv, LOCAL_FILE_KEY, Origin, SAVE_DICT_KEY, SAVE_SETTING_KEY } from "@/config/env.ts";
import { syncSetting } from "@/apis";
import { useUserStore } from "@/stores/user.ts";
import MigrateDialog from "@/components/MigrateDialog.vue";
import { ref } from 'vue';
const store = useBaseStore()
const runtimeStore = useRuntimeStore()
const settingStore = useSettingStore()
const userStore = useUserStore()
const { setTheme } = useTheme()

let lastAudioFileIdList: string[] = []
watch(store.$state, (n: BaseState) => {
  let data = shakeCommonDict(n)
  set(SAVE_DICT_KEY.key, JSON.stringify({ val: data, version: SAVE_DICT_KEY.version }))

  //筛选自定义和收藏
  let bookList = data.article.bookList.filter(v => v.custom || [DictId.articleCollect].includes(v.id))
  let audioFileIdList: string[] = []
  bookList.forEach(v => {
    //筛选 audioFileId 字体有值的
    v.articles.filter(s => !s.audioSrc && s.audioFileId).forEach(a => {
      //所有 id 存起来，下次直接判断字符串是否相等，因为这个watch会频繁调用
      audioFileIdList.push(a.audioFileId)
    })
  })
  if (audioFileIdList.toString() !== lastAudioFileIdList.toString()) {
    let result: { id: string, file: Blob }[] = []
    //删除未使用到的文件
    get(LOCAL_FILE_KEY).then((fileList: Array<{ id: string, file: Blob }>) => {
      if (fileList && fileList.length > 0) {
        audioFileIdList.forEach(a => {
          let item = fileList.find(b => b.id === a)
          item && result.push(item)
        })
        set(LOCAL_FILE_KEY, result)
        lastAudioFileIdList = audioFileIdList
      }
    })
  }
})

watch(() => settingStore.$state, (n) => {
  set(SAVE_SETTING_KEY.key, JSON.stringify({ val: n, version: SAVE_SETTING_KEY.version }))
  if (AppEnv.CAN_REQUEST) {
    syncSetting(null, settingStore.$state)
  }
}, { deep: true })

async function init() {
  await userStore.init()
  await store.init()
  await settingStore.init()
  store.load = true

  setTheme(settingStore.theme)

  if (settingStore.first) {
    set(APP_VERSION.key, APP_VERSION.version)
  } else {
    get(APP_VERSION.key).then(r => {
      runtimeStore.isNew = r ? (APP_VERSION.version > Number(r)) : true
    })
  }
  window.umami?.track('host', { host: window.location.host })
}

onMounted(init)

//迁移数据
let showTransfer = ref(false)
onMounted(() => {
  if (new URLSearchParams(window.location.search).get('from_old_site') === '1' && location.origin === Origin) {
    if (localStorage.getItem('__migrated_from_2study_top__')) return;
    setTimeout(() => {
      showTransfer.value = true
    }, 1000)
  }
})
</script>

<template>
  <router-view></router-view>
  <MigrateDialog v-model="showTransfer" @ok="init" />
</template>