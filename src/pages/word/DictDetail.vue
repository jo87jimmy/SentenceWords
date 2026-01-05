<script setup lang="ts">
import { DictId } from "@/types/types.ts";
import BasePage from "@/components/BasePage.vue";
import { computed, onMounted, reactive, ref, shallowReactive, watch } from "vue";
import { useRuntimeStore } from "@/stores/runtime.ts";
import { _getDictDataByUrl, _nextTick, convertToWord, isMobile, loadJsLib, useNav } from "@/utils";
import { nanoid } from "nanoid";
import BaseTable from "@/components/BaseTable.vue";
import WordItem from "@/components/WordItem.vue";
import Toast from '@/components/base/toast/Toast.ts'
import { useRoute, useRouter } from "vue-router";
import { useBaseStore } from "@/stores/base.ts";
import EditBook from "@/pages/article/components/EditBook.vue";
import { getDefaultDict } from "@/types/func.ts";
import FormItem from "@/components/base/form/FormItem.vue";
import Form from "@/components/base/form/Form.vue";
import DeleteIcon from "@/components/icon/DeleteIcon.vue";
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from "primevue/useconfirm";
import { getCurrentStudyWord } from "@/hooks/dict.ts";
import PracticeSettingDialog from "@/pages/word/components/PracticeSettingDialog.vue";
import { useSettingStore } from "@/stores/setting.ts";
import { MessageBox } from "@/utils/MessageBox.tsx";
import { AppEnv, LIB_JS_URL, Origin, PracticeSaveWordKey, TourConfig } from "@/config/env.ts";
import { detail } from "@/apis";

const confirm = useConfirm();

const runtimeStore = useRuntimeStore()
const base = useBaseStore()
const router = useRouter()
const route = useRoute()
const isMob = isMobile()

// 用於在 Template 中渲染 VNode (主要用於 BaseTable 傳回的 checkbox)
const VNodeRender = (props: { vnode: any }) => props.vnode

let loading = ref(false)

let list = computed({
  get() {
    return runtimeStore.editDict.words
  },
  set(v) {
    runtimeStore.editDict.words = shallowReactive(v)
  }
})

const getDefaultFormWord = () => {
  return {
    id: '',
    word: '',
    phonetic0: '',
    phonetic1: '',
    trans: '',
    sentences: '',
    phrases: '',
    synos: '',
    relWords: '',
    etymology: '',
  }
}
let isOperate = ref(false)
let wordForm = ref(getDefaultFormWord())
let wordFormRef = ref()
const wordRules = reactive({
  word: [
    {required: true, message: '請輸入單詞', trigger: 'blur'},
    {max: 100, message: '名稱不能超過100個字元', trigger: 'blur'},
  ],
})
let studyLoading = ref(false)

function syncDictInMyStudyList(study = false) {
  _nextTick(() => {
    let rIndex = base.word.bookList.findIndex(v => v.id === runtimeStore.editDict.id)
    let temp = runtimeStore.editDict;
    if (!temp.custom && ![DictId.wordKnown, DictId.wordWrong, DictId.wordCollect].includes(temp.id)) {
      temp.custom = true
      temp.id += '_custom'
    }
    temp.length = temp.words.length
    if (rIndex > -1) {
      base.word.bookList[rIndex] = temp
      if (study) base.word.studyIndex = rIndex
    } else {
      base.word.bookList.push(temp)
      if (study) base.word.studyIndex = base.word.bookList.length - 1
    }
  }, 100)
}

async function onSubmitWord() {
  // return console.log('wordFormRef',wordFormRef,wordFormRef.validate)
  await wordFormRef.value.validate((valid: boolean) => {
    if (valid) {
      let data: any = convertToWord(wordForm.value)
      //todo 可以檢查的更準確些，比如json對比
      if (data.id) {
        let r = list.value.find(v => v.id === data.id)
        if (r) {
          Object.assign(r, data)
          Toast.success('修改成功')
        } else {
          Toast.success('修改失敗，未找到單詞')
          return
        }
      } else {
        data.id = nanoid(6)
        data.checked = false
        let r = list.value.find(v => v.word === wordForm.value.word)
        if (r) {
          Toast.warning('已有相同名稱單詞！')
          return
        } else list.value.push(data)
        Toast.success('添加成功')
        wordForm.value = getDefaultFormWord()
      }
      syncDictInMyStudyList()
    } else {
      Toast.warning('請填寫完整')
    }
  })
}

function delWord(id: string, isBatch = false) {
  let rIndex2 = list.value.findIndex(v => v.id === id)
  if (rIndex2 > -1) {
    if (id === wordForm.value.id) {
      wordForm.value = getDefaultFormWord()
    }
    list.value.splice(rIndex2, 1)
  }
  if (!isBatch) syncDictInMyStudyList()
}

const confirmDelete = (event: any, id: string) => {
    confirm.require({
        target: event.currentTarget,
        message: '確認刪除？',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            delWord(id);
        }
    });
};

function batchDel(ids: string[]) {
  ids.map(v => delWord(v, true))
  syncDictInMyStudyList()
}

//把word對象的字段全轉成字符串
function word2Str(word: any) {
  let res = getDefaultFormWord()
  res.id = word.id
  res.word = word.word
  res.phonetic1 = word.phonetic1
  res.phonetic0 = word.phonetic0
  res.trans = word.trans.map((v: any) => (v.pos + v.cn).replace(/"/g, '')).join('\n')
  res.sentences = word.sentences.map((v: any) => (v.c + "\n" + v.cn).replace(/"/g, '')).join('\n\n')
  res.phrases = word.phrases.map((v: any) => (v.c + "\n" + v.cn).replace(/"/g, '')).join('\n\n')
  res.synos = word.synos.map((v: any) => (v.pos + v.cn + "\n" + v.ws.join('/')).replace(/"/g, '')).join('\n\n')
  res.relWords = word.relWords.root ? ('詞根:' + word.relWords.root + '\n\n' +
      word.relWords.rels.map((v: any) => (v.pos + "\n" + v.words.map((v: any) => (v.c + ':' + v.cn)).join('\n')).replace(/"/g, '')).join('\n\n')) : ''
  res.etymology = word.etymology.map((v: any) => (v.t + '\n' + v.d).replace(/"/g, '')).join('\n\n')
  return res
}

function editWord(word: any) {
  isOperate.value = true
  wordForm.value = word2Str(word)
  if (isMob) activeTab.value = 'edit'
}

function addWord() {
  // setTimeout(wordListRef?.scrollToBottom, 100)
  isOperate.value = true
  wordForm.value = getDefaultFormWord()
  if (isMob) activeTab.value = 'edit'
}

function closeWordForm() {
  isOperate.value = false
  wordForm.value = getDefaultFormWord()
  if (isMob) activeTab.value = 'list'
}

let isEdit = ref(false)
let isAdd = ref(false)
let activeTab = ref<'list' | 'edit'>('list') // 移動端標籤頁狀態

const showBookDetail = computed(() => {
  return !(isAdd.value || isEdit.value);
})

onMounted(async () => {
  try {
    if (route.query?.isAdd) {
      isAdd.value = true
      runtimeStore.editDict = getDefaultDict()
    } else {
      if (!runtimeStore.editDict.id) {
        router.push("/word")
      } else {
        if (!runtimeStore.editDict.words.length
            && !runtimeStore.editDict.custom
            && ![DictId.wordCollect, DictId.wordWrong, DictId.wordKnown].includes(runtimeStore.editDict.en_name || runtimeStore.editDict.id)
        ) {
          loading.value = true
          let r = await _getDictDataByUrl(runtimeStore.editDict)
          runtimeStore.editDict = r
        }

        const book = base.word.bookList.find(book => book.id === runtimeStore.editDict.id)
        if (book) {
          if (AppEnv.CAN_REQUEST) {
            let res = await detail({id: runtimeStore.editDict.id})
            if (res.success) {
              runtimeStore.editDict.statistics = res.data.statistics
              if (res.data.words.length) {
                runtimeStore.editDict.words = res.data.words
              }
            }
          }
        }
        loading.value = false
      }
    }
  } catch (e: any) {
    console.error(e)
    Toast.error('載入失敗: ' + e.message)
    loading.value = false
  }
})

function formClose() {
  if (isEdit.value) isEdit.value = false
  else router.back()
}

let showPracticeSettingDialog = ref(false)

const store = useBaseStore()
const settingStore = useSettingStore()
const {nav} = useNav()

//todo 可以和首頁合併
async function startPractice(query = {}) {
  localStorage.removeItem(PracticeSaveWordKey.key)
  studyLoading.value = true
  await base.changeDict(runtimeStore.editDict)
  studyLoading.value = false
  window.umami?.track('startStudyWord', {
    name: store.sdict.name,
    index: store.sdict.lastLearnIndex,
    perDayStudyNumber: store.sdict.perDayStudyNumber,
    custom: store.sdict.custom,
    complete: store.sdict.complete,
    wordPracticeMode: settingStore.wordPracticeMode
  })
  let currentStudy = getCurrentStudyWord()
  nav('practice-words/' + store.sdict.id, query, {taskWords: currentStudy})
}

async function addMyStudyList() {
  if (!runtimeStore.editDict.words.length) {
    return Toast.warning('沒有單詞可學習！')
  }
  if (!settingStore.disableShowPracticeSettingDialog) {
    showPracticeSettingDialog.value = true
    return
  }
  startPractice()
}

async function startTest() {
  loading.value = true
  await base.changeDict(runtimeStore.editDict)
  loading.value = false
  nav('word-test/' + store.sdict.id)

}

let exportLoading = ref(false)
let importLoading = ref(false)
let tableRef = ref()

function importData(e:any) {
  let file = e.target.files[0];
  if (!file) return;

  let reader = new FileReader();
  reader.onload = async function (s:any) {
    let data = s.target.result;
    importLoading.value = true
    const XLSX = await loadJsLib('XLSX', `${Origin}/libs/xlsx.full.min.js`);
    let workbook = XLSX.read(data, {type: 'binary'});
    let res: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet1']);
    if (res.length) {
      let words = res.map(v => {
        if (v['單詞']) {
          let data = null
          try {
            data = convertToWord({
              id: nanoid(6),
              word: v['單詞'],
              phonetic0: v['音標①'] ?? '',
              phonetic1: v['音標②'] ?? '',
              trans: v['翻譯'] ?? '',
              sentences: v['例句'] ?? '',
              phrases: v['短語'] ?? '',
              synos: v['近義詞'] ?? '',
              relWords: v['同根詞'] ?? '',
              etymology: v['詞源'] ?? '',
            });
          } catch (e:any) {
            console.error('導入單詞報錯' + v['單詞'], e.message)
          }
          return data
        }
      }).filter(v => v);
      if (words.length) {
        let repeat:any[] = []
        let noRepeat:any[] = []
        words.map((v: any) => {
          let rIndex = runtimeStore.editDict.words.findIndex(s => s.word === v.word)
          if (rIndex > -1) {
            v.index = rIndex
            repeat.push(v)
          } else {
            noRepeat.push(v)
          }
        })

        runtimeStore.editDict.words = runtimeStore.editDict.words.concat(noRepeat)

        if (repeat.length) {
          MessageBox.confirm(
              '單詞"' + repeat.map(v => v.word).join(', ') + '" 已存在，是否覆蓋原單詞？',
              '檢測到重複單詞',
              () => {
                repeat.map(v => {
                  const idx = v.index
                  delete v.index
                  runtimeStore.editDict.words[idx] = v
                })
              },
              undefined,
              () => {
                tableRef.value.closeImportDialog()
                e.target.value = ''
                importLoading.value = false
                syncDictInMyStudyList()
                Toast.success('導入成功！')
              }
          )
        } else {
          tableRef.value.closeImportDialog()
          syncDictInMyStudyList()
          Toast.success('導入成功！')
        }
      } else {
        Toast.warning('導入失敗！原因：沒有數據/未識別到數據');
      }
    } else {
      Toast.warning('導入失敗！原因：沒有數據');
    }
    e.target.value = ''
    importLoading.value = false
  };
  reader.readAsBinaryString(file);
}

async function exportData() {
  exportLoading.value = true
  const XLSX = await loadJsLib('XLSX', `${Origin}/libs/xlsx.full.min.js`);
  let list = runtimeStore.editDict.words
  let filename = runtimeStore.editDict.name
  let wb = XLSX.utils.book_new()
  let sheetData = list.map(v => {
    let t = word2Str(v)
    return {
      單詞: t.word,
      '音標①': t.phonetic0,
      '音標②': t.phonetic1,
      '翻譯': t.trans,
      '例句': t.sentences,
      '短語': t.phrases,
      '近義詞': t.synos,
      '同根詞': t.relWords,
      '詞源': t.etymology,
    }
  })
  wb.Sheets['Sheet1'] = XLSX.utils.json_to_sheet(sheetData)
  wb.SheetNames = ['Sheet1']
  XLSX.writeFile(wb, `${filename}.xlsx`);
  Toast.success(filename + ' 導出成功！')
  exportLoading.value = false
}




watch(() => loading.value, (val) => {
  if (!val) return
  _nextTick(async () => {
    const Shepherd = await loadJsLib('Shepherd', LIB_JS_URL.SHEPHERD);
    const tour = new Shepherd.Tour(TourConfig);
    tour.on('cancel', () => {
      localStorage.setItem('tour-guide', '1');
    });
    tour.addStep({
      id: 'step3',
      text: '點擊這裡開始學習',
      attachTo: {element: '#study', on: 'bottom'},
      buttons: [
        {
          text: `下一步（3/${TourConfig.total}）`,
          action() {
            tour.next()
            addMyStudyList()
          }
        }
      ]
    });

    tour.addStep({
      id: 'step4',
      text: '這裡可以選擇學習模式、設置學習數量、修改學習進度',
      attachTo: {element: '#mode', on: 'bottom'},
      beforeShowPromise() {
        return new Promise((resolve) => {
          const timer = setInterval(() => {
            if (document.querySelector('#mode')) {
              clearInterval(timer);
              setTimeout(resolve, 500)
            }
          }, 100);
        });
      },
      buttons: [
        {
          text: `下一步（4/${TourConfig.total}）`,
          action() {
            tour.next()
            startPractice({guide: 1})
          }
        }
      ]
    });

    const r = localStorage.getItem('tour-guide');
    if (settingStore.first && !r && !isMobile()) {
      tour.start();
    }
  }, 500)
})

</script>

<template>
  <BasePage>
    <div v-if="showBookDetail" class="card mb-0 dict-detail-card flex flex-col">
      <div class="dict-header flex justify-between items-center relative">
        <Button 
          text 
          rounded 
          class="dict-back z-10 w-8 h-8 p-0" 
          @click="() => {
            if (isAdd) {
              router.back()
            } else {
              isEdit = false
            }
          }" 
        >
          <template #icon>
            <IconFluentChevronLeft28Filled />
          </template>
        </Button>
        <div class="dict-title absolute page-title text-center w-full">{{ runtimeStore.editDict.name }}</div>
        <div class="dict-actions flex gap-2">
          <Button 
            :loading="studyLoading || loading" 
            severity="info"
            label="編輯"
            @click="isEdit = true"
          />
          <Button 
            id="study" 
            :loading="studyLoading || loading" 
            label="學習"
            @click="addMyStudyList"
          />
          <Button 
            :loading="studyLoading || loading" 
            label="測試"
            @click="startTest"
          />
        </div>
      </div>
      <div class="text-lg">介紹：{{ runtimeStore.editDict.description }}</div>
      <div class="line my-3"></div>

      <!-- 移動端標籤頁導航 -->
      <div v-if="isMob && isOperate" class="tab-navigation mb-3">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          單詞列表
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'edit' }"
          @click="activeTab = 'edit'"
        >
          {{ wordForm.id ? '編輯' : '添加' }}單詞
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden content-area">
        <div 
          class="word-list-section"
          :class="{ 'mobile-hidden': isMob && isOperate && activeTab !== 'list' }"
        >
          <BaseTable
            ref="tableRef"
            class="h-full"
            :list="list"
            @update:list="e => list = e"
            :loading="loading"
            :del="delWord"
            :batchDel="batchDel"
            :add="addWord"
            @importData="importData"
            @exportData="exportData"
            :exportLoading="exportLoading"
            :importLoading="importLoading"
          >
            <template #default="{ item, checkbox }">
              <WordItem
                :showTransPop="false"
                :item="item"
              >
                <template #prefix>
                   <!-- 渲染 Checkbox VNode -->
                   <VNodeRender :vnode="checkbox(item)" />
                </template>
                <template #suffix>
                  <div class='flex flex-col gap-1'>
                    <Button
                      text
                      rounded
                      severity="secondary"
                      class="option-icon w-8 h-8 p-0"
                      @click="editWord(item)"
                      title="編輯"
                    >
                      <template #icon>
                        <IconFluentTextEditStyle20Regular />
                      </template>
                    </Button>
                    <Button
                      text
                      rounded
                      severity="secondary"
                      class="option-icon w-8 h-8 p-0"
                      title="刪除"
                      @click="confirmDelete($event, item.id)"
                    >
                      <template #icon>
                        <DeleteIcon />
                      </template>
                    </Button>
                  </div>
                </template>
              </WordItem>
            </template>
          </BaseTable>
        </div>

        <div 
          v-if="isOperate"
          class="edit-section flex-1 flex flex-col"
          :class="{ 'mobile-hidden': isMob && activeTab !== 'edit' }"
        >
          <div class="common-title">
            {{ wordForm.id ? '修改' : '添加' }}單詞
          </div>
          <Form
            class="flex-1 overflow-auto pr-2"
            ref="wordFormRef"
            :rules="wordRules"
            :model="wordForm"
            label-width="7rem"
          >
            <FormItem label="單詞" prop="word">
              <InputText v-model="wordForm.word" class="w-full" />
            </FormItem>
            <FormItem label="英音音標">
              <InputText v-model="wordForm.phonetic0" class="w-full" />
            </FormItem>
            <FormItem label="美音音標">
              <InputText v-model="wordForm.phonetic1" class="w-full" />
            </FormItem>
            <FormItem label="翻譯">
              <Textarea
                v-model="wordForm.trans"
                placeholder="一行一個翻譯，前面詞性，後面內容（如n.取消）；多個翻譯請換行"
                autoResize
                rows="6"
                class="w-full"
              />
            </FormItem>
            <FormItem label="例句">
              <Textarea
                v-model="wordForm.sentences"
                placeholder="一行原文，一行譯文；多個請換兩行"
                autoResize
                rows="6"
                class="w-full"
              />
            </FormItem>
            <FormItem label="短語">
              <Textarea
                v-model="wordForm.phrases"
                placeholder="一行原文，一行譯文；多個請換兩行"
                autoResize
                rows="6"
                class="w-full"
              />
            </FormItem>
            <FormItem label="同義詞">
              <Textarea
                v-model="wordForm.synos"
                placeholder="請參考已有單詞格式"
                autoResize
                rows="6"
                class="w-full"
              />
            </FormItem>
            <FormItem label="同根詞">
              <Textarea
                v-model="wordForm.relWords"
                placeholder="請參考已有單詞格式"
                autoResize
                rows="6"
                class="w-full"
              />
            </FormItem>
            <FormItem label="詞源">
              <Textarea
                v-model="wordForm.etymology"
                placeholder="請參考已有單詞格式"
                autoResize
                rows="6"
                class="w-full"
              />
            </FormItem>
          </Form>
          <div class="flex justify-center items-center gap-4">
            <Button
              severity="secondary"
              label="關閉"
              @click="closeWordForm"
            />
            <Button 
              label="保存"
              @click="onSubmitWord"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="card mb-0 dict-detail-card">
      <div class="dict-header flex justify-between items-center relative">
        <Button 
          icon="i-fluent-arrow-left-24-regular" 
          text 
          rounded 
          class="dict-back z-10" 
          @click="() => {
            if (isAdd) {
              router.back()
            } else {
              isEdit = false
            }
          }" 
        />
        <div class="dict-title absolute page-title text-center w-full">
          {{ runtimeStore.editDict.id ? '修改' : '創建' }}詞典
        </div>
      </div>
      <div class="flex justify-center items-center">
        <EditBook
          :isAdd="isAdd"
          :isBook="false"
          @close="formClose"
          @submit="() => isEdit = isAdd = false"
        />
      </div>
    </div>

    <PracticeSettingDialog
      showLeftOption
      v-model="showPracticeSettingDialog"
      @ok="startPractice"
    />
    <ConfirmPopup />
  </BasePage>
</template>

<style scoped lang="scss">
.dict-detail-card {
  height: calc(100vh - 3rem);
}

.dict-header {
  gap: 0.5rem;
}

.dict-actions {
  flex-wrap: wrap;
}

.word-list-section {
  width: 40%;
}

.edit-section {
  margin-left: 1rem;
}

.tab-navigation {
  display: none; // 默認隱藏，移動端顯示
}

.mobile-hidden {
  display: none;
}

// 移動端適配
@media (max-width: 768px) {
  .dict-detail-card {
    height: unset;
    min-height: calc(100vh - 2rem);
    margin-bottom: 0 !important;
  }

  .dict-header {
    width: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.75rem;
  }

  .dict-header .dict-back {
    align-self: flex-start;
  }

  .dict-header .dict-title {
    position: static !important;
    width: 100%;
  }

  .dict-header .dict-actions {
    width: 100%;
    justify-content: center;
    gap: 0.75rem;
  }

  .tab-navigation {
    display: flex;
    border-bottom: 2px solid var(--color-item-border);
    margin-bottom: 1rem;
    gap: 0;

    .tab-item {
      flex: 1;
      padding: 0.75rem 1rem;
      text-align: center;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--color-sub-text);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all 0.3s ease;
      user-select: none;

      &:active {
        transform: scale(0.98);
      }

      &.active {
        color: var(--color-icon-hightlight);
        border-bottom-color: var(--color-icon-hightlight);
      }
    }
  }

  .content-area {
    flex-direction: column;

    .word-list-section,
    .edit-section {
      width: 100% !important;
      margin-left: 0 !important;
      max-width: 100%;
    }

    .edit-section {
      margin-top: 0;
    }
  }
}

// 超小屏幕適配
@media (max-width: 480px) {
  .dict-detail-card {
    height: unset;
    min-height: calc(100vh - 1rem);
  }

  .tab-navigation {
    .tab-item {
      padding: 0.6rem 0.5rem;
      font-size: 0.9rem;
    }
  }
}
</style>
