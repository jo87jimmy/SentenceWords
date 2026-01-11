import { offset } from "@floating-ui/dom"; // 引入 floating-ui 的 offset 中介軟體，用於處理浮動元素的位移

export const GITHUB = 'https://github.com/zyronon/TypeWords' // GitHub 專案位址常數
export const Host = 'typewords.cc' // 應用程式的主機域名
export const EMAIL = 'zyronon@163.com' // 聯絡電子郵件位址
export const Origin = `https://${Host}` // 應用程式的完整來源 URL (協定 + 主機)
export const APP_NAME = 'Type Words' // 應用程式名稱常數

const common = { // 定義通用的設定物件
    word_dict_list_version: 1 // 單字字典列表的版本號
}
const map = { // 定義不同環境的設定對應
    DEV: { // 開發環境設定
        API: 'http://localhost/', // 開發環境的 API 基礎位址
    }
}

export const ENV = Object.assign(map['DEV'], common) // 匯出環境變數，將開發環境設定與通用設定合併

export let AppEnv = { // 匯出應用程式執行時環境狀態
    TOKEN: localStorage.getItem('token') ?? '', // 從 LocalStorage 獲取 Token，若無則為空字串
    IS_OFFICIAL: false, // 標記是否為官方版本
    IS_LOGIN: false, // 標記使用者是否已登入
    CAN_REQUEST: false // 標記是否可以發送請求
}

AppEnv.IS_LOGIN = !!AppEnv.TOKEN // 根據 Token 是否存在來設定登入狀態
AppEnv.CAN_REQUEST = AppEnv.IS_LOGIN && AppEnv.IS_OFFICIAL // 根據登入狀態和官方標記判斷是否可發送請求
// console.log('AppEnv.CAN_REQUEST',AppEnv.CAN_REQUEST) // 除錯日誌：輸出是否可發送請求的狀態

export const RESOURCE_PATH = ENV.API + 'static' // 靜態資源的基礎路徑

export const DICT_LIST = { // 字典列表的 API 路徑設定
    WORD: { // 單字相關字典列表
        ALL: `/list/word.json`, // 所有單字字典的 API 路徑
        RECOMMENDED: `/list/recommend_word.json`, // 推薦單字字典的 API 路徑
    },
    ARTICLE: { // 文章相關列表
        ALL: `/list/article.json`, // 所有文章的 API 路徑
        RECOMMENDED: `/list/article.json`, // 推薦文章的 API 路徑 (目前與 ALL 相同)
    }
}

export const SoundFileOptions = [ // 鍵盤打字音效的選項列表
    { value: '机械键盘', label: '機械鍵盤' }, // 選項：機械鍵盤
    { value: '机械键盘1', label: '機械鍵盤1' }, // 選項：機械鍵盤1
    { value: '机械键盘2', label: '機械鍵盤2' }, // 選項：機械鍵盤2
    { value: '老式机械键盘', label: '老式機械鍵盤' }, // 選項：老式機械鍵盤
    { value: '笔记本键盘', label: '筆記型電腦鍵盤' }, // 選項：筆記型電腦鍵盤
]
export const APP_VERSION = { // 應用程式版本資訊物件
    key: 'type-words-app-version', // 儲存版本的鍵名
    version: 2 // 當前版本號
}
export const SAVE_DICT_KEY = { // 儲存字典資訊的鍵名設定
    key: 'typing-word-dict', // 儲存字典的鍵名
    version: 4 // 儲存結構的版本號
}
export const SAVE_SETTING_KEY = { // 儲存設定資訊的鍵名設定
    key: 'typing-word-setting', // 儲存設定的鍵名
    version: 17 // 儲存結構的版本號
}
export const EXPORT_DATA_KEY = { // 匯出資料的鍵名設定
    key: 'typing-word-export', // 匯出資料的鍵名
    version: 4 // 資料結構版本號
}
export const LOCAL_FILE_KEY = 'typing-word-files' // 本機檔案儲存的鍵名

export const PracticeSaveWordKey = { // 練習中儲存單字的鍵名設定
    key: 'PracticeSaveWord', // 鍵名
    version: 1 // 版本號
}
export const PracticeSaveArticleKey = { // 練習中儲存文章的鍵名設定
    key: 'PracticeSaveArticle', // 鍵名
    version: 1 // 版本號
}

export const TourConfig = { // 導覽教學的設定物件
    useModalOverlay: true, // 是否使用模態遮罩層
    defaultStepOptions: { // 預設步驟選項
        canClickTarget: false, // 是否允許點擊目標元素
        classes: 'shadow-md bg-purple-dark', // 導覽框的樣式類名
        cancelIcon: { enabled: true }, // 是否啟用取消圖示
        modalOverlayOpeningPadding: 10, // 遮罩層開口的內邊距
        modalOverlayOpeningRadius: 6, // 遮罩層開口的圓角半徑
        floatingUIOptions: { // Floating UI 的設定選項
            middleware: [offset({ mainAxis: 30 })] // 設定主軸偏移量為 30
        },
    },
    total: 7 // 總步驟數
}

export const LIB_JS_URL = { // 第三方 JS 庫的 URL 設定
    SHEPHERD: import.meta.env.MODE === 'development' ? // Shepherd.js 導覽庫的路徑
        'https://cdn.jsdelivr.net/npm/shepherd.js@14.5.1/dist/esm/shepherd.mjs' // 開發環境使用 CDN
        : Origin + '/libs/Shepherd.14.5.1.mjs', // 生產環境使用本地資源
    SNAPDOM: `${Origin}/libs/snapdom.min.js`, // Snapdom 庫的 URL
    JSZIP: `${Origin}/libs/jszip.min.js`,
    XLSX: `${Origin}/libs/xlsx.full.min.js`,
}