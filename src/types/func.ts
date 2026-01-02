// import { cloneDeep } from '@/utils/index'
import { type Dict, DictType } from '@/types/types'
import { shallowReactive } from 'vue'

export function getDefaultDict(val: Partial<Dict> = {}): Dict {
    return {
        id: '',
        name: '',
        description: '',
        url: '',
        length: 0,
        category: '',
        tags: [],
        translateLanguage: '',
        type: DictType.word,
        language: 'en',
        lastLearnIndex: 0,
        perDayStudyNumber: 20,
        custom: false,
        complete: false,

        createdBy: '',
        en_name: '',
        category_id: undefined,
        is_default: false,

        ...val,
        //只監聽列表本身的變動 (增加/刪除項目)，不要監聽列表裡面每一個單字物件屬性的細微變化，提升應用程序的性能
        words: shallowReactive(val.words ?? []),
        articles: shallowReactive(val.articles ?? []),
        statistics: shallowReactive(val.statistics ?? []),

    }
}
