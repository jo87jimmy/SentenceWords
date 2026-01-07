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
dayjs.extend(duration); // 扩展 dayjs 的功能

// todo 偶爾發現一個報錯，這裡 nextTick 一直不執行
export function _nextTick(cb: () => void, time?: number) { // 封裝 nextTick 函數
    if (time) { // 如果有指定延遲時間
        nextTick(() => setTimeout(cb, time)) // 在 nextTick 後延遲執行回調
    } else { // 否則
        nextTick(cb) // 直接執行 nextTick
    }
}

export function jump2Feedback() {
    window.open('todo作者', '_blank');
}
export function last<T>(array: T[]): T | undefined {
    return array.length > 0 ? array[array.length - 1] : undefined;
}

export function msToHourMinute(ms: number) {
    const d = dayjs.duration(ms);
    const hours = d.hours();
    const minutes = d.minutes();
    if (hours) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
}

//随机取N个
export function getRandomN(arr: any[], n: number) {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]] // 交换
    }
    return copy.slice(0, n)
}
//数组分成N份
export function splitIntoN(arr: any[], n: number) {
    const result = []
    const len = arr.length
    const base = Math.floor(len / n)  // 每份至少这么多
    let extra = len % n               // 前几份多 1 个

    let index = 0
    for (let i = 0; i < n; i++) {
        const size = base + (extra > 0 ? 1 : 0)
        result.push(arr.slice(index, index + size))
        index += size
        if (extra > 0) extra--
    }
    return result
}

export function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}
export function reverse<T>(array: T[]): T[] {
    return array.slice().reverse();
}
export function shuffle<T>(array: T[]): T[] {
    const result = array.slice(); // 复制数组，避免修改原数组
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // 生成 0 ~ i 的随机索引
        [result[i] as T, result[j] as T] = [result[j] as T, result[i] as T]; // 交换元素
    }
    return result;
}
//从字符串里面转换为Word格式
export function convertToWord(raw: any) {
    const safeString = (str: string) => (typeof str === 'string' ? str.trim() : '');
    const safeSplit = (str: string, sep: string) =>
        safeString(str) ? safeString(str).split(sep).filter(Boolean) : [];

    // 1. trans
    const trans = safeSplit(raw.trans, '\n').map(line => {
        const match = safeString(line).match(/^([^\s.]+\.?)\s*(.*)$/);
        if (match) {
            let pos = safeString(match[1] as string);
            let cn = safeString(match[2] as string);

            // 如果 pos 不是常规词性（不以字母开头），例如 "【名】"
            if (!/^[a-zA-Z]+\.?$/.test(pos)) {
                cn = safeString(line); // 整行放到 cn
                pos = ''; // pos 置空
            }

            return { pos, cn };
        }
        return { pos: '', cn: safeString(line) };
    });

    // 2. sentences
    const sentences = safeSplit(raw.sentences, '\n\n').map(block => {
        const [c, cn] = block.split('\n');
        return { c: safeString(c as string), cn: safeString(cn as string) };
    });

    // 3. phrases
    const phrases = safeSplit(raw.phrases, '\n\n').map(block => {
        const [c, cn] = block.split('\n');
        return { c: safeString(c as string), cn: safeString(cn as string) };
    });

    // 4. synos
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

    // 5. relWords
    const relWordsText = safeString(raw.relWords);
    let root = '';
    const rels = [];

    if (relWordsText) {
        const relLines = relWordsText.split('\n').filter(Boolean);
        if (relLines.length > 0) {
            root = safeString(relLines[0]!.replace(/^词根:/, ''));
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

    // 6. etymology
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

export async function _getDictDataByUrl(val: DictResource, type: DictType = DictType.word): Promise<Dict> {
    // await sleep(2000);
    let dictResourceUrl = `/dicts/${val.language}/word/${val.url}`
    if (type === DictType.article) {
        dictResourceUrl = `/dicts/${val.language}/article/${val.url}`;
    }

    const fetchDict = async (u: string) => {
        const res = await fetch(u)
        if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return res.json();
            }
        }
        throw new Error("Invalid response or file not found");
    }

    let s;
    try {
        s = await fetchDict(resourceWrap(dictResourceUrl, val.version));
    } catch (e) {
        // Fallback to remote if local fails (e.g. 404 or HTML result)
        // Try accessing via proxy to avoid CORS
        const remoteUrl = `/proxy-dicts${dictResourceUrl.replace('/dicts', '')}`;
        try {
            console.warn(`Local dictionary not found, trying remote via proxy: ${remoteUrl}`);
            s = await fetchDict(remoteUrl);
        } catch (e2) {
            console.error("Failed to fetch dictionary both locally and remotely", e2);
        }
    }

    if (s) {
        if (type === DictType.word) {
            return getDefaultDict({ ...val, words: s })
        } else {
            return getDefaultDict({ ...val, articles: s })
        }
    }
    return getDefaultDict()
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