import { defineStore } from 'pinia' // 從 pinia 引入 defineStore，用於定義 Store
import { type Dict, DictId, type Word } from "@/types/types" // 引入字典介面、字典ID枚舉、單字類型
import { _getStudyProgress, checkAndUpgradeSaveDict, shakeCommonDict } from "@/utils/index"; // 引入工具函數：計算進度、檢查升級字典、過濾通用字典數據
import { shallowReactive } from "vue"; // 引入 vue 的 shallowReactive，用於淺層響應式優化性能
import { getDefaultDict } from "@/types/func"; // 引入獲取預設字典的函數
import { get, set } from 'idb-keyval' // 引入 IndexedDB 的讀寫庫
import { AppEnv, SAVE_DICT_KEY } from "@/config/env.ts"; // 引入環境變數和字典儲存鍵名配置
import { add2MyDict, dictListVersion, myDictList } from "@/apis"; // 引入 API：添加到我的字典、獲取字典版本、獲取我的字典列表
import Toast from "@/components/base/toast/Toast"; // 引入 Toast 提示組件

export interface BaseState { // 定義 BaseStore 的狀態介面
    simpleWords: string[], // 簡單詞列表，通常用於忽略
    load: boolean // 標記是否已加載完成
    word: { // 單字相關狀態
        studyIndex: number, // 當前學習的字典索引
        bookList: Dict[], // 單字字典列表
    },
    article: { // 文章相關狀態
        bookList: Dict[], // 文章字典列表
        studyIndex: number, // 當前學習的文章索引
    },
    dictListVersion: number // 字典列表版本號
}

export const getDefaultBaseState = (): BaseState => ({ // 獲取預設的 BaseState 狀態函數
    simpleWords: [ // 預設的簡單詞列表
        'a', 'an', // 冠詞
        'i', 'my', 'me', 'you', 'your', 'he', 'his', 'she', 'her', 'it', // 代名詞
        'what', 'who', 'where', 'how', 'when', 'which', // 疑問詞
        'be', 'am', 'is', 'was', 'are', 'were', 'do', 'did', 'can', 'could', 'will', 'would', // 助動詞/be動詞
        'the', 'that', 'this', 'and', 'not', 'no', 'yes', // 常見連接詞、限定詞、副詞
        'to', 'of', 'for', 'at', 'in' // 常見介係詞
    ],
    load: false, // 預設未加載
    word: { // 單字狀態初始化
        bookList: [ // 初始化字典列表
            getDefaultDict({ id: DictId.wordCollect, name: '收藏' }), // 收藏本
            getDefaultDict({ id: DictId.wordWrong, name: '錯詞' }), // 錯詞本
            getDefaultDict({ id: DictId.wordKnown, name: '已掌握', description: '已掌握後的單字不會出現在練習中' }), // 已掌握本
        ],
        studyIndex: -1, // 預設無選中字典
    },
    article: { // 文章狀態初始化
        bookList: [ // 初始化文章列表
            getDefaultDict({ id: DictId.articleCollect, name: '收藏' }) // 收藏本
        ],
        studyIndex: -1, // 預設無選中文章
    },
    dictListVersion: 1 // 預設版本號
})

export const useBaseStore = defineStore('base', { // 定義名為 'base' 的 Store
    state: (): BaseState => { // 定義狀態
        return getDefaultBaseState() // 返回預設狀態
    },
    getters: { // 定義 Getters 計算屬性
        collectWord(): Dict { // 獲取單字收藏本
            // 存取加上了預設值 ?? getDefaultDict()，確保即使取不到值也會回傳一個合法的 Dict 物件，滿足類型定義
            return this.word.bookList[0] ?? getDefaultDict() // 返回收藏本或預設字典
        },
        collectArticle(): Dict { // 獲取文章收藏本
            return this.article.bookList[0] ?? getDefaultDict() // 若不存在則返回預設字典
        },
        wrong(): Dict { // 獲取錯詞本
            return this.word.bookList[1] ?? getDefaultDict() // 錯詞本固定在索引 1
        },
        known(): Dict { // 獲取已掌握本
            return this.word.bookList[2] ?? getDefaultDict() // 已掌握本固定在索引 2
        },
        knownWords(): string[] { // 獲取已掌握的單字列表（純字串陣列）
            return this.known.words.map((v: Word) => v.word.toLowerCase()) // 將單字轉為小寫
        },
        // TypeScript 編譯器在推斷 this 的類型時會發生循環依賴（Circular Dependency）。所以加上了明確的返回類型 : string[]
        allIgnoreWords(): string[] { // 獲取所有需要忽略的單字（已掌握 + 簡單詞）
            return this.known.words.map((v: Word) => v.word.toLowerCase()).concat(this.simpleWords.map((v: string) => v.toLowerCase())) // 合併兩個列表
        },
        currentStudyWordDict(): Dict { // 獲取當前正在學習的單字字典
            if (this.word.studyIndex >= 0) { // 如果有選中索引
                return this.word.bookList[this.word.studyIndex] ?? getDefaultDict() // 返回對應字典，否則返回預設
            }
            return getDefaultDict() // 默認返回空字典
        },
        sdict(): Dict { // currentStudyWordDict 的簡寫別名
            if (this.word.studyIndex >= 0) { // 如果有選中索引
                return this.word.bookList[this.word.studyIndex] ?? getDefaultDict() // 返回對應字典
            }
            return getDefaultDict() // 返回空字典
        },
        currentStudyProgress(): number { // 計算當前單字字典的學習進度
            if (!this.sdict.length) return 0 // 如果長度為 0，進度為 0
            if (this.sdict.complete) return 100 // 如果標記已完成，進度 100
            return _getStudyProgress(this.sdict.lastLearnIndex, this.sdict.length) // 計算進度百分比
        },
        getDictCompleteDate(): number { // 計算預計完成天數
            if (!this.sdict.length) return 0 // 無單字則為 0
            if (!this.sdict.perDayStudyNumber) return 0 // 無每日目標則為 0
            return Math.ceil((this.sdict.length - this.sdict.lastLearnIndex) / this.sdict.perDayStudyNumber) // 剩餘單字除以每日目標，向上取整
        },
        currentBook(): Dict { // 獲取當前正在學習的文章字典
            return this.article.bookList[this.article.studyIndex] ?? getDefaultDict() // 返回對應文章字典
        },
        sbook(): Dict { // currentBook 的簡寫別名
            return this.article.bookList[this.article.studyIndex] ?? getDefaultDict() // 返回對應文章字典
        },
        currentBookProgress(): number { // 計算當前文章字典的學習進度
            if (!this.sbook.length) return 0 // 無長度則 0
            if (this.sbook.complete) return 100 // 已完成則 100
            return _getStudyProgress(this.sbook.lastLearnIndex, this.sbook.length) // 計算進度
        },
    },
    actions: { // 定義 Actions 方法
        setState(obj: BaseState) { // 設定整個狀態
            obj.word.bookList.map(book => { // 遍歷單字字典列表
                book.words = shallowReactive(book.words) // 將單字列表轉為淺層響應式
                book.articles = shallowReactive(book.articles) // 將文章列表轉為淺層響應式
                book.statistics = shallowReactive(book.statistics) // 將統計數據轉為淺層響應式
            })
            obj.article.bookList.map(book => { // 遍歷文章字典列表
                book.words = shallowReactive(book.words) // 淺層響應式處理
                book.articles = shallowReactive(book.articles) // 淺層響應式處理
                book.statistics = shallowReactive(book.statistics) // 淺層響應式處理
            })
            this.$patch(obj) // 批量更新狀態
        },
        async init() { // 初始化 Action
            return new Promise(async resolve => { // 返回 Promise
                try { // 嘗試執行
                    // idb-keyval 的 get 方法可能會回傳 undefined 所以要加上 undefined 的處理
                    let configStr: string | undefined = await get(SAVE_DICT_KEY.key) // 從 IndexedDB 讀取字典數據
                    let data = checkAndUpgradeSaveDict(configStr) // 檢查並升級數據結構
                    if (AppEnv.IS_OFFICIAL) { // 如果是官方環境
                        let r = await dictListVersion() // 獲取服務端字典版本
                        if (r.success) { // 如果成功
                            data.dictListVersion = r.data // 更新版本號
                        }
                    }
                    if (AppEnv.CAN_REQUEST) { // 如果可以發送請求（已登入）
                        let res = await myDictList() // 獲取雲端字典列表
                        if (res.success) { // 如果成功
                            Object.assign(data, res.data) // 合併數據
                        }
                    }
                    this.setState({ ...data, load: true }) // 更新 State
                    // 為了效能，過濾掉通用字典數據後再存回 IndexedDB
                    set(SAVE_DICT_KEY.key, JSON.stringify({ val: shakeCommonDict(this.$state), version: SAVE_DICT_KEY.version })) // 儲存數據
                } catch (e) { // 捕獲錯誤
                    console.error('讀取本地 dict 數據失敗', e) // 錯誤處理
                }
                resolve(true) // 完成初始化
            })
        },
        // 改變詞典
        async changeDict(val: Dict) { // 切換當前學習的單字字典
            if (AppEnv.CAN_REQUEST) { // 如果可聯網
                let r = await add2MyDict(val) // 將字典添加到雲端
                if (!r.success) { // 如果失敗
                    return Toast.error(r.msg) // 提示錯誤
                }
            }
            // 把其他的詞典的單字數據都刪掉，全保存在記憶體裡太卡了
            this.word.bookList.slice(3).map(v => { // 遍歷自定義字典（排除前三個系統字典）
                if (!v.custom) { // 如果不是純自定義的
                    v.words = shallowReactive([]) // 清空記憶體中的單字數據以節省效能
                }
            })
            let rIndex = this.word.bookList.findIndex((v: Dict) => v.id === val.id) // 查找目標字典在列表中的索引
            if (val.words.length < val.perDayStudyNumber) { // 如果總單字數小於每日目標
                val.perDayStudyNumber = val.words.length // 調整每日目標為總數
            }
            if (rIndex > -1) { // 如果列表中已存在
                this.word.studyIndex = rIndex // 切換索引
                // TypeScript 的靜態分析無法確定 this.word.bookList[this.word.studyIndex] 是否一定存在。
                const book = this.word.bookList[rIndex] // 獲取字典物件
                // 先將該陣列元素賦值給一個變數 (例如 book)，並在存取其屬性前檢查該變數是否存在
                if (book) { // 如果字典存在
                    book.words = shallowReactive(val.words) // 更新單字數據
                    book.perDayStudyNumber = val.perDayStudyNumber // 更新每日目標
                    book.lastLearnIndex = val.lastLearnIndex // 更新學習進度
                }
            } else { // 如果列表中不存在
                this.word.bookList.push(getDefaultDict(val)) // 添加新字典到列表
                this.word.studyIndex = this.word.bookList.length - 1 // 切換索引到最新
            }
        },
        // 改變書籍
        async changeBook(val: Dict) { // 切換當前學習的文章字典
            if (AppEnv.CAN_REQUEST) { // 如果可聯網
                let r = await add2MyDict(val) // 同步到雲端
                if (!r.success) { // 如果失敗
                    return Toast.error(r.msg) // 失敗提示
                }
            }
            // 把其他的書籍裡面的文章數據都刪掉，全保存在記憶體裡太卡了
            this.article.bookList.slice(1).map(v => { // 遍歷文章列表（排除第一個收藏本）
                if (!v.custom) { // 如果不是自定義的
                    v.articles = shallowReactive([]) // 清空文章數據
                }
            })
            let rIndex = this.article.bookList.findIndex((v: Dict) => v.id === val.id) // 查找索引
            if (rIndex > -1) { // 如果存在
                this.article.studyIndex = rIndex // 切換索引
                const book = this.article.bookList[rIndex] // 獲取書籍物件
                if (book) { // 如果存在
                    book.articles = shallowReactive(val.articles) // 更新文章數據
                }
            } else { // 如果不存在
                this.article.bookList.push(getDefaultDict(val)) // 添加新書籍
                this.article.studyIndex = this.article.bookList.length - 1 // 切換索引
            }
        },
    },
})
