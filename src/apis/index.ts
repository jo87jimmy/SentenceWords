import http, { axiosInstance, type AxiosResponse } from "@/utils/http.ts";
import { type Dict } from "@/types/types.ts";
import { cloneDeep } from "@/utils";

function remove(data?: any) {
    if (data) {
        let s = cloneDeep(data)
        delete s.words
        delete s.articles
        delete s.statistics
        return s;
    }
}

export function dictListVersion() {
    return http<number>('dict/dictListVersion', null, null, 'get')
}

export function myDictList(params?: any) {
    return http('dict/myDictList', null, params, 'get')
}

export function add2MyDict(data: any) {
    return http('dict/add2MyDict', remove(data), null, 'post')
}

export function addStat(data: any) {
    return http('dict/addStat', data, null, 'post')
}

export function detail(params?: any, data?: any) {
    return http<Dict>('dict/detail', data, params, 'get')
}

export function setDictProp(params?: any, data?: any) {
    return http<Dict>('dict/setDictProp', remove(data), remove(params), 'post')
}

export function syncSetting(params?: any, data?: any) {
    return http<Dict>('dict/syncSetting', remove(data), remove(params), 'post')
}

export function getSetting(params?: any, data?: any) {
    return http<Dict>('dict/getSetting', remove(data), remove(params), 'get')
}

export function addDict(params?: any, data?: any) {
    return http<Dict>('dict/addDict', remove(data), remove(params), 'post')
}

export function uploadImportData<T>(data: any, onUploadProgress: any): Promise<AxiosResponse<T>> {
    return axiosInstance({
        url: 'dict/uploadImportData',
        method: 'post',
        headers: {
            contentType: 'formdata',
        },
        timeout: 1000000000,
        data,
        onUploadProgress
    })
}

export function upload(data: any, onUploadProgress: any) {
    return axiosInstance({
        url: 'file/upload',
        method: 'post',
        headers: {
            contentType: 'formdata',
        },
        data,
        onUploadProgress
    })
}

export function getProgress() {
    return http<{ status: number; reason: string }>('dict/getProgress', null, null, 'get')
}
