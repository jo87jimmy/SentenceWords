import { type Article, DictId, PracticeArticleWordType, type Sentence } from "@/types/types.ts"
import { _nextTick, cloneDeep } from "@/utils"
import { usePlayWordAudio } from "@/hooks/sound.ts"
import { getSentenceAllText, getSentenceAllTranslateText } from "@/hooks/translate.ts"
import { getDefaultArticleWord, getDefaultDict } from "@/types/func.ts"
import { useBaseStore } from "@/stores/base.ts"
import { useRuntimeStore } from "@/stores/runtime.ts"

interface Token {
  word: string
  start: number
  end: number
  type: PracticeArticleWordType
}

function parseSentence(sentence: string) {
  // 先統一一些常見的「智能引號」→ 直引號，避免匹配問題
  sentence = sentence
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // 各種單引號 → '
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // 各種雙引號 → "

  const len = sentence.length
  const tokens: Token[] = []
  let i = 0

  while (i < len) {
    const ch = sentence[i] as string

    // 跳過空白（但不把空白作為 token）
    if (/\s/.test(ch)) {
      i++
      continue
    }

    const rest = sentence.slice(i)

    // 1) 貨幣 + 數字（$1,000.50 或 ¥200 或 €100.5）
    let m = rest.match(/^[\$¥€£]\d{1,3}(?:,\d{3})*(?:\.\d+)?%?/)
    if (m) {
      tokens.push({ word: m[0], start: i, end: i + m[0].length, type: PracticeArticleWordType.Number })
      i += m[0].length
      continue
    }

    // 2) 數字/小數/百分比（100% 3.14 1,000.00）
    m = rest.match(/^\d{1,3}(?:,\d{3})*(?:\.\d+)?%?/)
    if (m) {
      tokens.push({ word: m[0], start: i, end: i + m[0].length, type: PracticeArticleWordType.Number })
      i += m[0].length
      continue
    }

    // 3) 帶點縮寫或多段縮寫（U.S. U.S.A. e.g. i.e. Ph.D.）
    m = rest.match(/^[A-Za-z]+(?:\.[A-Za-z]+)+\.?/)
    if (m) {
      tokens.push({ word: m[0], start: i, end: i + m[0].length, type: PracticeArticleWordType.Word })
      i += m[0].length
      continue
    }

    // 4) 單詞（包含撇號/連字符，如 it's, o'clock, we'll, mother-in-law）
    m = rest.match(/^[A-Za-z0-9]+(?:['\-][A-Za-z0-9]+)*/)
    if (m) {
      tokens.push({ word: m[0], start: i, end: i + m[0].length, type: PracticeArticleWordType.Word })
      i += m[0].length
      continue
    }

    // 5) 其它可視符號（標點）——單字符處理（連續標點會被循環拆為單字符）
    //    包括：.,!?;:"'()-[]{}<>/\\@#%^&*~`等非單詞非空白字符
    if (/[^\w\s]/.test(ch)) {
      tokens.push({ word: ch, start: i, end: i + 1, type: PracticeArticleWordType.Symbol })
      i += 1
      continue
    }

    // 6) 回退方案：把當前字符當作一個 token（防止意外丟失）
    tokens.push({ word: ch, start: i, end: i + 1, type: PracticeArticleWordType.Symbol })
    i += 1
  }

  // 計算 nextSpace：查看當前 token 的 end 到下一個 token 的 start 之間是否含空白
  const result = tokens.map((t, idx) => {
    const next = tokens[idx + 1]
    const between = next ? sentence.slice(t.end, next.start) : sentence.slice(t.end)
    const nextSpace = /\s/.test(between)
    return getDefaultArticleWord({ word: t.word, nextSpace, type: t.type })
  })

  return result
}

// 生成文章段落數據
export function genArticleSectionData(article: Article): number {
  let text = article.text.trim()
  let sections: Sentence[][] = []
  text
    .split("\n\n")
    .filter(Boolean)
    .map((sectionText) => {
      let section: Sentence[] = []
      sections.push(section)
      sectionText
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((item, idx, arr) => {
          item = item.trim()
          // 如果沒有空格，導致修改一行一行的數據時，匯總時全沒有空格了，庫無法正常斷句
          // 所以要保證最後一個是空格，但防止用戶打 N 個空格，就去掉再加上一個空格，只需要一個即可
          // 2025/10/1: 最後一句不需要空格
          if (idx < arr.length - 1) item += " "
          let sentence: Sentence = cloneDeep({
            text: item,
            translate: "",
            words: parseSentence(item),
            audioPosition: [0, 0]
          })
          section.push(sentence)
        })
    })

  sections = sections.filter((v) => v.length)
  article.sections = sections

  let failCount = 0
  let translateList = article.textTranslate?.split("\n\n") || []
  for (let i = 0; i < article.sections.length; i++) {
    const v = article.sections[i]
    if (!v) continue
    let sList: string[] = []
    try {
      const s = translateList[i]
      if (s) {
        sList = s.split("\n")
      }
    } catch (e) {
      // 忽略錯誤
    }

    for (let j = 0; j < v.length; j++) {
      const sentence = v[j]
      if (!sentence) continue
      try {
        const trans = sList[j]
        if (trans?.trim()) {
          sentence.translate = trans
        } else {
          failCount++
        }
      } catch (e) {
        failCount++
        // console.log('沒有對應的翻譯', sentence.text)
      }
    }
  }

  text = getSentenceAllText(article)
  let translate = getSentenceAllTranslateText(article)

  article.text = text
  article.textTranslate = translate

  let count = 0
  if (article?.lrcPosition?.length) {
    article.sections.map((v) => {
      v.map((w) => {
        const pos = article.lrcPosition[count]
        if (pos) {
          w.audioPosition = pos
        }
        count++
      })
    })
  }
  return failCount
}

export function splitEnArticle2(text: string): string {
  text = text.trim()
  if (!text && false) {
    // 測試用例（已註釋）
  }

  if (!text) return ""

  const abbreviations = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Sr", "Jr", "St", "Co", "Ltd", "Inc", "e.g", "i.e", "U.S.A", "U.S", "U.K", "etc"]

  function isSentenceEnd(text: string, idx: number): boolean {
    const before = text.slice(0, idx + 1)
    const after = text.slice(idx + 1)

    const abbrevPattern = new RegExp("\\b(" + abbreviations.join("|") + ")\\.$", "i")
    if (abbrevPattern.test(before)) return false
    if (/\d+\.$/.test(before)) return false
    if (/\d+\.\d/.test(text.slice(idx - 1, idx + 2))) return false
    if (/%/.test(after)) return false
    if (/[\$¥€]\d/.test(before + after)) return false

    return true
  }

  function normalizeQuotes(text: string): string {
    const isWord = (ch: string) => /\w/.test(ch)
    let res: string[] = []
    let singleOpen = false
    let doubleOpen = false
    for (let i = 0; i < text.length; i++) {
      const ch = text[i] as string
      if (ch === "'") {
        const prev = i > 0 ? (text[i - 1] as string) : ""
        const nxt = i + 1 < text.length ? (text[i + 1] as string) : ""
        if (isWord(prev) && isWord(nxt)) {
          res.push("'")
          continue
        }
        if (singleOpen) {
          if (res.length && res[res.length - 1] === " ") res.pop()
          res.push("'")
          singleOpen = false
        } else {
          res.push("'")
          singleOpen = true
        }
      } else if (ch === '"') {
        if (doubleOpen) {
          if (res.length && res[res.length - 1] === " ") res.pop()
          res.push('"')
          doubleOpen = false
        } else {
          res.push('"')
          doubleOpen = true
        }
      } else {
        res.push(ch)
      }
    }
    return res.join("")
  }

  let rawParagraphs = text.split("\n\n").join("`^`").split("\n").join("").split("`^`")

  const formattedParagraphs = rawParagraphs.map((p: string) => {
    p = p.trim()
    if (!p) return ""

    p = p.replace(/\n/g, " ")
    p = normalizeQuotes(p)

    const tentative: string[] = p.match(/[^.!?。！？]+[.!?。！？'"")']*/g) || []

    const sentences: string[] = []
    tentative.forEach((segment) => {
      segment = segment.trim()
      if (!segment) return

      const lastCharIdx = segment.length - 1
      const lastChar = segment[lastCharIdx] as string
      if (/[.!?。！？]/.test(lastChar)) {
        const globalIdx = p.indexOf(segment)
        if (!isSentenceEnd(p, globalIdx + segment.length - 1)) {
          if (sentences.length > 0) {
            sentences[sentences.length - 1] += " " + segment
          } else {
            sentences.push(segment)
          }
          return
        }
      }
      sentences.push(segment)
    })

    const finalSentences: string[] = []
    let i = 0
    while (i < sentences.length) {
      let cur = sentences[i] as string
      if (i + 1 < sentences.length) {
        const nxt = sentences[i + 1] as string
        if (/['"")'\]]$/.test(cur) && /^[a-z]|^(I|You|She|He|They|We)\b/i.test(nxt)) {
          finalSentences.push(cur + " " + nxt)
          i += 2
          continue
        }
      }
      finalSentences.push(cur)
      i += 1
    }

    return finalSentences.join("\n")
  })

  return formattedParagraphs.filter((p: string) => p).join("\n\n")
}

export function splitCNArticle2(text: string): string {
  if (!text && false) {
    // text = "飞机误点了，侦探们在机场等了整整一上午。他们正期待从南非来的一个装着钻石的贵重包裹。数小时以前，有人向警方报告，说有人企图偷走这些钻石。当飞机到达时，一些侦探等候在主楼内，另一些侦探则守候在停机坪上。有两个人把包裹拿下飞机，进了海关。这时两个侦探把住门口，另外两个侦探打开了包裹。令他们吃惊的是，那珍贵的包裹里面装的全是石头和沙子！"
    //     text = `那是个星期天，而在星期天我是从来不早起的，有时我要一直躺到吃午饭的时候。上个星期天，我起得很晚。我望望窗外，外面一片昏暗。“鬼天气！”我想，“又下雨了。”正在这时，电话铃响了。是我姑母露西打来的。“我刚下火车，”她说，“我这就来看你。”
    // “但我还在吃早饭，”我说。
    // “你在干什么？”她问道。
    // “我正在吃早饭，”我又说了一遍。
    // “天啊，”她说，“你总是起得这么晚吗？现在已经1点钟了！”`
    //     text = `上星期我去看戏。我的座位很好，戏很有意思，但我却无法欣赏。一青年男子与一青年女子坐在我的身后，大声地说着话。我非常生气，因为我听不见演员在说什么。我回过头去怒视着那一男一女，他们却毫不理会。最后，我忍不住了，又一次回过头去，生气地说：“我一个字也听不见了！”
    // “不关你的事，”那男的毫不客气地说，“这是私人间的谈话！”`
  }
  const segmenterJa = new Intl.Segmenter("zh-CN", { granularity: "sentence" })

  let sectionTextList = text.replaceAll("\n\n", "`^`").replaceAll("\n", "").split("`^`")

  let s = sectionTextList
    .filter((v: string) => v)
    .map((rowSection: string) => {
      const segments = segmenterJa.segment(rowSection)
      let ss = ""
      Array.from(segments).map((sentenceRow: any) => {
        let row = sentenceRow.segment
        if (row) {
          //这个库总是会把反引号给断句到上一行末尾
          //而 sentence-splitter 这个库总是会把反引号给断句到下一行开头
          if (row[row.length - 1] === "“") {
            row = row.substring(0, row.length - 1)
            ss += row + "\n" + "“"
          } else {
            ss += row + "\n"
          }
        }
      })
      return ss
    })
    .join("\n")
    .trim()
  return s
}

export function usePlaySentenceAudio() {
  const playWordAudio = usePlayWordAudio()
  let timer: ReturnType<typeof setTimeout> | null = null

  function playSentenceAudio(sentence: Sentence, ref?: HTMLAudioElement) {
    if (sentence.audioPosition?.length && ref && ref.src) {
      if (timer) clearTimeout(timer)
      if (ref.played) {
        ref.pause()
      }
      let start = sentence.audioPosition[0] || 0
      ref.currentTime = start
      ref.play()?.catch((e) => {
        console.warn("自動播放被阻止:", e)
      })
      let end = sentence.audioPosition?.[1]

      if (end && end !== -1) {
        timer = setTimeout(() => {
          console.log("停止")
          ref.pause()
        }, ((end - start) / ref.playbackRate) * 1000)
      }
    } else {
      playWordAudio(sentence.text)
    }
  }

  return {
    playSentenceAudio
  }
}

// TODO: 考慮與 syncDictInMyStudyList、changeDict 方法合併
export function syncBookInMyStudyList(study = false) {
  _nextTick(() => {
    const base = useBaseStore()
    const runtimeStore = useRuntimeStore()
    let temp = runtimeStore.editDict
    let rIndex = base.article.bookList.findIndex((v) => v.id === temp.id)
    if (!temp.custom && temp.id !== DictId.articleCollect) {
      temp.custom = true
      if (!temp.id.includes('_custom')) {
        temp.id += '_custom'
      }
    }
    temp.length = temp.articles.length
    if (rIndex > -1) {
      base.article.bookList[rIndex] = getDefaultDict(temp)
      if (study) base.article.studyIndex = rIndex
    } else {
      base.article.bookList.push(getDefaultDict(temp))
      if (study) base.article.studyIndex = base.article.bookList.length - 1
    }
  }, 100)
}
