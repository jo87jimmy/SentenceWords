// import { cloneDeep } from '@/utils/index'
import { type Dict, DictType } from '@/types/types' // 引入 Dict 類型和枚舉
import { shallowReactive } from 'vue' // 引入 shallowReactive

export function getDefaultDict(val: Partial<Dict> = {}): Dict { // 獲取預設字典物件的函數，支持傳入部分屬性覆蓋
    return {
        id: '', // 預設 ID 為空
        name: '', // 預設名稱為空
        description: '', // 預設描述為空
        url: '', // 預設 URL 為空
        length: 0, // 預設長度 0
        category: '', // 預設分類為空
        tags: [], // 預設標籤為空陣列
        translateLanguage: '', // 預設翻譯語言為空
        type: DictType.word, // 預設類型為單字書 (word)
        language: 'en', // 預設語言為英文
        lastLearnIndex: 0, // 預設上次學習位置為 0
        perDayStudyNumber: 20, // 預設每日學習數量為 20
        custom: false, // 預設非自定義
        complete: false, // 預設未完成

        createdBy: '', // 創建者
        en_name: '', // 英文名稱
        category_id: undefined, // 分類 ID
        is_default: false, // 是否預設

        ...val, // 展開傳入的覆蓋屬性
        // 只監聽列表本身的變動 (增加/刪除項目)，不要監聽列表裡面每一個單字物件屬性的細微變化，提升應用程序的性能
        words: shallowReactive(val.words ?? []), // 單字列表使用 shallowReactive
        articles: shallowReactive(val.articles ?? []), // 文章列表使用 shallowReactive
        statistics: shallowReactive(val.statistics ?? []), // 統計列表使用 shallowReactive

    }
}
