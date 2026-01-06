import { defineStore } from "pinia" // 引入 Pinia 的 defineStore 函數
import { checkAndUpgradeSaveSetting, cloneDeep } from "@/utils"; // 引入設定升級檢查和深拷貝函數
import { DefaultShortcutKeyMap, WordPracticeMode, WordPracticeType } from "@/types/types.ts"; // 引入預設快捷鍵映射、練習模式枚舉、練習類型枚舉
import { get } from "idb-keyval"; // 引入 IndexedDB 讀取函數
import { AppEnv, SAVE_SETTING_KEY } from "@/config/env.ts"; // 引入環境變數和設定儲存鍵名
import { getSetting } from "@/apis"; // 引入獲取設定的 API 函數

export interface SettingState { // 定義設定狀態介面
  soundType: string, // 發音類型（英音/美音）

  wordSound: boolean, // 是否開啟單字發音
  wordSoundVolume: number, // 單字發音音量
  wordSoundSpeed: number, // 單字發音速度

  articleSound: boolean, // 是否開啟文章朗讀
  articleAutoPlayNext: boolean, // 是否自動播放下一句
  articleSoundVolume: number, // 文章朗讀音量
  articleSoundSpeed: number, // 文章朗讀速度

  keyboardSound: boolean, // 是否開啟鍵盤音效
  keyboardSoundVolume: number, // 鍵盤音效音量
  keyboardSoundFile: string, // 鍵盤音效檔案（類型）

  effectSound: boolean, // 是否開啟操作音效
  effectSoundVolume: number, // 操作音效音量

  repeatCount: number, // 單字重複朗讀次數
  repeatCustomCount?: number, // 自定義重複次數（可選）
  dictation: boolean, // 是否顯示默寫模式
  translate: boolean, // 是否顯示翻譯
  showNearWord: boolean, // 是否顯示上一個/下一個單字
  ignoreCase: boolean, // 拼寫時是否忽略大小寫
  allowWordTip: boolean, // 默寫時是否允許查看提示
  waitTimeForChangeWord: number, // 切換下一個單字的等待時間（毫秒）
  fontSize: { // 字體大小設定物件
    articleForeignFontSize: number, // 文章外文（英文）字體大小
    articleTranslateFontSize: number, // 文章翻譯字體大小
    wordForeignFontSize: number, // 單字外文（英文）字體大小
    wordTranslateFontSize: number, // 單字翻譯字體大小
  },
  showToolbar: boolean, // 是否顯示工具欄
  showPanel: boolean, // 是否顯示面板
  sideExpand: boolean, // 是否展開左側側邊欄
  theme: string, // 主題設定（如 'auto', 'light', 'dark'）
  shortcutKeyMap: Record<string, string>, // 快捷鍵映射表
  first: boolean, // 是否為初次使用或首次加載
  firstTime: number, // 首次使用時間戳
  load: boolean, // 是否已加載完成
  conflictNotice: boolean, // 是否顯示其他腳本/插件衝突提示
  ignoreSimpleWord: boolean, // 是否忽略簡單詞
  wordPracticeMode: WordPracticeMode, // 單字練習模式（系統/自由）
  wordPracticeType: WordPracticeType, // 單字練習類型（跟寫/拼寫/辨識等）
  disableShowPracticeSettingDialog: boolean, // 是否不預設顯示練習設定彈框
  autoNextWord: boolean, // 是否自動切換下一個單字
  inputWrongClear: boolean, // 單字輸入錯誤時是否自動清空已輸入內容
  mobileNavCollapsed: boolean, // 移動端底部導航欄是否收縮
  ignoreSymbol: boolean, // 練習時是否忽略符號
}

export const getDefaultSettingState = (): SettingState => ({ // 獲取預設設定狀態
  soundType: 'us', // 預設美音

  wordSound: true, // 開啟單字發音
  wordSoundVolume: 100, // 音量 100
  wordSoundSpeed: 1, // 速度 1 倍

  articleSound: true, // 開啟文章發音
  articleAutoPlayNext: false, // 不自動播放下一句
  articleSoundVolume: 100, // 文章音量 100
  articleSoundSpeed: 1, // 文章速度 1 倍

  keyboardSound: true, // 開啟鍵盤音效
  keyboardSoundVolume: 100, // 鍵盤音量 100
  keyboardSoundFile: '笔记本键盘', // 預設鍵盤音效：筆記型電腦鍵盤

  effectSound: true, // 開啟操作音效
  effectSoundVolume: 100, // 音效音量 100

  repeatCount: 1, // 重複 1 次
  repeatCustomCount: undefined, // 自定義次數未定義
  dictation: false, // 默認不開啟默寫
  translate: true, // 默認顯示翻譯
  showNearWord: true, // 顯示鄰近詞
  ignoreCase: true, // 忽略大小寫
  allowWordTip: true, // 允許提示
  waitTimeForChangeWord: 300, // 切換延遲 300ms
  fontSize: { // 字體大小預設值
    articleForeignFontSize: 48, // 文章外文大小
    articleTranslateFontSize: 20, // 文章翻譯大小
    wordForeignFontSize: 48, // 單字外文大小
    wordTranslateFontSize: 20, // 單字翻譯大小
  },
  showToolbar: true, // 顯示工具欄
  showPanel: false, // 顯示面板
  sideExpand: false, // 側邊欄收起
  theme: 'auto', // 自動主題
  shortcutKeyMap: cloneDeep(DefaultShortcutKeyMap), // 複製預設快捷鍵
  first: true, // 是首次
  firstTime: Date.now(), // 記錄時間
  load: false, // 未加載
  conflictNotice: true, // 開啟衝突提示
  ignoreSimpleWord: false, // 不忽略簡單詞
  wordPracticeMode: WordPracticeMode.System, // 系統練習模式
  wordPracticeType: WordPracticeType.FollowWrite, // 跟寫練習類型
  disableShowPracticeSettingDialog: false, // 顯示練習設定彈框
  autoNextWord: true, // 自動下一個
  inputWrongClear: false, // 輸入錯誤不清空
  mobileNavCollapsed: false, // 移動端導航不收縮
  ignoreSymbol: true, // 忽略符號
})

export const useSettingStore = defineStore('setting', { // 定義 setting store
  state: (): SettingState => { // 狀態定義
    return getDefaultSettingState() // 返回預設狀態
  },
  actions: { // 定義操作
    setState(obj: any) { // 更新狀態
      this.$patch(obj) // 批量更新
    },
    init() { // 初始化
      return new Promise(async resolve => { // 返回 Promise
        let configStr = await get(SAVE_SETTING_KEY.key) // 從 IndexedDB 獲取設定
        let data = checkAndUpgradeSaveSetting(configStr) // 檢查並升級設定結構
        if (AppEnv.CAN_REQUEST) { // 如果已登入
          let res = await getSetting() // 從雲端獲取設定
          if (res.success) { // 成功獲取
            Object.assign(data, res.data) // 合併雲端設定
          }
        }
        this.setState({ ...data, load: true }) // 更新狀態並標記加載完成
        resolve(true) // 完成 Promise
      })
    }
  }
})
