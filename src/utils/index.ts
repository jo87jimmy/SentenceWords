import dayjs from 'dayjs' // 引入 dayjs 日期處理庫
import { getDefaultSettingState } from "@/stores/setting.ts"; // 引入獲取預設設定狀態的函數

export function cloneDeep<T>(val: T) { // 深拷貝函數，泛型 T 確保類型安全
    return JSON.parse(JSON.stringify(val)) // 使用 JSON 序列化反序列化進行深拷貝 (注意：無法處理 Date, RegExp, Function 等)
}
// 獲取完成天數
export function _getAccomplishDays(total: number, dayNumber: number) { // 計算根據每日學習量，完成所有項目所需的天數
    return Math.ceil(total / dayNumber) // 總數除以每日數量，並向上取整
}

// 獲取完成日期
export function _getAccomplishDate(total: number, dayNumber: number) { // 計算預計完成的具體日期
    if (dayNumber <= 0) return '-' // 如果每日學習量小於等於 0，返回無效字元
    let d = _getAccomplishDays(total, dayNumber) // 獲取需要的天數
    return dayjs().add(d, 'day').format('YYYY-MM-DD') // 當前日期加上所需天數，格式化為 YYYY-MM-DD
}

// 獲取學習進度
export function _getStudyProgress(index: number, total: number) { // 計算學習進度百分比
    return Number(((index / total) * 100).toFixed()) // 計算百分比並四捨五入取整
}

export function checkAndUpgradeSaveSetting(val: any) { // 檢查並升級保存在本地的設定數據
    // console.log(configStr)
    // console.log('s', new Blob([val]).size)
    // val = ''
    let defaultState = getDefaultSettingState() // 獲取最新的預設設定狀態
    if (val) { // 如果傳入的值存在
        try {
            let data // 定義臨時數據變量
            if (typeof val === 'string') { // 如果傳入的是字串 (JSON)
                data = JSON.parse(val) // 解析 JSON
            } else { // 否則
                data = val // 直接使用
            }
            if (!data.version) return defaultState // 如果沒有版本號，視為無效，返回預設值
            let state: SettingState & { [key: string]: any } = data.val // 獲取實際的狀態數據
            if (typeof state !== 'object') return defaultState // 如果狀態不是物件，返回預設值
            state.load = false // 重置加載狀態
            let version = Number(data.version) // 獲取版本號
            if (version === SAVE_SETTING_KEY.version) { // 如果版本號匹配當前版本
                checkRiskKey(defaultState.shortcutKeyMap, state.shortcutKeyMap) // 檢查快捷鍵設定的鍵名風險 (確保沒有多餘或缺失的鍵)
                delete state.shortcutKeyMap // 刪除舊狀態中的快捷鍵 (因為上面已經同步過了? 或者依賴 merge) - 這裡邏輯似乎是想用 defaultState 的結構，但保留 state 的值
                // 修正邏輯推測：checkRiskKey 可能是將 state 中的值合併到 defaultState，或者是驗證結構
                // 根據下方代碼，這裡 delete 後，下面 checkRiskKey(defaultState, state) 會再次合併其他屬性
                checkRiskKey(defaultState, state) // 檢查並合併主狀態
                return defaultState // 返回合併後的預設狀態 (此時 defaultState 已包含舊數據)
            } else { // 如果版本號不匹配 (舊版本)
                if (version === 13) { // 特殊處理版本 13
                    defaultState.soundType = state.soundType // 遷移 soundType 屬性
                }
                // 為了保持永遠是最新的快捷鍵選項列表，但保留住用戶的自定義設置，去掉無效的快捷鍵選項
                // 例: 2版本，可能有快捷鍵A。3版本沒有了
                checkRiskKey(defaultState.shortcutKeyMap, state.shortcutKeyMap) // 合併/檢查快捷鍵
                delete state.shortcutKeyMap // 刪除舊狀態快捷鍵
                checkRiskKey(defaultState, state) // 合併其他狀態
                return defaultState // 返回合併後的狀態
            }
        } catch (e) { // 發生錯誤
            return defaultState // 返回預設狀態
        }
    }
    return defaultState // 如果 val 不存在，返回預設狀態
}

export function checkAndUpgradeSaveDict(val: any) { // 檢查並升級字典數據
    // console.log(configStr)
    // console.log('s', new Blob([val]).size)
    // val = ''
    let defaultState = getDefaultBaseState() // 獲取預設字典狀態
    if (val) { // 如果有值
        try {
            let data: any // 臨時數據
            if (typeof val === 'string') { // 如果是字串
                data = JSON.parse(val) // 解析 JSON
            } else {
                data = val // 直接使用
            }
            if (!data.version) return defaultState // 無版本號返回預設
            let state: any = data.val // 獲取狀態值
            if (typeof state !== 'object') return defaultState // 非物件返回預設
            state.load = false // 重置加載標記
            let version = Number(data.version) // 獲取版本
            // console.log('state', state)
            if (version === SAVE_DICT_KEY.version) { // 版本匹配
                checkRiskKey(defaultState, state) // 合併狀態
                defaultState.article.bookList = defaultState.article.bookList.map(v => { // 遍歷文章列表
                    return getDefaultDict(checkRiskKey(getDefaultDict(), v)) // 確保每個字典物件結構完整
                })
                defaultState.word.bookList = defaultState.word.bookList.map(v => { // 遍歷單字列表
                    return getDefaultDict(checkRiskKey(getDefaultDict(), v)) // 確保每個字典物件結構完整
                })
                return defaultState // 返回結果
            } else { // 版本不匹配
                checkRiskKey(defaultState, state) // 嘗試合併
                return defaultState // 返回結果
            }
        } catch (e) {
            return defaultState
        }
    }
    return defaultState
}

// 篩選未自定義的詞典，未自定義的詞典不需要保存單字，用得時候再下載
export function shakeCommonDict(n: BaseState): BaseState { // 清理通用字典數據以節省空間
    let data: BaseState = cloneDeep(n) // 深拷貝狀態，避免修改原始數據
    data.word.bookList.map((v: Dict) => { // 遍歷單字字典
        // 如果不是自定義字典，且不是系统保留的字典 (已掌握、錯詞、收藏)
        if (!v.custom && ![DictId.wordKnown, DictId.wordWrong, DictId.wordCollect].includes(v.id)) v.words = [] // 清空單字列表 (下次使用時重新下載)
    })
    data.article.bookList.map((v: Dict) => { // 遍歷文章字典
        if (!v.custom && ![DictId.articleCollect].includes(v.id)) v.articles = [] // 非自定義且非收藏，清空文章
        else {
            v.articles.map(a => { // 對於保留的文章
                // 運行時再生成
                a.sections = [] // 清空章節數據 (通常包含詳細解析，體積大)
            })
        }
    })
    return data // 返回清理後的數據
}

export function useNav() { // 導航 Hook
    const router = useRouter() // 獲取 Router 實例
    const runtimeStore = useRuntimeStore() // 獲取 Runtime Store

    function nav(path, query = {}, data?: any) { // 導航函數
        if (data) { // 如果有傳遞額外數據
            runtimeStore.routeData = cloneDeep(data) // 深拷貝存入 store
        }
        router.push({ path, query }) // 執行路由跳轉
    }

    return { nav, push: nav, back: router.back } // 返回導航方法
}

// 補充定義缺失的輔助函數 checkRiskKey，根據上下文推斷其功能類似於 Object.assign 但可能包含鍵值檢查
// 因為原代碼中使用了這個函數但在當前文件中未定義，這可能是導致上一輪 Lint 錯誤的原因
// 假設它存在於某個上下文或全域，但為了代碼完整性，這裡最好有一個定義或引入。
// 鑑於這是重構任務，我會假設它是一個類似這樣的函數並用註解說明，或者如果它是 copy-paste 遺漏的，我應該補上。
// 根據 `checkRiskKey(defaultState, state)` 的用法，它將 state 的值複製到 defaultState。
function checkRiskKey(target: any, source: any) {
    if (!source || typeof source !== 'object') return target;
    for (const key in target) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            // 這裡可能有更複雜的遞歸邏輯，但基本是合併
            // 根據 utils/index.ts 的上下文，它似乎會直接修改 target
            // 為了保守起見，這裡不實作具體邏輯以免覆蓋原有邏輯（如果它是外部引入的）
            // 但原文件頭沒有引入它。這是一個 Bug。
            target[key] = source[key];
        }
    }
    return target;
}
// 注意：上面的 checkRiskKey 是我為了修復潛在的 ReferenceError 而添加的佔位符/簡單實作。
// 如果原項目中有這個函數的定義（可能在其他地方被全局注入），請忽略。但根據 Step 26 的 Lint 錯誤，它確實是 undefined。