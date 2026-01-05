import http, { axiosInstance, type AxiosResponse } from "@/utils/http.ts"; // 引入 http 封裝和類型 (AxiosResponse)
import { type Dict } from "@/types/types.ts"; // 引入 Dict 字典類型定義
import { cloneDeep } from "@/utils"; // 引入深拷貝工具函數

function remove(data?: any) { // 移除不必要的數據以減少傳輸量的輔助函數
    if (data) { // 如果數據存在
        let s = cloneDeep(data) // 深拷貝數據，避免修改原物件
        delete s.words // 刪除 words 列表 (體積過大，傳輸時不需要)
        delete s.articles // 刪除 articles 列表 (體積過大)
        delete s.statistics // 刪除 statistics 統計資訊
        return s; // 返回精簡後的物件
    }
}

export function dictListVersion() { // 獲取字典列表版本號的 API
    return http<number>('dict/dictListVersion', null, null, 'get') // 發送 GET 請求獲取版本號
}

export function myDictList(params?: any) { // 獲取我的字典列表的 API
    return http('dict/myDictList', null, params, 'get') // 發送 GET 請求，帶查詢參數
}

export function add2MyDict(data: any) { // 添加到我的字典的 API
    return http('dict/add2MyDict', remove(data), null, 'post') // 發送 POST 請求，移除大數據欄位
}

export function addStat(data: any) { // 添加統計數據的 API
    return http('dict/addStat', data, null, 'post') // 發送 POST 請求提交統計數據
}

export function detail(params?: any, data?: any) { // 獲取字典詳情的 API
    return http<Dict>('dict/detail', data, params, 'get') // 發送 GET 請求獲取字典詳細資訊
}

export function setDictProp(params?: any, data?: any) { // 設定字典屬性的 API
    return http<Dict>('dict/setDictProp', remove(data), remove(params), 'post') // 發送 POST 請求更新屬性
}

export function syncSetting(params?: any, data?: any) { // 同步設定的 API
    return http<Dict>('dict/syncSetting', remove(data), remove(params), 'post') // 發送 POST 請求同步設定
}

export function getSetting(params?: any, data?: any) { // 獲取設定的 API
    return http<Dict>('dict/getSetting', remove(data), remove(params), 'get') // 發送 GET 請求獲取設定
}

export function addDict(params?: any, data?: any) { // 添加字典的 API
    return http<Dict>('dict/addDict', remove(data), remove(params), 'post') // 發送 POST 請求新增字典
}

export function uploadImportData<T>(data: any, onUploadProgress: any): Promise<AxiosResponse<T>> { // 上傳導入數據的 API
    return axiosInstance({ // 直接使用 axios 實例以支援特殊配置
        url: 'dict/uploadImportData', // 請求 URL
        method: 'post', // 請求方法 POST
        headers: {
            contentType: 'formdata', // Content-Type (注意：axios 通常會自動處理 FormData，但這裡明確指定)
        },
        timeout: 1000000000, // 設定超長超時時間 (因為導入數據可能很大)
        data, // 請求體數據
        onUploadProgress // 上傳進度回調函數
    })
}

export function upload(data: any, onUploadProgress: any) { // 文件上傳 API
    return axiosInstance({ // 直接使用 axios 實例
        url: 'file/upload', // 請求 URL
        method: 'post', // 請求方法 POST
        headers: {
            contentType: 'formdata', // Content-Type
        },
        data, // 請求體數據
        onUploadProgress // 進度回調參數
    })
}

export function getProgress() { // 獲取進度的 API
    return http<{ status: number; reason: string }>('dict/getProgress', null, null, 'get') // 發送 GET 請求獲取進度資訊
}
