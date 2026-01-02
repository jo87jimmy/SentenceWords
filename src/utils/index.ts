import dayjs from 'dayjs'
import { getDefaultSettingState } from "@/stores/setting.ts";

export function cloneDeep<T>(val: T) {
    return JSON.parse(JSON.stringify(val))
}
//获取完成天数
export function _getAccomplishDays(total: number, dayNumber: number) {
    return Math.ceil(total / dayNumber)
}

//获取完成日期
export function _getAccomplishDate(total: number, dayNumber: number) {
    if (dayNumber <= 0) return '-'
    let d = _getAccomplishDays(total, dayNumber)
    return dayjs().add(d, 'day').format('YYYY-MM-DD')
}

//获取学习进度
export function _getStudyProgress(index: number, total: number) {
    return Number(((index / total) * 100).toFixed())
}

export function checkAndUpgradeSaveSetting(val: any) {
    // console.log(configStr)
    // console.log('s', new Blob([val]).size)
    // val = ''
    let defaultState = getDefaultSettingState()
    if (val) {
        try {
            let data
            if (typeof val === 'string') {
                data = JSON.parse(val)
            } else {
                data = val
            }
            if (!data.version) return defaultState
            let state: SettingState & { [key: string]: any } = data.val
            if (typeof state !== 'object') return defaultState
            state.load = false
            let version = Number(data.version)
            if (version === SAVE_SETTING_KEY.version) {
                checkRiskKey(defaultState.shortcutKeyMap, state.shortcutKeyMap)
                delete state.shortcutKeyMap
                checkRiskKey(defaultState, state)
                return defaultState
            } else {
                if (version === 13) {
                    defaultState.soundType = state.soundType
                }
                //为了保持永远是最新的快捷键选项列表，但保留住用户的自定义设置，去掉无效的快捷键选项
                //例: 2版本，可能有快捷键A。3版本没有了
                checkRiskKey(defaultState.shortcutKeyMap, state.shortcutKeyMap)
                delete state.shortcutKeyMap
                checkRiskKey(defaultState, state)
                return defaultState
            }
        } catch (e) {
            return defaultState
        }
    }
    return defaultState
}

export function checkAndUpgradeSaveDict(val: any) {
    // console.log(configStr)
    // console.log('s', new Blob([val]).size)
    // val = ''
    let defaultState = getDefaultBaseState()
    if (val) {
        try {
            let data: any
            if (typeof val === 'string') {
                data = JSON.parse(val)
            } else {
                data = val
            }
            if (!data.version) return defaultState
            let state: any = data.val
            if (typeof state !== 'object') return defaultState
            state.load = false
            let version = Number(data.version)
            // console.log('state', state)
            if (version === SAVE_DICT_KEY.version) {
                checkRiskKey(defaultState, state)
                defaultState.article.bookList = defaultState.article.bookList.map(v => {
                    return getDefaultDict(checkRiskKey(getDefaultDict(), v))
                })
                defaultState.word.bookList = defaultState.word.bookList.map(v => {
                    return getDefaultDict(checkRiskKey(getDefaultDict(), v))
                })
                return defaultState
            } else {
                checkRiskKey(defaultState, state)
                return defaultState
            }
        } catch (e) {
            return defaultState
        }
    }
    return defaultState
}

//筛选未自定义的词典，未自定义的词典不需要保存单词，用的时候再下载
export function shakeCommonDict(n: BaseState): BaseState {
    let data: BaseState = cloneDeep(n)
    data.word.bookList.map((v: Dict) => {
        if (!v.custom && ![DictId.wordKnown, DictId.wordWrong, DictId.wordCollect].includes(v.id)) v.words = []
    })
    data.article.bookList.map((v: Dict) => {
        if (!v.custom && ![DictId.articleCollect].includes(v.id)) v.articles = []
        else {
            v.articles.map(a => {
                //运行时再生成
                a.sections = []
            })
        }
    })
    return data
}

export function useNav() {
    const router = useRouter()
    const runtimeStore = useRuntimeStore()

    function nav(path, query = {}, data?: any) {
        if (data) {
            runtimeStore.routeData = cloneDeep(data)
        }
        router.push({ path, query })
    }

    return { nav, push: nav, back: router.back }
}