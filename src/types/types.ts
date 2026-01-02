export type Word = {
    id?: string,
    custom?: boolean,
    word: string,
    phonetic0: string,
    phonetic1: string,
    trans: {
        pos: string,
        cn: string,
    }[],
    sentences: {
        c: string,//content
        cn: string,
    }[],
    phrases: {
        c: string,
        cn: string,
    }[],
    synos: {
        pos: string,
        cn: string,
        ws: string[]
    }[],
    relWords: {
        root: string,
        rels: {
            pos: string,
            words: {
                c: string,
                cn: string,
            }[],
        }[]
    },
    etymology: {
        t: string,//title
        d: string,//desc
    }[],
}

export const PronunciationApi = 'https://dict.youdao.com/dictvoice?audio='

export type TranslateLanguageType = 'en' | 'zh-CN' | 'ja' | 'de' | 'common' | ''
export type LanguageType = 'en' | 'ja' | 'de' | 'code'

export enum DictType {
    collect = 'collect',
    simple = 'simple',
    wrong = 'wrong',
    known = 'known',
    word = 'word',
    article = 'article',
}

export interface ArticleWord extends Word {
    nextSpace: boolean,
    symbolPosition: 'start' | 'end' | '',
    input: string
    type: PracticeArticleWordType
}

export interface Sentence {
    text: string,
    translate: string,
    words: ArticleWord[],
    audioPosition: number[]
}

export interface Article {
    id?: number,
    title: string,
    titleTranslate: string,
    text: string,
    textTranslate: string,
    newWords: Word[],
    sections: Sentence[][],
    audioSrc: string,
    audioFileId: string,
    lrcPosition: number[][],
    nameList: string[],
    questions: {
        stem: string,
        options: string[],
        correctAnswer: string[],
        explanation: string
    }[]
}

export interface Statistics {
    startDate: number,//開始時間
    spend: number,//學習時間
    total: number//總數量
    new: number//新學數量
    review: number//復習數量
    wrong: number//錯誤數量
}

export enum Sort {
    normal = 0,
    random = 1,
    reverse = 2
}

export enum ShortcutKey {
    ShowWord = 'ShowWord',
    EditArticle = 'EditArticle',
    Next = 'Next',
    Previous = 'Previous',
    ToggleSimple = 'ToggleSimple',
    ToggleCollect = 'ToggleCollect',
    NextChapter = 'NextChapter',
    PreviousChapter = 'PreviousChapter',
    RepeatChapter = 'RepeatChapter',
    DictationChapter = 'DictationChapter',
    PlayWordPronunciation = 'PlayWordPronunciation',
    ToggleShowTranslate = 'ToggleShowTranslate',
    ToggleDictation = 'ToggleDictation',
    ToggleTheme = 'ToggleTheme',
    ToggleConciseMode = 'ToggleConciseMode',
    TogglePanel = 'TogglePanel',
    RandomWrite = 'RandomWrite',
    NextRandomWrite = 'NextRandomWrite',
    KnowWord = 'KnowWord',
    UnknownWord = 'UnknownWord',
}

export const DefaultShortcutKeyMap = {
    [ShortcutKey.EditArticle]: 'Ctrl+E',
    [ShortcutKey.ShowWord]: 'Escape',
    [ShortcutKey.Previous]: 'Alt+⬅',
    [ShortcutKey.Next]: 'Tab',
    [ShortcutKey.ToggleSimple]: '`',
    [ShortcutKey.ToggleCollect]: 'Enter',
    [ShortcutKey.PreviousChapter]: 'Ctrl+⬅',
    [ShortcutKey.NextChapter]: 'Ctrl+➡',
    [ShortcutKey.RepeatChapter]: 'Ctrl+Enter',
    [ShortcutKey.DictationChapter]: 'Alt+Enter',
    [ShortcutKey.PlayWordPronunciation]: 'Ctrl+P',
    [ShortcutKey.ToggleShowTranslate]: 'Ctrl+Z',
    [ShortcutKey.ToggleDictation]: 'Ctrl+I',
    [ShortcutKey.ToggleTheme]: 'Ctrl+Q',
    [ShortcutKey.ToggleConciseMode]: 'Ctrl+M',
    [ShortcutKey.TogglePanel]: 'Ctrl+L',
    [ShortcutKey.RandomWrite]: 'Ctrl+R',
    [ShortcutKey.NextRandomWrite]: 'Ctrl+Shift+R',
    [ShortcutKey.KnowWord]: '1',
    [ShortcutKey.UnknownWord]: '2',
}

export enum TranslateEngine {
    Baidu = 0,
}

export type DictResource = {
    id: string
    name: string
    description: string
    url: string
    length: number
    category: string
    tags: string[]
    translateLanguage: TranslateLanguageType
    //   //todo 可以考虑删除了
    type?: DictType
    version?: number
    language: LanguageType
}

export interface Dict extends DictResource {
    lastLearnIndex: number,
    perDayStudyNumber: number,
    words: Word[],
    articles: Article[],
    statistics: Statistics[],
    custom: boolean,//是否是自定義詞典
    complete: boolean,//是否學習完成，學完了設為true，然後lastLearnIndex重置
    //後端字段
    en_name?: string
    createdBy?: string
    category_id?: number
    is_default?: boolean
}

export interface ArticleItem {
    item: Article,
    index: number
}

export const SlideType = {
    HORIZONTAL: 0,
    VERTICAL: 1,
}

export interface PracticeData {
    index: number,
    words: Word[],
    wrongWords: Word[],
    excludeWords: string[],
}

export interface TaskWords {
    new: Word[],
    review: Word[],
    write: Word[],
    shuffle: Word[],
}

export class DictId {
    static wordCollect = 'wordCollect'
    static wordWrong = 'wordWrong'
    static wordKnown = 'wordKnown'
    static articleCollect = 'articleCollect'
}

export enum PracticeArticleWordType {
    Symbol,
    Number,
    Word
}

//練習模式
export enum WordPracticeMode {
    System = 0,
    Free = 1
}

//練習類型
export enum WordPracticeType {
    FollowWrite,//跟寫
    Spell,
    Identify,
    Listen,
    Dictation
}

export enum CodeType {
    Login = 0,
    Register = 1,
    ResetPwd = 2,
    ChangeEmail = 3,
    ChangePhoneNew = 4,
    ChangePhoneOld = 5
}

export enum ImportStatus {
    Idle = 0,
    Success = 1,
    Fail = 2
}