<script setup lang="tsx">
import { nextTick, ref, computed, h } from "vue";
import { Sort } from "@/types/types.ts";
import MiniDialog from "@/components/dialog/MiniDialog.vue";
import BaseIcon from "@/components/BaseIcon.vue";
import BaseButton from "@/components/BaseButton.vue";
import { cloneDeep, debounce, reverse, shuffle } from "@/utils";
import PopConfirm from "@/components/PopConfirm.vue"
import Empty from "@/components/Empty.vue";
import Pagination from '@/components/base/Pagination.vue'
import Toast from '@/components/base/toast/Toast.ts'
import Checkbox from "@/components/base/checkbox/Checkbox.vue";
import DeleteIcon from "@/components/icon/DeleteIcon.vue";
import Dialog from "@/components/dialog/Dialog.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import { Host } from "@/config/env.ts";

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

const emit = defineEmits<{
  click: [val: {
    item: any,
    index: number
  }],
  importData: [e: Event]
  exportData: []
}>()

const listRef = ref<HTMLElement | null>(null)

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
let showSortDialog = ref(false)
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
  onChange: () => toggleSelect(item),
  size: "large"
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
  showSortDialog.value = false
}

function handleBatchDel() {
  props.batchDel(selectIds.value)
  selectIds.value = []
}

function handlePageNo(e: number) {
  pageNo.value = e
  scrollToTop()
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
        <BaseInput
          clearable
          :modelValue="searchKey"
          @update:modelValue="onSearchUpdate"
          class="flex-1"
          autofocus
        >
          <template #subfix>
            <IconFluentSearch24Regular class="text-lg text-gray" />
          </template>
        </BaseInput>
        <BaseButton @click="showSearchInput = false; searchKey = ''">取消</BaseButton>
      </div>

      <!-- Normal Toolbar Mode -->
      <div v-else class="flex justify-between">
        <div class="flex gap-2 items-center">
          <Checkbox
            :disabled="!currentList.length"
            @change="toggleSelectAll()"
            :modelValue="selectAll"
            size="large"
          />
          <span>{{ selectIds.length }} / {{ list.length }}</span>
        </div>

        <div class="flex gap-2 relative">
          <PopConfirm 
            v-if="selectIds.length"
            title="確認刪除所有選中數據？"
            @confirm="handleBatchDel"
          >
            <BaseIcon class="del" title="刪除">
              <DeleteIcon />
            </BaseIcon>
          </PopConfirm>

          <BaseIcon @click="showImportDialog = true" title="導入">
            <IconSystemUiconsImport />
          </BaseIcon>

          <BaseIcon @click="emit('exportData')" title="導出">
            <IconEosIconsLoading v-if="exportLoading" />
            <IconPhExportLight v-else />
          </BaseIcon>

          <BaseIcon @click="props.add()" title="添加單詞">
            <IconFluentAdd20Regular />
          </BaseIcon>

          <BaseIcon
            :disabled="!currentList.length"
            title="改變順序"
            @click="showSortDialog = !showSortDialog"
          >
            <IconFluentArrowSort20Regular />
          </BaseIcon>

          <BaseIcon
            :disabled="!currentList.length"
            @click="showSearchInput = !showSearchInput"
            title="搜索"
          >
            <IconFluentSearch20Regular />
          </BaseIcon>

          <!-- Sort Dialog -->
          <MiniDialog
            v-model="showSortDialog"
            style="width: 8rem;"
          >
            <div class="mini-row-title">列表順序設置</div>
            <div class="mini-row">
              <BaseButton size="small" @click="sort(Sort.reverse)">翻轉</BaseButton>
              <BaseButton size="small" @click="sort(Sort.random)">隨機</BaseButton>
            </div>
          </MiniDialog>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="h-full w-full center text-4xl">
      <IconEosIconsLoading color="gray" />
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
        <Pagination
          :currentPage="pageNo"
          @update:currentPage="handlePageNo"
          :pageSize="pageSize"
          @update:pageSize="(e) => pageSize = e"
          :pageSizes="[20, 50, 100, 200]"
          layout="prev, pager, next"
          :total="list.length"
        />
      </div>
    </template>
    
    <Empty v-else />

    <!-- Import Dialog -->
    <Dialog 
      v-model="showImportDialog"
      @update:modelValue="closeImportDialog"
      title="導入教程"
    >
        <div class="w-100 p-4 pt-0">
            <div>請按照模板的格式來填寫數據</div>
            <div class="color-red">單詞項為必填，其他項可不填</div>
            <div>翻譯：一行一個翻譯，前面詞性，後面內容（如n.取消）；多個翻譯請換行</div>
            <div>例句：一行原文，一行譯文；多個請換<span class="color-red">兩</span>行</div>
            <div>短語：一行原文，一行譯文；多個請換<span class="color-red">兩</span>行</div>
            <div>同義詞、同根詞、詞源：請前往官方字典，然後編輯其中某個單詞，參考其格式</div>
            <div class="mt-6">
              模板下載地址：<a :href="`https://${Host}/libs/单词导入模板.xlsx`">單詞導入模板</a>
            </div>
            <div class="mt-4">
              <BaseButton
                @click="openUpload"
                :loading="props.importLoading"
              >導入</BaseButton>
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
  </div>
</template>

<style scoped lang="scss">

</style>
