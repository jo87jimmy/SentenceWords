export function cloneDeep<T>(val: T) {
    return JSON.parse(JSON.stringify(val))
}
//获取学习进度
export function _getStudyProgress(index: number, total: number) {
    return Number(((index / total) * 100).toFixed())
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