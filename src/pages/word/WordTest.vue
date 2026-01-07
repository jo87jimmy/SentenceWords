<script setup lang="ts">
import {onMounted, ref, computed} from 'vue'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import BasePage from '@/components/BasePage.vue'
import VolumeIcon from '@/components/icon/VolumeIcon.vue'
import {useRoute, useRouter} from 'vue-router'
import {useBaseStore} from '@/stores/base.ts'
import {type Dict, type Word} from '@/types/types.ts'
import {_getDictDataByUrl, shuffle} from '@/utils'
import {useRuntimeStore} from '@/stores/runtime.ts'
import {usePlayBeep, usePlayCorrect, usePlayWordAudio} from '@/hooks/sound.ts'
import Toast from '@/components/base/toast/Toast.ts'

type Candidate = { word: string, wordObj?: Word }
type Question = {
  stem: Word,
  candidates: Candidate[],
  optionTexts: string[],
  correctIndex: number,
  selectedIndex: number,
  submitted: boolean
}

const route = useRoute()
const router = useRouter()
const base = useBaseStore()
const runtimeStore = useRuntimeStore()
const playBeep = usePlayBeep()
const playCorrect = usePlayCorrect()
const playWordAudio = usePlayWordAudio()

let loading = ref(false)
let dict = ref<Dict>()
let questions = ref<Question[]>([])
let index = ref(0)
const currentQuestion = computed(() => questions.value[index.value])

function getWordByText(val: string, list: Word[]): Word | undefined {
  let r = list.find(v => v.word.toLowerCase() === val.toLowerCase())
  return r
}

function pickRelVariant(w: Word, list: Word[]): Candidate | null {
  let rels = w.relWords?.rels || []
  for (let i = 0; i < rels.length; i++) {
    const rel = rels[i]
    if (!rel) continue
    for (let j = 0; j < rel.words.length; j++) {
      const wordItem = rel.words[j] // 獲取 array item
      if (!wordItem) continue // 若不存在則跳過
      let c = wordItem.c
      let r = getWordByText(c, list)
      if (r && r.word.toLowerCase() !== w.word.toLowerCase()) {
        return {word: r.word, wordObj: r}
      }
    }
  }
  return null
}

function pickSynonym(w: Word, list: Word[]): Candidate | null {
  let synos = w.synos || []
  for (let i = 0; i < synos.length; i++) {
    const syno = synos[i]
    if (!syno) continue
    for (let j = 0; j < syno.ws.length; j++) {
      let c = syno.ws[j]
      if (!c) continue
      let r = getWordByText(c, list)
      if (r && r.word.toLowerCase() !== w.word.toLowerCase()) {
        return {word: r.word, wordObj: r}
      }
    }
  }
  return null
}

function pickSamePos(w: Word, list: Word[]): Candidate | null {
  let pos = (w.trans?.[0]?.pos || '').trim()
  let samePos = list.filter(v => v.word.toLowerCase() !== w.word.toLowerCase() && v.trans?.some(t => t.pos === pos))
  if (samePos.length) {
    let r = samePos[Math.floor(Math.random() * samePos.length)]
    if (r) return {word: r.word, wordObj: r}
  }
  return null
}

function buildQuestion(w: Word, list: Word[]): Question {
  let candidates: Candidate[] = []
  candidates.push({word: w.word, wordObj: w})
  let c1 = pickRelVariant(w, list) || pickSynonym(w, list) || pickSamePos(w, list)
  let c2 = null as Candidate | null
  let tried = new Set<string>([w.word.toLowerCase()])
  if (c1) tried.add(c1.word.toLowerCase())
  let attempts = 0
  while (!c2 && attempts < 5) {
    c2 = pickSynonym(w, list) || pickSamePos(w, list) || pickRelVariant(w, list)
    if (c2 && tried.has(c2.word.toLowerCase())) c2 = null
    attempts++
  }
  if (!c1) {
    let rand = list.filter(v => v.word.toLowerCase() !== w.word.toLowerCase())
    if (rand.length) {
      const r = rand[Math.floor(Math.random() * rand.length)]
      if (r) c1 = { word: r.word, wordObj: r }
    }
  }
  if (!c2) {
    let rand = list.filter(v => v.word.toLowerCase() !== w.word.toLowerCase() && v.word.toLowerCase() !== c1?.word.toLowerCase())
    if (rand.length) {
      const r = rand[Math.floor(Math.random() * rand.length)]
      if (r) c2 = { word: r.word, wordObj: r }
    }
  }
  if (c1) candidates.push(c1)
  if (c2) candidates.push(c2)
  const labels = candidates.map(v => formatCandidateText(v))
  const indices = Array.from({ length: candidates.length }, (_, i) => i)
  const order = shuffle(indices)
  const optionTexts = order.map(i => labels[i] as string)
  const correctIndex = order.indexOf(0)
  return {
    stem: w,
    candidates,
    optionTexts,
    correctIndex,
    selectedIndex: -1,
    submitted: false
  }
}

function formatCandidateText(c: Candidate): string {
  const w = c.wordObj
  if (!w || !w.trans || !w.trans.length) return '當前詞典未收錄釋義'

  const cleanCn = (cn: string, head: string) => {
    let t = cn || ''
    // 去掉含英文的括號片段（避免出現人名或英文拼寫）
    t = t.replace(/（[^）]*[A-Za-z][^）]*）/g, '')
    // 去掉“時態/過去式/複數”等形態說明
    t = t.replace(/(時\s*態|過去式|過去分詞|現在分詞|複數|第三人稱|比較級|最高級)[:：].*/g, '')
    // 去掉直接出現的英文詞頭
    const headEsc = head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    t = t.replace(new RegExp(headEsc, 'gi'), '')
    // 統一分隔符為中文分號
    t = t.replace(/[;；]\s*/g, '；')
    // 收尾空白
    t = t.trim()
    return t
  }

  const parts = w.trans
    .map(v => {
      const pos = (v.pos || '').trim()
      const cn = cleanCn(v.cn || '', w.word)
      if (/^\s*【名】/.test(v.cn || '')) return ''
      if (!cn) return ''
      return `${pos ? '- ' + pos + ' ' : '- '}${cn}`
    })
    .filter(Boolean)

  return parts.length ? parts.join('；') : '當前詞典未收錄釋義'
}

async function init() {
  let dictId: any = route.params.id
  let d = base.word.bookList.find(v => v.id === dictId)
  if (!d) d = base.sdict
  if (!d?.id) return router.push('/words')
  if (!d.words.length && runtimeStore.editDict?.id === d.id) {
    loading.value = true
    let r = await _getDictDataByUrl(runtimeStore.editDict)
    d = r
    loading.value = false
  }
  dict.value = d
  if (!dict.value.words.length) {
    return Toast.warning('沒有單字可測試！')
  }
  const wordList = shuffle(dict.value.words)
  questions.value = wordList.map(w => buildQuestion(w, dict.value!.words))
  index.value = 0
}

function select(i: number) {
  let q = questions.value[index.value]
  if (!q || q.submitted) return
  q.selectedIndex = i
  q.submitted = true
  if (i === q.correctIndex) {
    playCorrect()
  } else {
    playBeep()
    let temp = q.stem.word.toLowerCase()
    if (!base.wrong.words.find((v: Word) => v.word.toLowerCase() === temp)) {
      base.wrong.words.push(q.stem)
      base.wrong.length = base.wrong.words.length
    }
  }
}

function next() {
  if (index.value < questions.value.length - 1) index.value++
}

function end() {
  router.back()
}

onMounted(init)
</script>

<template>
  <BasePage>
    <div class="p-6 bg-surface-0 dark:bg-surface-900 shadow rounded-lg flex flex-col">
      <div class="flex items-center justify-between">
        <div class="text-xl font-bold">測試：{{ dict?.name }}</div>
        <div class="text-base">{{ index + 1 }} / {{ questions.length }}</div>
      </div>
      <Divider class="my-4" />

      <div v-if="currentQuestion" class="flex flex-col gap-4">
        <div class="text-2xl en-article-family flex items-center gap-2">
          <span>題目：{{ currentQuestion.stem.word }}</span>
          <VolumeIcon :simple="true" :title="'發音'" :cb="() => playWordAudio(currentQuestion!.stem.word)"/>
        </div>
        <div class="grid gap-2">
          <div
            v-for="(opt,i) in currentQuestion.optionTexts"
            :key="i"
            class="border rounded p-2 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            :class="{
              'text-green-600': currentQuestion.submitted && i === currentQuestion.correctIndex,
              'text-red-600': currentQuestion.submitted && i === currentQuestion.selectedIndex && i !== currentQuestion.correctIndex
            }"
            @click="select(i)"
          >
            <span>(<span class="italic">{{ ['A','B','C'][i] }}</span>) {{ opt }}</span>
          </div>
        </div>

        <div v-if="currentQuestion.submitted" class="mt-4">
          <div class="mb-2 text-base">選項解析：</div>
          <div class="grid gap-2 grid-cols-1 md:grid-cols-3">
            <div v-for="(c,i) in currentQuestion.candidates" :key="i" class="p-2 rounded bg-surface-50 dark:bg-surface-800">
              <div class="en-article-family text-lg">{{ c.word }}</div>
              <div class="mt-1 text-sm">{{ c.wordObj?.trans?.map(v => v.cn).join('；') || '當前詞典未收錄釋義' }}</div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex gap-2">
          <Button label="繼續測試" @click="next" />
          <Button label="結束" severity="secondary" outlined @click="end" />
        </div>
      </div>
    </div>
  </BasePage>
</template>


