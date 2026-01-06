<script setup lang="ts">

import { type Dict, DictId, DictType } from "@/types/types.ts";
import { cloneDeep } from "@/utils";
import Toast from '@/components/base/toast/Toast.ts'
import { onMounted, reactive, ref } from "vue";
import { useRuntimeStore } from "@/stores/runtime.ts";
import { useBaseStore } from "@/stores/base.ts";
import { getDefaultDict } from "@/types/func.ts";
import Form from "@/components/base/form/Form.vue";
import FormItem from "@/components/base/form/FormItem.vue";
import { addDict } from "@/apis";
import { AppEnv } from "@/config/env.ts";

// PrimeVue Imports
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';

const props = defineProps<{
  isAdd: boolean,
  isBook: boolean
}>()
const emit = defineEmits<{
  submit: []
  close: []
}>()
const runtimeStore = useRuntimeStore()
const store = useBaseStore()
const DefaultDictForm = {
  id: '',
  name: '',
  description: '',
  category: '',
  tags: [],
  translateLanguage: 'zh-CN',
  language: 'en',
  type: DictType.article
}
// 使用 const ref 並修改 .value 以確保響應性正確
const dictForm = ref(cloneDeep(DefaultDictForm))
const dictFormRef = ref()
let loading = ref(false)

const dictRules = reactive({
  name: [
    {required: true, message: '請輸入名稱', trigger: 'blur'},
    {max: 20, message: '名稱不能超過20個字元', trigger: 'blur'},
  ],
})

const langOptions = [
  { label: '英語', value: 'en' },
  { label: '德語', value: 'de' },
  { label: '日語', value: 'ja' },
  { label: '代碼', value: 'code' },
]

const transLangOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: '英語', value: 'en' },
  { label: '德語', value: 'de' },
  { label: '日語', value: 'ja' },
]

async function onSubmit() {
  await dictFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      let data: Dict = getDefaultDict(dictForm.value)
      data.type = props.isBook ? DictType.article : DictType.word
      let source = props.isBook ? store.article : store.word
      //todo 可以檢查的更準確些，比如json對比
      if (props.isAdd) {
        data.id = 'custom-dict-' + Date.now()
        if (source.bookList.find(v => v.name === data.name)) {
          Toast.warning('已有相同名稱！')
          return
        } else {
          if (AppEnv.CAN_REQUEST) {
            loading.value = true
            let res = await addDict(null, data)
            loading.value = false
            if (res.success) {
              data = getDefaultDict(res.data)
            } else {
              return Toast.error(res.msg)
            }
          }
          source.bookList.push(cloneDeep(data))
          runtimeStore.editDict = data
          emit('submit')
          Toast.success('添加成功')
        }
      } else {
        let rIndex = source.bookList.findIndex(v => v.id === data.id)
        //任意修改，都將其變為自定義詞典
        if (!data.custom && ![DictId.wordKnown, DictId.wordWrong, DictId.wordCollect, DictId.articleCollect].includes(data.en_name || data.id)) {
          data.custom = true
          data.id += '_custom'
        }
        runtimeStore.editDict = data
        if (rIndex > -1) {
          source.bookList[rIndex] = cloneDeep(data)
          emit('submit')
          Toast.success('修改成功')
        } else {
          source.bookList.push(cloneDeep(data))
          Toast.success('修改成功並加入我的詞典')
        }
      }
      console.log('submit!', data)
    } else {
      Toast.warning('請填寫完整')
    }
  })
}

onMounted(() => {
  if (!props.isAdd) {
    dictForm.value = cloneDeep(runtimeStore.editDict)
  }
})

</script>

<template>
  <div class="w-[30rem] mt-4">
    <Form
        ref="dictFormRef"
        :rules="dictRules"
        :model="dictForm"
        label-width="8rem">
      <FormItem label="名稱" prop="name">
        <InputText v-model="dictForm.name" fluid />
      </FormItem>
      <FormItem label="描述">
        <Textarea v-model="dictForm.description" fluid rows="3" autoResize />
      </FormItem>
      <FormItem label="原文語言" v-if="false">
        <Select v-model="dictForm.language" :options="langOptions" optionLabel="label" optionValue="value" placeholder="請選擇選項" class="w-full" />
      </FormItem>
      <FormItem label="譯文語言" v-if="false">
        <Select v-model="dictForm.translateLanguage" :options="transLangOptions" optionLabel="label" optionValue="value" placeholder="請選擇選項" class="w-full" />
      </FormItem>
      <div class="flex justify-center gap-4">
        <Button severity="secondary" @click="emit('close')" label="關閉" />
        <Button severity="primary" :loading="loading" @click="onSubmit" label="確定" />
      </div>
    </Form>
  </div>
</template>

<style scoped lang="scss">
</style>
