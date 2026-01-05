import axios, { type AxiosInstance } from 'axios' // 引入 axios 及其類型
import { AppEnv, ENV } from "@/config/env.ts"; // 引入環境變數
import Toast from "@/components/base/toast/Toast.ts"; // 引入 Toast 提示元件
// import App from "@/App.vue"; // 引入 App 元件 (這裡似乎未被使用，已註解)

export const axiosInstance: AxiosInstance = axios.create({ // 建立 axios 實例
    baseURL: ENV.API, // 設定基礎 URL
    timeout: 15000, // 設定請求超時時間 15000ms
})

axiosInstance.interceptors.request.use( // 請求攔截器
    (config) => { // 在發送請求之前做些什麼
        if (AppEnv.CAN_REQUEST) config.headers.token = AppEnv.TOKEN // 如果允許請求，將 token 加入 Header
        return config // 返回配置
    },
    error => Promise.reject(error), // 對請求錯誤做些什麼
)

axiosInstance.interceptors.response.use( // 響應攔截器
    // 響應正常的處理
    (response) => {
        // console.log(response.data)
        const { data } = response // 解構獲取 data
        if (response.status !== 200) { // 如果 HTTP 狀態碼不是 200
            Toast.warning(response.statusText) // 顯示警告Toast
            return Promise.reject(data) // 返回 Reject
        }
        if (data === null) { // 如果返回數據為 null
            return Promise.resolve({ // 返回自定義錯誤結構
                code: 500, // 錯誤碼
                msg: '系統出現錯誤', // 錯誤訊息：系統出現錯誤
                data: {}, // 空資料
                success: false, // 成功標記：否
            })
        }
        if (typeof data !== 'object') { // 如果返回不是物件 (例如純字串)
            return Promise.resolve({ // 包裝成標準結構
                data, // 數據
                success: true, // 成功標記：是
                code: 200 // 狀態碼
            })
        }
        return Promise.resolve(data) // 返回處理後的數據
    },
    // 請求出錯的處理
    (error) => {
        if (error.response === undefined && error.status === undefined) { // 如果沒有響應且無狀態 (通常是網絡錯誤或超時)
            return Promise.resolve({ // 返回超時錯誤結構
                code: 500, // 錯誤碼
                msg: '伺服器響應超時', // 錯誤訊息：伺服器響應超時
                data: null, // 空資料
                success: false, // 成功標記：否
            })
        }
        if (error.response.status >= 500) { // 如果是 5xx 伺服器錯誤
            return Promise.resolve({
                code: 500, // 錯誤碼
                msg: '伺服器出現錯誤', // 錯誤訊息：伺服器出現錯誤
                data: null, // 空資料
                success: false, // 成功標記：否
            })
        }
        if (error.response.status === 401) { // 如果是 401 未授權
            return Promise.resolve({
                code: 500, // 錯誤碼
                msg: '使用者名稱或密碼不正確', // 錯誤訊息：使用者名稱或密碼不正確
                data: null, // 空資料
            })
        }
        const { data } = error.response // 獲取錯誤響應數據
        if (data.code !== undefined) { // 如果後端有返回錯誤碼
            return Promise.resolve({
                code: data.code, // 錯誤碼
                msg: data.msg, // 使用後端返回的訊息
                success: false, // 成功標記：否
            })
        }
        return Promise.resolve({ // 其他未知錯誤
            code: 500, // 錯誤碼
            success: false, // 成功標記：否
            msg: data.msg, // 錯誤訊息
            data: null, // 空資料
        })
    },
)

export type AxiosResponse<T> = { code: number, data: T, success: boolean, msg: string } // 定義 API 回傳的標準介面泛型

// 加上對應的型別與預設值
async function request<T>(url: string, data: any = {}, params: any = {}, method: string = 'GET'): Promise<AxiosResponse<T>> { // 封裝 request 函數
    return axiosInstance({ // 調用 axios 實例
        url: url, // 請求 URL
        method, // 請求方法 (預設 GET)
        data, // Body 數據 (POST/PUT 用)
        params, // Query 參數 (GET 用)
    })
}

export default request // 匯出 request 函數
