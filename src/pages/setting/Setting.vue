<script setup lang="ts">
import { nextTick, ref, watch ,computed} from "vue";
import { useSettingStore } from "@/stores/setting.ts";
import { getShortcutKey, useEventListener } from "@/hooks/event.ts";
import { checkAndUpgradeSaveDict, checkAndUpgradeSaveSetting, cloneDeep, loadJsLib, sleep } from "@/utils";
import { DefaultShortcutKeyMap } from "@/types/types.ts";
import BaseButton from "@/components/BaseButton.vue";
import { useBaseStore } from "@/stores/base.ts";
import {
  APP_NAME,
  APP_VERSION,
  Host,
  LIB_JS_URL,
  LOCAL_FILE_KEY,
  PracticeSaveArticleKey,
  PracticeSaveWordKey
} from "@/config/env.ts";
import BasePage from "@/components/BasePage.vue";
import Toast from '@/components/base/toast/Toast.ts'
import { set } from "idb-keyval";
import { useRuntimeStore } from "@/stores/runtime.ts";
import { useExport } from "@/hooks/export.ts";
import MigrateDialog from "@/components/MigrateDialog.vue";
import Log from "@/pages/setting/Log.vue";
import About from "@/components/About.vue";
import CommonSetting from "@/components/setting/CommonSetting.vue";
import ArticleSettting from "@/components/setting/ArticleSettting.vue";
import WordSetting from "@/components/setting/WordSetting.vue";

const emit = defineEmits<{
  toggleDisabledDialogEscKey: [val: boolean]
}>()

const tabIndex = ref(0)
const settingStore = useSettingStore()
const runtimeStore = useRuntimeStore()
const store = useBaseStore()
//在Setting顯示，最後一次提交 (Commit) 的哈希值 (Hash)，用於顯示版本號(除錯使用)
const gitLastCommitHash = ref(LATEST_COMMIT_HASH);

let editShortcutKey = ref('')

const disabledDefaultKeyboardEvent = computed(() => {
  return editShortcutKey.value && tabIndex.value === 3
})

watch(() => disabledDefaultKeyboardEvent.value, v => {
  emit('toggleDisabledDialogEscKey', !!v)
})

// 监听编辑快捷键状态变化，自动聚焦输入框
watch(() => editShortcutKey.value, (newVal) => {
  if (newVal) {
    // 使用nextTick确保DOM已更新
    nextTick(() => {
      focusShortcutInput()
    })
  }
})

useEventListener('keydown', (evt: Event) => {
  const e = evt as KeyboardEvent
  if (!disabledDefaultKeyboardEvent.value) return

  // 确保阻止浏览器默认行为
  e.preventDefault()
  e.stopPropagation()

  let shortcutKey = getShortcutKey(e)
  // console.log('e', e, e.keyCode, e.ctrlKey, e.altKey, e.shiftKey)
  // console.log('key', shortcutKey)

  // if (shortcutKey[shortcutKey.length-1] === '+') {
  //   settingStore.shortcutKeyMap[editShortcutKey] = DefaultShortcutKeyMap[editShortcutKey]
  //   return ElMessage.warning('设备失败！')
  // }

  if (editShortcutKey.value) {
    if (shortcutKey === 'Delete') {
      settingStore.shortcutKeyMap[editShortcutKey.value] = ''
    } else {
      // 忽略单独的修饰键
      if (shortcutKey === 'Ctrl+' || shortcutKey === 'Alt+' || shortcutKey === 'Shift+' ||
          e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift') {
        return;
      }

      for (const [k, v] of Object.entries(settingStore.shortcutKeyMap)) {
        if (v === shortcutKey && k !== editShortcutKey.value) {
          settingStore.shortcutKeyMap[editShortcutKey.value] = DefaultShortcutKeyMap[editShortcutKey.value as keyof typeof DefaultShortcutKeyMap]
          return Toast.warning('快捷鍵重複！')
        }
      }
      settingStore.shortcutKeyMap[editShortcutKey.value] = shortcutKey
    }
  }
})

function handleInputBlur() {
  // 输入框失焦时结束编辑状态
  editShortcutKey.value = ''
}

function handleBodyClick() {
  if (editShortcutKey.value) {
    editShortcutKey.value = ''
  }
}

function focusShortcutInput() {
  // 找到当前正在编辑的快捷键输入框
  const inputElements = document.querySelectorAll('.set-key input')
  if (inputElements && inputElements.length > 0) {
    // 聚焦第一个找到的输入框
    const inputElement = inputElements[0] as HTMLInputElement
    inputElement.focus()
  }
}

// 快捷键中文名称映射
function getShortcutKeyName(key: string): string {
  const shortcutKeyNameMap: Record<string, string> = {
    'ShowWord': '顯示單字',
    'EditArticle': '編輯文章',
    'Next': '下一個',
    'Previous': '上一個',
    'ToggleSimple': '切換已掌握狀態',
    'ToggleCollect': '切換收藏狀態',
    'NextChapter': '下一組',
    'PreviousChapter': '上一組',
    'RepeatChapter': '重複本組',
    'DictationChapter': '默寫本組',
    'PlayWordPronunciation': '播放發音',
    'ToggleShowTranslate': '切換顯示翻譯',
    'ToggleDictation': '切換默寫模式',
    'ToggleTheme': '切換主題',
    'ToggleConciseMode': '切換簡潔模式',
    'TogglePanel': '切換面板',
    'RandomWrite': '隨機默寫',
    'NextRandomWrite': '繼續隨機默寫',
    'KnowWord': '認識單字',
    'UnknownWord': '不認識單字',
  }

  return shortcutKeyNameMap[key] || key
}

function resetShortcutKeyMap() {
  editShortcutKey.value = ''
  settingStore.shortcutKeyMap = cloneDeep(DefaultShortcutKeyMap)
  Toast.success('恢復成功')
}

let importLoading = ref(false)

const { loading: exportLoading, exportData } = useExport()

function importJson(str: string, notice: boolean = true) {
  importLoading.value = true
  let obj = {
    version: -1,
    val: {
      setting: {},
      dict: {},
      [PracticeSaveWordKey.key]: {},
      [PracticeSaveArticleKey.key]: {},
      [APP_VERSION.key]: {},
    }
  }
  try {
    obj = JSON.parse(str)
    let data = obj.val
    let settingState = checkAndUpgradeSaveSetting(data.setting)
    settingState.load = true
    settingStore.setState(settingState)
    let baseState = checkAndUpgradeSaveDict(data.dict)
    baseState.load = true
    store.setState(baseState)
    if (obj.version >= 3) {
      try {
        let save: any = obj.val[PracticeSaveWordKey.key] || {}
        if (save.val && Object.keys(save.val).length > 0) {
          localStorage.setItem(PracticeSaveWordKey.key, JSON.stringify(obj.val[PracticeSaveWordKey.key]))
        }
      } catch (e) {
        //todo 上报
      }
    }
    if (obj.version >= 4) {
      try {
        let save: any = obj.val[PracticeSaveArticleKey.key] || {}
        if (save.val && Object.keys(save.val).length > 0) {
          localStorage.setItem(PracticeSaveArticleKey.key, JSON.stringify(obj.val[PracticeSaveArticleKey.key]))
        }
      } catch (e) {
        //todo 上报
      }
      try {
        let r: any = obj.val[APP_VERSION.key] || -1
        set(APP_VERSION.key, r)
        runtimeStore.isNew = r ? (APP_VERSION.version > Number(r)) : true
      } catch (e) {
        //todo 上报
      }
    }
    notice && Toast.success('匯入成功！')
  } catch (err) {
    return Toast.error('匯入失敗！')
  } finally {
    importLoading.value = false
  }
}

let timer = -1
async function beforeImport() {
  importLoading.value = true
  await exportData('已自動備份資料', 'SentenceWords資料備份.zip')
  await sleep(1500)
  const d = document.querySelector('#import') as HTMLInputElement | null
  d?.click()
  timer = window.setTimeout(()=>importLoading.value = false, 1000)
}

async function importData(e: any) {
  clearTimeout(timer)
  importLoading.value = true
  let file = e.target.files[0]
  if (!file) return importLoading.value = false
  if (file.name.endsWith(".json")) {
    let reader = new FileReader();
    reader.onload = function (v) {
      let str: any = v.target?.result;
      if (str) {
        importJson(str)
      }
    }
    reader.readAsText(file);
  } else if (file.name.endsWith(".zip")) {
    try {
      const JSZip = await loadJsLib('JSZip', LIB_JS_URL.JSZIP);
      const zip = await JSZip.loadAsync(file);

      const dataFile = zip.file("data.json");
      if (!dataFile) {
        return Toast.error("缺少 data.json，匯入失敗");
      }

      const mp3Folder = zip.folder("mp3");
      if (mp3Folder) {
        const records: { id: string; file: Blob }[] = [];
        for (const filename in zip.files) {
          if (filename.startsWith("mp3/") && filename.endsWith(".mp3")) {
            const entry = zip.file(filename);
            if (!entry) continue;
            const blob = await entry.async("blob");
            const id = filename.replace(/^mp3\//, "").replace(/\.mp3$/, "");
            records.push({ id, file: blob });
          }
        }
        await set(LOCAL_FILE_KEY, records);
      }

      const str = await dataFile.async("string");
      importJson(str, false)

      Toast.success("匯入成功！");
    } catch (e) {
      Toast.error((e as any)?.message || e || '匯入失敗')
    } finally {
      importLoading.value = false
    }
  } else {
    Toast.error("不支援的檔案類型");
  }
  importLoading.value = false
}

let isNewHost = ref(window.location.host === Host)

let showTransfer = ref(false)

function transferOk() {
  setTimeout(() => {
    window.location.href = '/words'
  }, 1500)
}
</script>

<template>
  <BasePage>
    <div class="setting text-md card flex flex-col" style="height: calc(100vh - 3rem);">
      <div class="page-title text-align-center">設定</div>
      <div class="flex flex-1 overflow-hidden gap-4">
        <div class="left">
          <div class="tabs">
            <div class="tab" :class="tabIndex === 0 && 'active'" @click="tabIndex = 0">
              <IconFluentSettings20Regular width="20"/>
              <span>一般設定</span>
            </div>
            <div class="tab" :class="tabIndex === 1 && 'active'" @click="tabIndex = 1">
              <IconFluentTextUnderlineDouble20Regular width="20"/>
              <span>單字設定</span>
            </div>
            <div class="tab" :class="tabIndex === 2 && 'active'" @click="tabIndex = 2">
              <IconFluentBookLetter20Regular width="20"/>
              <span>文章設定</span>
            </div>
            <div class="tab" :class="tabIndex === 4 && 'active'" @click="tabIndex = 4">
              <IconFluentDatabasePerson20Regular width="20"/>
              <span>資料管理</span>
            </div>

            <div class="tab" :class="tabIndex === 3 && 'active'" @click="tabIndex = 3">
              <IconFluentKeyboardLayoutFloat20Regular width="20"/>
              <span>快捷鍵設定</span>
            </div>

            <div class="tab" :class="tabIndex === 5 && 'active'" @click="()=>{
            tabIndex = 5
            runtimeStore.isNew = false
            set(APP_VERSION.key,APP_VERSION.version)
          }">
              <IconFluentTextBulletListSquare20Regular width="20"/>
              <span>更新日誌</span>
              <div class="red-point" v-if="runtimeStore.isNew"></div>
            </div>
            <div class="tab" :class="tabIndex === 6 && 'active'" @click="tabIndex = 6">
              <IconFluentPerson20Regular width="20"/>
              <span>關於</span>
            </div>
          </div>
        </div>
        <div class="col-line"></div>
        <div class="flex-1  overflow-y-auto overflow-x-hidden pr-4 content">

          <CommonSetting v-if="tabIndex === 0"/>
          <WordSetting v-if="tabIndex === 1"/>
          <ArticleSettting v-if="tabIndex === 2"/>


          <div class="body" v-if="tabIndex === 3">
            <div class="row">
              <label class="main-title">功能</label>
              <div class="wrapper">快捷鍵(點擊可修改)</div>
            </div>
            <div class="scroll">
              <div class="row" v-for="item of Object.entries(settingStore.shortcutKeyMap)">
                <label class="item-title">{{ getShortcutKeyName(item[0]) }}</label>
                <div class="wrapper" @click="editShortcutKey = item[0]">
                  <div class="set-key" v-if="editShortcutKey === item[0]">
                    <input ref="shortcutInput" :value="item[1]?item[1]:'未設定快捷鍵'" readonly type="text"
                           @blur="handleInputBlur">
                    <span @click.stop="editShortcutKey = ''">按鍵盤進行設定，<span
                        class="text-red!">設定完成點擊這裡</span></span>
                  </div>
                  <div v-else>
                    <div v-if="item[1]">{{ item[1] }}</div>
                    <span v-else>未設定快捷鍵</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="row">
              <label class="item-title"></label>
              <div class="wrapper">
                <BaseButton @click="resetShortcutKeyMap">恢復預設</BaseButton>
              </div>
            </div>
          </div>

          <div v-if="tabIndex === 4">
            <div>
              所有使用者資料
              <b class="text-red">保存在本地瀏覽器中</b>。如果您需要在不同的裝置、瀏覽器上使用 {{ APP_NAME }}，
              您需要手動進行資料匯出和匯入
            </div>
            <BaseButton :loading="exportLoading" size="large" class="mt-3" @click="exportData()">匯出資料備份(ZIP)</BaseButton>
            <div class="text-gray text-sm mt-2">💾 匯出的ZIP檔案包含所有學習資料，可在其他裝置上匯入恢復</div>

            <div class="line mt-15 mb-3"></div>

            <div>請注意，匯入資料將<b class="text-red"> 完全覆蓋 </b>當前所有資料，請謹慎操作。執行匯入操作時，會先自動備份當前資料到您的電腦中，供您隨時恢復
            </div>
            <div class="flex gap-space mt-3">
              <BaseButton size="large"
                          @click="beforeImport"
                          :loading="importLoading">匯入資料恢復</BaseButton>
              <input type="file"
                     id="import"
                     class="w-0 h-0 opacity-0"
                     accept="application/json,.zip,application/zip"
                     @change="importData">
            </div>

            <template v-if="isNewHost">
              <div class="line my-3"></div>
              <div>請注意，如果本地已有使用記錄，請先備份當前資料，遷移資料後將<b class="text-red"> 完全覆蓋 </b>當前所有資料，請謹慎操作。
              </div>
              <div class="flex gap-space mt-3">
                <BaseButton @click="showTransfer = true">遷移 2study.top 網站資料</BaseButton>
              </div>
            </template>
          </div>

          <!--          日志-->
          <Log v-if="tabIndex === 5"/>

          <div v-if="tabIndex === 6" class="center flex-col">
            <About/>
            <div class="text-md color-gray mt-10">
              Build {{ gitLastCommitHash }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </BasePage>

  <MigrateDialog
      v-model="showTransfer"
      @ok="transferOk"
  />
</template>

<style scoped lang="scss">

.col-line {
  border-right: 2px solid gainsboro;
}

.setting {

  .left {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    .tabs {
      padding: .6rem 0;
      display: flex;
      flex-direction: column;
      gap: .6rem;

      .tab {
        @apply cursor-pointer flex items-center relative;
        padding: .6rem .9rem;
        border-radius: .5rem;
        width: 10rem;
        gap: .6rem;
        transition: all .5s;

        &:hover {
          background: var(--btn-primary);
          color: white;
        }

        &.active {
          background: var(--btn-primary);
          color: white;
        }
      }
    }
  }

  .content {
    .row {
      min-height: 2.6rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: calc(var(--space) * 5);

      .wrapper {
        height: 2rem;
        flex: 1;
        display: flex;
        justify-content: flex-end;
        gap: var(--space);

        span {
          text-align: right;
          //width: 30rem;
          font-size: .7rem;
          color: gray;
        }

        .set-key {
          align-items: center;

          input {
            width: 9rem;
            box-sizing: border-box;
            margin-right: .6rem;
            height: 1.8rem;
            outline: none;
            font-size: 1rem;
            border: 1px solid gray;
            border-radius: .2rem;
            padding: 0 .3rem;
            background: var(--color-second);
            color: var(--color-font-1);
          }

        }
      }

      .main-title {
        font-size: 1.1rem;
        font-weight: bold;
      }

      .item-title {
        font-size: 1rem;
      }

      .sub-title {
        font-size: .9rem;
      }
    }

    .body {
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .scroll {
      flex: 1;
      padding-right: .6rem;
      overflow: auto;
    }

    .line {
      border-bottom: 1px solid #c4c3c3;
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .setting {
    flex-direction: column;

    .left {
      width: 100%;
      border-right: none;
      border-bottom: 2px solid gainsboro;

      .tabs {
        flex-direction: row;
        overflow-x: auto;
        padding: 0.5rem;
        gap: 0.3rem;

        .tab {
          white-space: nowrap;
          padding: 0.4rem 0.6rem;
          font-size: 0.9rem;

          span {
            display: none;
          }
        }
      }
    }

    .content {
      padding: 0 1rem;

      .row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        min-height: auto;
        padding: 0.5rem 0;

        .wrapper {
          width: 100%;
          justify-content: flex-start;

          .set-key {
            width: 100%;

            input {
              width: 100%;
              max-width: 200px;
            }
          }

          // 补充：选择器和输入框优化
          .base-select, .base-input {
            width: 100% !important;
            max-width: none;
          }

          // 单选按钮组优化
          .radio-group {
            flex-direction: column;
            gap: 0.5rem;

            .radio {
              min-height: 44px;
              width: 100%;
            }
          }

          // 滑块优化
          .slider {
            width: 100%;
          }
        }

        .main-title {
          font-size: 1rem;
        }

        .item-title {
          font-size: 0.9rem;
        }
      }

      .body {
        height: auto;
        max-height: 60vh;
      }
    }
  }
}
</style>
