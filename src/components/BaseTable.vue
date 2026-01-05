<script setup lang="ts">
import { nextTick, ref, computed, h } from "vue";
import { Sort } from "@/types/types.ts";
import { cloneDeep, debounce, reverse, shuffle } from "@/utils";
import Empty from "@/components/Empty.vue";
import Toast from '@/components/base/toast/Toast.ts'
import { Host } from "@/config/env.ts";

import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Paginator from 'primevue/paginator';
import Popover from 'primevue/popover';
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from "primevue/useconfirm";

let list = defineModel<any[]>('list', { default: () => [] })

const props = withDefaults(defineProps<{
  loading?: boolean
  showToolbar?: boolean
  showPagination?: boolean
  exportLoading?: boolean
  importLoading?: boolean
  del?: Function
  batchDel?: Function
  add?: Function
}>(), {
  loading: true,
  showToolbar: true,
  showPagination: true,
  exportLoading: false,
  importLoading: false,
  del: () => void 0,
  add: () => void 0,
  batchDel: () => void 0
})

const confirm = useConfirm();
const emit = defineEmits<{
  click: [val: {
    item: any,
    index: number
  }],
  importData: [e: Event]
  exportData: []
}>()

const listRef = ref<HTMLElement | null>(null)
const sortOp = ref();

function scrollToBottom() {
  nextTick(() => {
    listRef.value?.scrollTo(0, listRef.value.scrollHeight)
  })
}

function scrollToTop() {
  nextTick(() => {
    listRef.value?.scrollTo(0, 0)
  })
}

function scrollToItem(index: number) {
  nextTick(() => {
    listRef.value?.children[index]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

let pageNo = ref(1)
let pageSize = ref(50)
let searchKey = ref('')
let showSearchInput = ref(false)
let showImportDialog = ref(false)
let selectIds = ref<any[]>([])

let currentList = computed(() => {
  if (searchKey.value) {
    return list.value.filter((v: any) => v.word.includes(searchKey.value))
  }
  if (!props.showPagination) return list.value
  return list.value.slice((pageNo.value - 1) * pageSize.value, (pageNo.value - 1) * pageSize.value + pageSize.value)
})

let selectAll = computed({
  get: () => !!selectIds.value.length && (selectIds.value.length === currentList.value.length),
  set: () => toggleSelectAll()
})

const renderCheckbox = (item: any) => h(Checkbox, {
  modelValue: selectIds.value.includes(item.id),
  'onUpdate:modelValue': () => toggleSelect(item),
  binary: true
})

function toggleSelect(item: any) {
  let rIndex = selectIds.value.findIndex(v => v === item.id)
  if (rIndex > -1) {
    selectIds.value.splice(rIndex, 1)
  } else {
    selectIds.value.push(item.id)
  }
}

function toggleSelectAll() {
  if (selectAll.value) {
    selectIds.value = []
  } else {
    selectIds.value = currentList.value.map(v => v.id)
  }
}

const closeImportDialog = () => showImportDialog.value = false

function sort(type: Sort) {
  if (type === Sort.reverse) {
    Toast.success('已翻轉排序')
    list.value = reverse(cloneDeep(list.value))
  }
  if (type === Sort.random) {
    Toast.success('已隨機排序')
    list.value = shuffle(cloneDeep(list.value))
  }
  if (sortOp.value) sortOp.value.hide();
}

function confirmDeleteBatch(event: any) {
    confirm.require({
        target: event.currentTarget,
        message: '確認刪除所有選中數據？',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
             handleBatchDel();
        }
    });
}

function handleBatchDel() {
  props.batchDel(selectIds.value)
  selectIds.value = []
}

function handlePageChange(event: any) {
  pageNo.value = event.page + 1;
  pageSize.value = event.rows;
  scrollToTop();
}

const onSearchUpdate = debounce((e: string) => searchKey.value = e, 300)
const openUpload = () => {
    let d: HTMLInputElement | null = document.querySelector('#upload-trigger')
    d?.click()
}

defineExpose({
  scrollToBottom,
  scrollToItem,
  closeImportDialog
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Toolbar -->
    <div v-if="showToolbar">
      <!-- Search Input Mode -->
      <div v-if="showSearchInput" class="flex gap-4">
        <IconField class="w-full flex-1">
            <InputIcon class="pi pi-search" />
            <InputText 
              v-model="searchKey" 
              class="w-full"
              placeholder="搜索..." 
              autofocus 
              @input="(e:any) => onSearchUpdate(e.target.value)" 
            />
        </IconField>
        <Button label="取消" severity="secondary" @click="showSearchInput = false; searchKey = ''" />
      </div>

      <!-- Normal Toolbar Mode -->
      <div v-else class="flex justify-between items-center">
        <div class="flex gap-2 items-center">
          <Checkbox
            :disabled="!currentList.length"
            @update:modelValue="toggleSelectAll()"
            :modelValue="selectAll"
            binary
          />
          <span>{{ selectIds.length }} / {{ list.length }}</span>
        </div>

        <div class="flex gap-2 relative items-center">
          <Button
            v-if="selectIds.length"
            icon="i-fluent-delete-24-regular"
            text
            severity="danger"
            class="w-8 h-8 p-0"
            title="刪除"
            @click="confirmDeleteBatch"
          >
            <template #icon>
                <IconFluentDelete20Regular />
             </template>
          </Button>

          <Button 
            text 
            severity="secondary" 
            class="w-8 h-8 p-0" 
            title="導入"
            @click="showImportDialog = true"
          >
           <template #icon>
             <IconSystemUiconsImport />
           </template>
          </Button>

          <Button 
            text 
            severity="secondary" 
            class="w-8 h-8 p-0" 
            title="導出"
            @click="emit('exportData')"
          >
             <template #icon>
                <IconEosIconsLoading v-if="exportLoading" />
                <IconPhExportLight v-else />
             </template>
          </Button>

          <Button 
            text 
            severity="secondary" 
            class="w-8 h-8 p-0" 
            title="添加單詞"
             @click="props.add()"
          >
            <template #icon>
                <IconFluentAdd20Regular />
            </template>
          </Button>

          <Button
            text
            severity="secondary"
            class="w-8 h-8 p-0"
            title="改變順序"
            :disabled="!currentList.length"
            @click="(e) => sortOp.toggle(e)"
          >
             <template #icon>
                <IconFluentArrowSort20Regular />
             </template>
          </Button>

          <Button 
            text
            severity="secondary"
            class="w-8 h-8 p-0"
            title="搜索"
            :disabled="!currentList.length"
            @click="showSearchInput = !showSearchInput"
          >
             <template #icon>
                <IconFluentSearch20Regular />
             </template>
          </Button>

          <!-- Sort Popover -->
          <Popover ref="sortOp">
            <div class="flex flex-col gap-2 p-2 w-32">
              <div class="text-sm font-bold mb-1">列表順序設置</div>
              <div class="flex gap-2">
                <Button size="small" label="翻轉" @click="sort(Sort.reverse)" />
                <Button size="small" label="隨機" @click="sort(Sort.random)" />
              </div>
            </div>
          </Popover>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="h-full w-full flex justify-center items-center text-4xl">
      <IconEosIconsLoading class="text-gray-500" />
    </div>
    
    <template v-else-if="currentList.length">
      <div class="flex-1 overflow-auto" ref="listRef">
        <div 
          class="list-item-wrapper" 
          v-for="(item, index) in currentList" 
          :key="item.word"
        >
          <slot 
            :checkbox="renderCheckbox"
            :item="item" 
            :index="(pageSize * (pageNo - 1)) + index + 1"
          ></slot>
        </div>
      </div>
      
      <div v-if="showPagination" class="flex justify-end">
        <Paginator
          :rows="pageSize"
          :totalRecords="list.length"
          :rowsPerPageOptions="[20, 50, 100, 200]"
          @page="handlePageChange"
          :first="(pageNo - 1) * pageSize"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="第 {first} - {last} 條，共 {totalRecords} 條"
          class="!border-none !bg-transparent"
        />
      </div>
    </template>
    
    <Empty v-else />

    <!-- Import Dialog -->
    <Dialog 
      v-model:visible="showImportDialog"
      modal
      header="導入教程"
      :style="{ width: '50rem' }"
    >
        <div class="w-full p-4 pt-0">
            <div>請按照模板的格式來填寫數據</div>
            <div class="text-red-500">單詞項為必填，其他項可不填</div>
            <div>翻譯：一行一個翻譯，前面詞性，後面內容（如n.取消）；多個翻譯請換行</div>
            <div>例句：一行原文，一行譯文；多個請換<span class="text-red-500">兩</span>行</div>
            <div>短語：一行原文，一行譯文；多個請換<span class="text-red-500">兩</span>行</div>
            <div>同義詞、同根詞、詞源：請前往官方字典，然後編輯其中某個單詞，參考其格式</div>
            <div class="mt-6">
              模板下載地址：<a :href="`https://${Host}/libs/单词导入模板.xlsx`" class="text-blue-500 hover:text-blue-600">單詞導入模板</a>
            </div>
            <div class="mt-4 flex gap-2 items-center">
              <Button
                @click="openUpload"
                :loading="props.importLoading"
                label="導入"
              />
              <input
                id="upload-trigger"
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                @change="e => emit('importData', e)"
                class="w-0 h-0 opacity-0"
              />
            </div>
          </div>
    </Dialog>
    <ConfirmPopup />
  </div>
</template>

<style scoped lang="scss">

</style>
