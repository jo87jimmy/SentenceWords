import http, { axiosInstance, type AxiosResponse } from "@/utils/http.ts"; // 引入 http 封裝和類型
import { type Dict } from "@/types/types.ts"; // 引入 Dict 類型
import { cloneDeep } from "@/utils"; // 引入深拷貝工具函數

function remove(data?: any) { // 移除不必要的數據以減少傳輸量
    if (data) {
        let s = cloneDeep(data) // 深拷貝
        delete s.words // 刪除 words 列表 (體積大)
        delete s.articles // 刪除 articles 列表
        delete s.statistics // 刪除 statistics
        return s; // 返回精簡後的物件
    }
}

export function dictListVersion() { // 獲取字典列表版本號
    return http<number>('dict/dictListVersion', null, null, 'get') // GET請求
}

export function myDictList(params?: any) { // 獲取我的字典列表
    return http('dict/myDictList', null, params, 'get') // GET請求，帶參數
}

export function add2MyDict(data: any) { // 添加到我的字典
    return http('dict/add2MyDict', remove(data), null, 'post') // POST請求，移除大數據欄位
}

export function addStat(data: any) { // 添加統計數據
    return http('dict/addStat', data, null, 'post') // POST請求
}

export function detail(params?: any, data?: any) { // 獲取字典詳情
    return http<Dict>('dict/detail', data, params, 'get') // GET請求
}

export function setDictProp(params?: any, data?: any) { // 設定字典屬性
    return http<Dict>('dict/setDictProp', remove(data), remove(params), 'post') // POST請求
}

export function syncSetting(params?: any, data?: any) { // 同步設定
    return http<Dict>('dict/syncSetting', remove(data), remove(params), 'post') // POST請求
}

export function getSetting(params?: any, data?: any) { // 獲取設定
    return http<Dict>('dict/getSetting', remove(data), remove(params), 'get') // GET請求
}

export function addDict(params?: any, data?: any) { // 添加字典
    return http<Dict>('dict/addDict', remove(data), remove(params), 'post') // POST請求
}

export function uploadImportData<T>(data: any, onUploadProgress: any): Promise<AxiosResponse<T>> { // 上傳導入數據
    return axiosInstance({
        url: 'dict/uploadImportData', // URL
        method: 'post', // POST
        headers: {
            contentType: 'formdata', // Content-Type
        },
        timeout: 1000000000, // 超長超時時間
        data, // 數據
        onUploadProgress // 上傳進度回調
    })
}

export function upload(data: any, onUploadProgress: any) { // 文件上傳
    return axiosInstance({
        url: 'file/upload', // URL
        method: 'post', // POST
        headers: {
            contentType: 'formdata', // Content-Type
        },
        data, // 數據
        onUploadProgress // 進度回調
    })
}

export function getProgress() { // 獲取進度
    return http<{ status: number; reason: string }>('dict/getProgress', null, null, 'get') // GET請求
}
