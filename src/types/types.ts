export type Word = { // 定義單字類型
    id?: string, // 單字 ID (可選)
    custom?: boolean, // 是否自定義 (可選)
    word: string, // 單字拼寫
    phonetic0: string, // 音標 0
    phonetic1: string, // 音標 1
    trans: { // 翻譯列表
        pos: string, // 詞性
        cn: string, // 中文翻譯
    }[],
    sentences: { // 例句列表
        c: string,// content 例句原文
        cn: string, // 例句中文翻譯
    }[],
    phrases: { // 片語列表
        c: string, // 片語原文
        cn: string, // 片語中文翻譯
    }[],
    synos: { // 同義詞列表
        pos: string, // 詞性
        cn: string, // 中文翻譯
        ws: string[] // 同義詞字串陣列
    }[],
    relWords: { // 相關詞列表
        root: string, // 詞根
        rels: { // 關係列表
            pos: string, // 詞性
            words: { // 單字列表
                c: string, // 單字
                cn: string, // 翻譯
            }[],
        }[]
    },
    etymology: { // 詞源
        t: string,// title 標題
        d: string,// desc 描述
    }[],
}
export interface Statistics {
    startDate: number,//开始日期
    spend: number,//花费时间
    total: number//单词数量
    new: number//新学单词数量
    review: number//复习单词数量
    wrong: number//错误数
}
export interface TaskWords {
    new: Word[],
    review: Word[],
    write: Word[],
    shuffle: Word[],
}

export const PronunciationApi = 'https://dict.youdao.com/dictvoice?audio=' // 發音 API URL

export type TranslateLanguageType = 'en' | 'zh-CN' | 'ja' | 'de' | 'common' | '' // 翻譯語言類型定義
export type LanguageType = 'en' | 'ja' | 'de' | 'code' // 語言類型定義

export enum DictType { // 字典類型枚舉
    collect = 'collect', // 收藏
    simple = 'simple', // 簡單
    wrong = 'wrong', // 錯詞
    known = 'known', // 已掌握
    word = 'word', // 單字書
    article = 'article', // 文章書
}

export interface ArticleWord extends Word { // 文章中的單字介面，繼承自 Word
    nextSpace: boolean, // 下一個是否為空格
    symbolPosition: 'start' | 'end' | '', // 符號位置
    input: string // 用戶輸入
    type: PracticeArticleWordType // 練習類型
}

export interface Sentence { // 句子介面
    text: string, // 句子文本
    translate: string, // 句子翻譯
    words: ArticleWord[], // 句子中的單字列表
    audioPosition: number[] // 音訊位置
}

export interface Article { // 文章介面
    id?: number, // 文章 ID
    title: string, // 標題
    titleTranslate: string, // 標題翻譯
    text: string, // 正文
    textTranslate: string, // 正文翻譯
    newWords: Word[], // 生詞列表
    sections: Sentence[][], // 章節（句子二維陣列）
    audioSrc: string, // 音訊來源 URL
    audioFileId: string, // 音訊檔案 ID
    lrcPosition: number[][], // 歌詞位置
    nameList: string[], // 名稱列表
    questions: { // 問題列表
        stem: string, // 題幹
        options: string[], // 選項
        correctAnswer: string[], // 正確答案
        explanation: string // 解釋
    }[]
}

export interface Statistics { // 統計數據介面
    startDate: number,// 開始時間
    spend: number,// 學習時間
    total: number// 總數量
    new: number// 新學數量
    review: number// 複習數量
    wrong: number// 錯誤數量
}

export enum Sort { // 排序枚舉
    normal = 0, // 正常
    random = 1, // 隨機
    reverse = 2 // 反向
}

export enum ShortcutKey { // 快捷鍵枚舉
    ShowWord = 'ShowWord', // 顯示單字
    EditArticle = 'EditArticle', // 編輯文章
    Next = 'Next', // 下一個
    Previous = 'Previous', // 上一個
    ToggleSimple = 'ToggleSimple', // 切換簡單模式
    ToggleCollect = 'ToggleCollect', // 切換收藏
    NextChapter = 'NextChapter', // 下一章
    PreviousChapter = 'PreviousChapter', // 上一章
    RepeatChapter = 'RepeatChapter', // 重複章節
    DictationChapter = 'DictationChapter', // 默寫章節
    PlayWordPronunciation = 'PlayWordPronunciation', // 播放單字發音
    ToggleShowTranslate = 'ToggleShowTranslate', // 顯示/隱藏翻譯
    ToggleDictation = 'ToggleDictation', // 切換默寫模式
    ToggleTheme = 'ToggleTheme', // 切換主題
    ToggleConciseMode = 'ToggleConciseMode', // 切換簡潔模式
    TogglePanel = 'TogglePanel', // 切換面板
    RandomWrite = 'RandomWrite', // 隨機寫
    NextRandomWrite = 'NextRandomWrite', // 下一個隨機寫
    KnowWord = 'KnowWord', // 標記為認識
    UnknownWord = 'UnknownWord', // 標記為不認識
}

export const DefaultShortcutKeyMap = { // 預設快捷鍵映射表
    [ShortcutKey.EditArticle]: 'Ctrl+E', // 編輯文章
    [ShortcutKey.ShowWord]: 'Escape', // 顯示單字
    [ShortcutKey.Previous]: 'Alt+⬅', // 上一個
    [ShortcutKey.Next]: 'Tab', // 下一個
    [ShortcutKey.ToggleSimple]: '`', // 切換簡單模式
    [ShortcutKey.ToggleCollect]: 'Enter', // 切換收藏
    [ShortcutKey.PreviousChapter]: 'Ctrl+⬅', // 上一章
    [ShortcutKey.NextChapter]: 'Ctrl+➡', // 下一章
    [ShortcutKey.RepeatChapter]: 'Ctrl+Enter', // 重複章節
    [ShortcutKey.DictationChapter]: 'Alt+Enter', // 默寫章節
    [ShortcutKey.PlayWordPronunciation]: 'Ctrl+P', // 播放單字發音
    [ShortcutKey.ToggleShowTranslate]: 'Ctrl+Z', // 顯示/隱藏翻譯
    [ShortcutKey.ToggleDictation]: 'Ctrl+I', // 切換默寫模式
    [ShortcutKey.ToggleTheme]: 'Ctrl+Q', // 切換主題
    [ShortcutKey.ToggleConciseMode]: 'Ctrl+M', // 切換簡潔模式
    [ShortcutKey.TogglePanel]: 'Ctrl+L', // 切換面板
    [ShortcutKey.RandomWrite]: 'Ctrl+R', // 隨機寫
    [ShortcutKey.NextRandomWrite]: 'Ctrl+Shift+R', // 下一個隨機寫
    [ShortcutKey.KnowWord]: '1', // 標記為認識
    [ShortcutKey.UnknownWord]: '2', // 標記為不認識
}

export enum TranslateEngine { // 翻譯引擎枚舉
    Baidu = 0, // 百度翻譯
}

export type DictResource = { // 字典資源介面
    id: string // ID
    name: string // 名稱
    description: string // 描述
    url: string // URL
    length: number // 長度
    category: string // 分類
    tags: string[] // 標籤
    translateLanguage: TranslateLanguageType // 翻譯語言
    //   // todo 可以考慮刪除了
    type?: DictType // 類型
    version?: number // 版本
    language: LanguageType // 語言
}

export interface Dict extends DictResource { // 字典介面，繼承自 DictResource
    lastLearnIndex: number, // 上次學習索引
    perDayStudyNumber: number, // 每日學習數量
    words: Word[], // 單字列表
    articles: Article[], // 文章列表
    statistics: Statistics[], // 統計數據
    custom: boolean,// 是否是自定義詞典
    complete: boolean,// 是否學習完成，學完了設為 true，然後 lastLearnIndex 重置
    // 後端字段
    en_name?: string // 英文名稱
    createdBy?: string // 創建者
    category_id?: number // 分類 ID
    is_default?: boolean // 是否預設
}

export interface ArticleItem { // 文章項目介面
    item: Article, // 文章物件
    index: number // 索引
}

export const SlideType = { // 滑動類型常數
    HORIZONTAL: 0, // 水平
    VERTICAL: 1, // 垂直
}

export interface PracticeData { // 練習數據介面
    index: number, // 索引
    words: Word[], // 單字列表
    wrongWords: Word[], // 錯詞列表
    excludeWords: string[], // 排除單字列表
}

export interface TaskWords { // 任務單字介面
    new: Word[], // 新詞
    review: Word[], // 複習詞
    write: Word[], // 書寫詞
    shuffle: Word[], // 亂序詞
}

export class DictId { // 字典 ID 常數類
    static wordCollect = 'wordCollect' // 單字收藏
    static wordWrong = 'wordWrong' // 單字錯詞
    static wordKnown = 'wordKnown' // 單字已掌握
    static articleCollect = 'articleCollect' // 文章收藏
}

export enum PracticeArticleWordType { // 練習文章單字類型枚舉
    Symbol, // 符號
    Number, // 數字
    Word // 單字
}

// 練習模式
export enum WordPracticeMode {
    System = 0, // 系統
    Free = 1 // 自由
}

// 練習類型
export enum WordPracticeType {
    FollowWrite, // 跟寫
    Spell, // 拼寫
    Identify, // 辨識
    Listen, // 聽寫
    Dictation // 默寫
}

export enum CodeType { // 驗證碼類型枚舉
    Login = 0, // 登入
    Register = 1, // 註冊
    ResetPwd = 2, // 重置密碼
    ChangeEmail = 3, // 修改郵箱
    ChangePhoneNew = 4, // 修改手機（新）
    ChangePhoneOld = 5 // 修改手機（舊）
}

export enum ImportStatus { // 導入狀態枚舉
    Idle = 0, // 空閒
    Success = 1, // 成功
    Fail = 2 // 失敗
}
