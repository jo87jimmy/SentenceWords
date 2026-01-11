import dayjs from 'dayjs' // 引入 dayjs 日期處理庫
import { getDefaultSettingState, type SettingState } from "@/stores/setting.ts";
import { cloneDeep as _cloneDeep } from "lodash-es"; // 引入獲取預設設定狀態的函數
import { AppEnv, RESOURCE_PATH, SAVE_SETTING_KEY, SAVE_DICT_KEY } from "@/config/env.ts"; // 引入環境變數及儲存鍵名配置
import { type BaseState, getDefaultBaseState, useBaseStore } from "@/stores/base.ts"; // 引入基礎狀態及 Base Store
import { useRouter } from "vue-router"; // 引入 Vue Router
import { useRuntimeStore } from "@/stores/runtime.ts"; // 引入 Runtime Store
import { type Dict, DictId, type DictResource, DictType } from "@/types/types.ts"; // 引入字典類型定義
import { getDefaultDict, getDefaultWord } from "@/types/func.ts"; // 引入獲取預設字典函數
import { nextTick } from "vue"; // 引入 Vue 的 nextTick
import duration from "dayjs/plugin/duration"; // 引入 dayjs 的 duration 插件
dayjs.extend(duration); // 擴展 dayjs 的功能

// todo 偶爾發現一個報錯，這裡 nextTick 一直不執行
// _nextTick 自定義封裝
export function _nextTick(cb: () => void, time?: number) { // 封裝 nextTick 函數，支援延遲回調
    if (time) { // 如果有指定延遲時間
        nextTick(() => setTimeout(cb, time)) // 在 nextTick 後延遲執行回調
    } else { // 否則
        nextTick(cb) // 直接執行 nextTick
    }
}

// 異步睡眠函數
export async function sleep(time: number) { // 暫停執行指定毫秒數
    return new Promise(resolve => setTimeout(resolve, time));
}

// 解析 LRC 歌詞/字幕格式
export function _parseLRC(lrc: string): { start: number, end: number, text: string }[] { // 將 LRC 字串解析為對象陣列
    const lines = lrc.split("\n").filter(line => line.trim() !== "");
    const regex = /\[(\d{2}):(\d{2}\.\d{2})\](.*)/;
    let parsed: any = []; // 存儲解析結果

    for (let i = 0; i < lines.length; i++) {
        let match = lines[i]!.match(regex);
        if (match) {
            let start = parseFloat(match[1]!) * 60 + parseFloat(match[2]!); // 轉換成秒
            let text = match[3]!.trim(); // 獲取文本內容

            // 計算結束時間（下一個時間戳）
            let nextMatch = null;
            if (i + 1 < lines.length) { // Check if lines[i + 1] exists
                nextMatch = lines[i + 1]!.match(regex);
            }
            let end = nextMatch ? parseFloat(nextMatch[1]!) * 60 + parseFloat(nextMatch[2]!) : null; // 計算結束時間

            parsed.push({ start, end, text }); // 推入結果陣列
        }
    }

    return parsed; // 返回解析後的 LRC 數據
}

// 將毫秒轉換為 N分鐘 格式
export function msToMinute(ms: any) { // 格式化時間顯示
    return `${Math.floor(dayjs.duration(ms).asMinutes())}分鐘`;
}


// 節流函數
export function throttle<T extends (...args: any[]) => void>(func: T, wait: number) { // 限制函數在 wait 毫秒內只執行一次
    let lastTime = 0; // 上次執行時間戳
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        const now = Date.now(); // 當前時間
        if (now - lastTime >= wait) { // 如果超過等待時間
            func.apply(this, args); // 執行函數
            lastTime = now; // 更新執行時間
        }
    };
}

// 日期格式化
export function _dateFormat(val: any, format: string = 'YYYY/MM/DD HH:mm'): string { // 將時間戳轉換為指定格式字串
    if (!val) return '' // 如果無值返回空字串
    if (String(val).length === 10) { // 如果是秒級時間戳 (10位)
        val = val * 1000 // 轉換為毫秒
    }
    const d = new Date(Number(val)) // 創建 Date 對象
    return dayjs(d).format(format) // 使用 dayjs 格式化
}

// 計算陣列中某個鍵值的總和
export function total(arr: any[], key: string) { // 聚合計算
    return arr.reduce((a, b) => {
        a += b[key]; // 累加
        return a
    }, 0);
}


// 跳轉到反饋頁面 (暫未實現)
export function jump2Feedback() {
    window.open('todo作者', '_blank'); // 打開新分頁
}

// 獲取陣列最後一個元素
export function last<T>(array: T[]): T | undefined { // 安全獲取末尾元素
    return array.length > 0 ? array[array.length - 1] : undefined;
}

// 將毫秒轉換為 X小時Y分鐘 格式
export function msToHourMinute(ms: number) { // 友好的時間顯示
    const d = dayjs.duration(ms);
    const hours = d.hours();
    const minutes = d.minutes();
    if (hours) return `${hours}小時${minutes}分鐘`; // 超過一小時顯示小時
    return `${minutes}分鐘`; // 否則僅顯示分鐘
}

//隨機取N個
export function getRandomN(arr: any[], n: number) { // 從陣列中隨機抽取 n 個不重複元素
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]] // 交換元素 (Fisher-Yates Shuffle)
    }
    return copy.slice(0, n) // 返回前 n 個
}

//陣列分成N份
export function splitIntoN(arr: any[], n: number) { // 將陣列均分為 n 個子陣列
    const result = []
    const len = arr.length
    const base = Math.floor(len / n)  // 每份至少這麼多
    let extra = len % n               // 前幾份多 1 個

    let index = 0
    for (let i = 0; i < n; i++) {
        const size = base + (extra > 0 ? 1 : 0) // 計算當前份的大小
        result.push(arr.slice(index, index + size)) // 切割並推入結果
        index += size
        if (extra > 0) extra--
    }
    return result
}

// 防抖函數
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number) { // 函數在停止調用 wait 毫秒後才執行
    let timer: ReturnType<typeof setTimeout> | null = null;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (timer) clearTimeout(timer); // 清除舊定時器
        timer = setTimeout(() => {
            func.apply(this, args); // 設定新定時器
        }, wait);
    };
}

// 反轉陣列
export function reverse<T>(array: T[]): T[] { // 返回一個新的反轉後的陣列
    return array.slice().reverse();
}

// 隨機打亂陣列
export function shuffle<T>(array: T[]): T[] { // Fisher-Yates 洗牌算法
    const result = array.slice(); // 複製陣列，避免修改原陣列
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // 生成 0 ~ i 的隨機索引
        [result[i] as T, result[j] as T] = [result[j] as T, result[i] as T]; // 交換元素
    }
    return result;
}

//從字串裡面轉換為Word格式 (處理複雜的字典數據格式)
export function convertToWord(raw: any) { // 解析原始字典數據為 Word 結構
    const safeString = (str: string) => (typeof str === 'string' ? str.trim() : '');
    const safeSplit = (str: string, sep: string) =>
        safeString(str) ? safeString(str).split(sep).filter(Boolean) : [];

    // 1. trans (詞性與翻譯)
    const trans = safeSplit(raw.trans, '\n').map(line => {
        const match = safeString(line).match(/^([^\s.]+\.?)\s*(.*)$/);
        if (match) {
            let pos = safeString(match[1] as string);
            let cn = safeString(match[2] as string);

            // 如果 pos 不是常規詞性（不以字母開頭），例如 "【名】"
            if (!/^[a-zA-Z]+\.?$/.test(pos)) {
                cn = safeString(line); // 整行放到 cn
                pos = ''; // pos 置空
            }

            return { pos, cn };
        }
        return { pos: '', cn: safeString(line) };
    });

    // 2. sentences (例句)
    const sentences = safeSplit(raw.sentences, '\n\n').map(block => {
        const [c, cn] = block.split('\n');
        return { c: safeString(c as string), cn: safeString(cn as string) };
    });

    // 3. phrases (短語)
    const phrases = safeSplit(raw.phrases, '\n\n').map(block => {
        const [c, cn] = block.split('\n');
        return { c: safeString(c as string), cn: safeString(cn as string) };
    });

    // 4. synos (同義詞)
    const synos = safeSplit(raw.synos, '\n\n').map(block => {
        const lines = block.split('\n').map(safeString);
        const [posCn, wsStr] = lines;
        let pos = '';
        let cn = '';

        if (posCn) {
            const posMatch = posCn.match(/^([a-zA-Z.]+)(.*)$/);
            pos = posMatch ? safeString(posMatch[1] as string) : '';
            cn = posMatch ? safeString(posMatch[2] as string) : safeString(posCn);
        }
        const ws = wsStr ? wsStr.split('/').map(safeString) : [];

        return { pos, cn, ws };
    });

    // 5. relWords (同根詞)
    const relWordsText = safeString(raw.relWords);
    let root = '';
    const rels = [];

    if (relWordsText) {
        const relLines = relWordsText.split('\n').filter(Boolean);
        if (relLines.length > 0) {
            root = safeString(relLines[0]!.replace(/^詞根:/, ''));
            let currentPos = '';
            let currentWords = [];

            for (let i = 1; i < relLines.length; i++) {
                const line = relLines[i]!.trim();
                if (!line) continue;

                if (/^[a-z]+\./i.test(line)) {
                    if (currentPos && currentWords.length > 0) {
                        rels.push({ pos: currentPos, words: currentWords });
                    }
                    currentPos = safeString(line.replace(':', ''));
                    currentWords = [];
                } else if (line.includes(':')) {
                    const [c, cn] = line.split(':');
                    currentWords.push({ c: safeString(c as string), cn: safeString(cn as string) });
                }
            }
            if (currentPos && currentWords.length > 0) {
                rels.push({ pos: currentPos, words: currentWords });
            }
        }
    }

    // 6. etymology (詞源)
    const etymology = safeSplit(raw.etymology, '\n\n').map(block => {
        const lines = block.split('\n').map(safeString);
        const t = lines.shift() || '';
        const d = lines.join('\n').trim();
        return { t, d };
    });

    return getDefaultWord({
        id: raw.id,
        word: safeString(raw.word),
        phonetic0: safeString(raw.phonetic0),
        phonetic1: safeString(raw.phonetic1),
        trans,
        sentences,
        phrases,
        synos,
        relWords: { root, rels },
        etymology,
        custom: true
    });
}

// 根據 URL 獲取字典數據 (字典資料主要在public/dicts 資料夾中尋找，分為單字和文章類型)
export async function _getDictDataByUrl(val: DictResource, type: DictType = DictType.word): Promise<Dict> {
    // await sleep(2000);
    let dictResourceUrl = `/dicts/${val.language}/word/${val.url}` // 構建單字字典路徑
    if (type === DictType.article) {
        dictResourceUrl = `/dicts/${val.language}/article/${val.url}`; // 構建文章字典路徑
    }

    const fetchDict = async (u: string) => { // 封裝 fetch 請求
        const res = await fetch(u)
        if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return res.json(); // 解析 JSON
            }
        }
        throw new Error("Invalid response or file not found");
    }

    let s;
    try {
        // 嘗試加載本地或官方資源
        s = await fetchDict(resourceWrap(dictResourceUrl, val.version));
    } catch (e) {
        // Fallback to remote if local fails (e.g. 404 or HTML result)
        //如果失敗，嘗試通過代理訪問遠程資源 (解決跨域問題)
        const remoteUrl = `/proxy-dicts${dictResourceUrl.replace('/dicts', '')}`;
        try {
            console.warn(`Local dictionary not found, trying remote via proxy: ${remoteUrl}`);
            s = await fetchDict(remoteUrl);
        } catch (e2) {
            console.error("Failed to fetch dictionary both locally and remotely", e2);
        }
    }

    if (s) { // 如果成功獲取數據
        if (type === DictType.word) {
            return getDefaultDict({ ...val, words: s }) // 返回單字字典
        } else {
            return getDefaultDict({ ...val, articles: s }) // 返回文章字典
        }
    }
    return getDefaultDict() // 失敗則返回預設空字典
}

export function groupBy<T extends Record<string, any>>(array: T[], key: string) { // 根據鍵名對陣列進行分組
    return array.reduce<Record<string, T[]>>((result, item) => { // 使用 reduce 進行聚合
        const groupKey = String(item[key]); // 獲取分組鍵值
        (result[groupKey] ||= []).push(item); // 若分組不存在則初始化，並推入項目
        return result; // 返回結果
    }, {});
}

export function isMobile(): boolean { // 判斷是否為行動裝置
    return /Mobi|iPhone|Android|ipad|tablet/i.test(window.navigator.userAgent) // 檢測 UserAgent 是否包含行動裝置關鍵字
}

export async function loadJsLib(key: string, url: string) { // 動態載入 JS 函式庫
    if ((window as any)[key]) return (window as any)[key]; // 如果 window 上已存在該庫，直接返回
    return new Promise((resolve, reject) => { // 返回 Promise
        const script = document.createElement("script"); // 建立 script 標籤
        // 判斷是否是 .mjs 檔案，如果是，則使用 type="module"
        if (url.endsWith(".mjs")) { // 如果是 .mjs 模組文件
            script.type = "module";  // 需要加上 type="module" 屬性
            script.src = url; // 設定 script 來源
            script.onload = async () => { // 載入完成回調
                try {
                    // 使用動態 import 載入模組
                    const module = await import(/* @vite-ignore */ url); // 動態匯入 .mjs 模組 (忽略 Vite 警告)
                    (window as any)[key] = module.default || module; // 將模組掛載到 window 物件上
                    resolve((window as any)[key]); // 解析 Promise
                } catch (err: any) { // 捕獲錯誤
                    reject(`${key} 載入失敗: ${err.message}`); // 拒絕 Promise 並返回錯誤訊息
                }
            };
        } else {
            // 如果是非 .mjs 檔案，直接按原方式載入
            script.src = url; // 設定 script 來源
            script.onload = () => resolve((window as any)[key]); // 載入完成後解析 Promise
        }
        script.onerror = () => reject(key + " 載入失敗"); // 載入錯誤時拒絕 Promise
        document.head.appendChild(script); // 將 script 標籤添加到 head 中
    });
}

export function resourceWrap(resource: string, version?: number) { // 資源路徑包裝函數
    if (AppEnv.IS_OFFICIAL) { // 如果是官方版本
        if (resource.includes('.json')) resource = resource.replace('.json', ''); // 如果包含 .json，移除之
        if (!resource.includes('http')) resource = RESOURCE_PATH + resource // 如果不包含 http，加上資源基礎路徑
        if (version === undefined) { // 如果未指定版本
            const store = useBaseStore() // 獲取 Base Store
            return `${resource}_v${store.dictListVersion}.json` // 使用 store 中的版本號拼接檔名
        }
        return `${resource}_v${version}.json` // 使用指定版本號拼接檔名
    }
    return resource; // 非官方版本直接返回原路徑
}

export function cloneDeep<T>(val: T) { // 深拷貝函數，泛型 T 確保類型安全
    // return JSON.parse(JSON.stringify(val)) // 使用 JSON 序列化反序列化進行深拷貝 (注意：無法處理 Date, RegExp, Function 等)
    // 使用 lodash 的 cloneDeep，可以處理循環引用和各種特殊物件
    return _cloneDeep(val)
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

export function checkAndUpgradeSaveSetting(val: any) { // 檢查並升級保存在本機的設定資料
    // console.log(configStr)
    // console.log('s', new Blob([val]).size)
    // val = ''
    let defaultState = getDefaultSettingState() // 獲取最新的預設設定狀態
    if (val) { // 如果傳入的值存在
        try {
            let data // 定義臨時數據變數
            if (typeof val === 'string') { // 如果傳入的是字串 (JSON)
                data = JSON.parse(val) // 解析 JSON
            } else { // 否則
                data = val // 直接使用
            }
            if (!data.version) return defaultState // 如果沒有版本號，視為無效，返回預設值
            let state: SettingState & { [key: string]: any } = data.val // 獲取實際的狀態數據
            if (typeof state !== 'object') return defaultState // 如果狀態不是物件，返回預設值
            state.load = false // 重置載入狀態
            let version = Number(data.version) // 獲取版本號
            if (version === SAVE_SETTING_KEY.version) { // 如果版本號匹配當前版本
                checkRiskKey(defaultState.shortcutKeyMap, state.shortcutKeyMap) // 檢查快捷鍵設定的鍵名風險 (確保沒有多餘或缺失的鍵)
                delete (state as any).shortcutKeyMap // 刪除舊狀態中的快捷鍵 (避免之後的合併覆蓋)
                checkRiskKey(defaultState, state) // 檢查並合併主狀態到預設狀態
                return defaultState // 返回合併後的預設狀態
            } else { // 如果版本號不匹配 (舊版本)
                if (version === 13) { // 特殊處理版本 13
                    defaultState.soundType = state.soundType // 遷移 soundType 屬性
                }
                // 為了保持永遠是最新的快捷鍵選項列表，但保留住用戶的自定義設定，去掉無效的快捷鍵選項
                // 例: 2版本，可能有快捷鍵A。3版本沒有了
                checkRiskKey(defaultState.shortcutKeyMap, state.shortcutKeyMap) // 合併/檢查快捷鍵
                delete (state as any).shortcutKeyMap // 刪除舊狀態快捷鍵
                checkRiskKey(defaultState, state) // 合併其他狀態
                return defaultState // 返回合併後的狀態
            }
        } catch (e) { // 發生錯誤
            return defaultState // 返回預設狀態
        }
    }
    return defaultState // 如果 val 不存在，返回預設狀態
}

export function checkAndUpgradeSaveDict(val: any) { // 檢查並升級字典資料
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
            state.load = false // 重置載入標記
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
            return defaultState // 發生錯誤返回預設值
        }
    }
    return defaultState // 無值返回預設值
}

// 篩選未自定義的詞典，未自定義的詞典不需要儲存單字，用得時候再下載
export function shakeCommonDict(n: BaseState): BaseState { // 清理通用字典數據以節省空間
    let data: BaseState = cloneDeep(n) // 深拷貝狀態，避免修改原始數據
    data.word.bookList.map((v: Dict) => { // 遍歷單字字典
        // 如果不是自定義字典，且不是系統保留的字典 (已掌握、錯詞、收藏)
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
    return data // 返回清理後的資料
}

export function useNav() { // 導航 Hook
    const router = useRouter() // 獲取 Router 實例
    const runtimeStore = useRuntimeStore() // 獲取 Runtime Store

    function nav(path: string, query = {}, data?: any) { // 導航函數
        if (data) { // 如果有傳遞額外數據
            runtimeStore.routeData = cloneDeep(data) // 深拷貝存入 store
        }
        router.push({ path, query }) // 執行路由跳轉
    }

    return { nav, push: nav, back: router.back } // 返回導航方法
}

// 補充定義缺失的輔助函數 checkRiskKey
// 用於將 source 物件的屬性複製到 target 物件，確保不會覆蓋 target 全部的屬性結構
function checkRiskKey(target: any, source: any) { // 檢查並合併物件屬性
    if (!source || typeof source !== 'object') return target; // 如果 source無效，返回 target
    for (const key in target) { // 遍歷 target 的鍵
        if (Object.prototype.hasOwnProperty.call(source, key)) { // 如果 source 也有這個鍵
            target[key] = source[key]; // 複製值
        }
    }
    return target; // 返回合併後的 target
}