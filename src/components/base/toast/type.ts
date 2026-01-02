export type ToastType = 'success' | 'warning' | 'info' | 'error' // 定義 Toast 類型：成功、警告、資訊、錯誤

export interface ToastOptions { // 定義 Toast 選項介面
  message: string // 訊息內容
  type?: ToastType // 訊息類型 (可選)
  duration?: number // 顯示時長 (可選)
  showClose?: boolean // 是否顯示關閉按鈕 (可選)
}

export interface ToastInstance { // 定義 Toast 實例介面
  close: () => void // 關閉方法
}

export interface ToastService { // 定義 Toast 服務介面 (函數物件)
  (options: ToastOptions | string): ToastInstance // 可直接調用，傳入選項或字串

  success(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): ToastInstance // 成功便捷方法

  warning(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): ToastInstance // 警告便捷方法

  info(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): ToastInstance // 資訊便捷方法

  error(message: string, options?: Omit<ToastOptions, 'message' | 'type'>): ToastInstance // 錯誤便捷方法

  closeAll(): void // 關閉所有 Toast 方法
}
