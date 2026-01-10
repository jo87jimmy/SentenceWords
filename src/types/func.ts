import { cloneDeep } from 'lodash-es'
import { type Dict, DictType, PracticeArticleWordType, type ArticleWord } from '@/types/types' // 引入 Dict 類型和枚舉
import { shallowReactive } from 'vue' // 引入 shallowReactive，用於優化大型物件的響應式性能
import { type Word, type Article } from "@/types/types.ts";
import { nanoid } from "nanoid";

export function getDefaultArticleWord(val: Partial<ArticleWord> = {}): ArticleWord {
    return getDefaultWord({
        nextSpace: true,
        symbolPosition: '',
        input: '',
        type: PracticeArticleWordType.Word,
        ...val
    }) as ArticleWord
}

export function getDefaultWord(val: Partial<Word> = {}): Word {
    return {
        custom: false,
        id: nanoid(6),
        "word": "",
        "phonetic0": "",
        "phonetic1": "",
        "trans": [],
        "sentences": [],
        "phrases": [],
        "synos": [],
        "relWords": {
            "root": "",
            "rels": []
        },
        "etymology": [],
        ...val
    }
}
export function getDefaultDict(val: Partial<Dict> = {}): Dict { // 獲取預設字典物件的函數，支持傳入部分屬性覆蓋
    return {
        id: '', // 預設 ID 為空字串
        name: '', // 預設名稱為空字串
        description: '', // 預設描述為空字串
        url: '', // 預設 URL 為空字串
        length: 0, // 預設單字數量為 0
        category: '', // 預設分類為空字串
        tags: [], // 預設標籤為空陣列
        translateLanguage: '', // 預設翻譯語言為空字串
        type: DictType.word, // 預設類型為單字書 (word)
        language: 'en', // 預設學習語言為英文
        lastLearnIndex: 0, // 預設上次學習位置為 0
        perDayStudyNumber: 20, // 預設每日學習數量為 20
        custom: false, // 預設非自定義字典
        complete: false, // 預設學習未完成

        createdBy: '', // 創建者資訊 (預設為空)
        en_name: '', // 英文名稱 (預設為空)
        category_id: undefined, // 分類 ID (預設未定義)
        is_default: false, // 是否為預設字典 (預設否)

        ...val, // 展開傳入的 val 物件，覆蓋預設值
        // 只監聽列表本身的變動 (增加/刪除項目)，不要監聽列表裡面每一個單字物件屬性的細微變化，提升應用程序的性能
        words: shallowReactive(val.words ?? []), // 單字列表使用 shallowReactive 初始化
        articles: shallowReactive(val.articles ?? []), // 文章列表使用 shallowReactive 初始化
        statistics: shallowReactive(val.statistics ?? []), // 統計列表使用 shallowReactive 初始化

    }
}

export function getDefaultArticle(val: Partial<Article> = {}): Article {
    return {
        id: undefined,
        title: '',
        titleTranslate: '',
        text: '',
        textTranslate: '',
        newWords: [],
        sections: [],
        audioSrc: '',
        audioFileId: '',
        lrcPosition: [],
        questions: [],
        nameList: [],
        ...cloneDeep(val)
    }
}

