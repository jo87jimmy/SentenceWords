import { createVNode, render } from 'vue' // 引入 Vue 的 createVNode 和 render 函數
import ToastComponent from '@/components/base/toast/Toast.vue' // 引入 Toast 組件
import type { ToastOptions, ToastInstance, ToastService } from '@/components/base/toast/type.ts' // 引入類型定義

interface ToastContainer { // 定義 Toast 容器介面
  id: string // 容器 ID
  container: HTMLElement // DOM 元素
  instance: ToastInstance // Toast 實例
  offset: number // 垂直偏移量
}

let toastContainers: ToastContainer[] = [] // 存儲所有活躍的 Toast 容器
let toastIdCounter = 0 // ID 計數器

// 創建 Toast 容器
const createToastContainer = (): HTMLElement => {
  const container = document.createElement('div') // 創建 div 元素
  container.className = 'toast-container' // 設定 class
  container.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    pointer-events: none;
  ` // 設定樣式：固定定位、居中、高層級
  return container // 返回容器
}

// 更新所有 Toast 的位置
const updateToastPositions = () => {
  toastContainers.forEach((toastContainer, index) => { // 遍歷所有容器
    const offset = index * 70 // 計算偏移量，每個 Toast 之間的間距 70px
    toastContainer.offset = offset // 更新偏移量屬性
    toastContainer.container.style.marginTop = `${offset}px` // 應用 Margin Top
  })
}

// 移除 Toast 容器
const removeToastContainer = (id: string) => {
  const index = toastContainers.findIndex(container => container.id === id) // 查找容器索引
  if (index > -1) {
    const container = toastContainers[index] // 獲取容器物件
    // TypeScript 的靜態分析無法確定 toastContainers[index] 是否一定存在。
    if (!container) return // 確保 container 一定有值
    // 延遲銷毀，等待動畫完成
    setTimeout(() => {
      render(null, container.container) // 卸載 Vue 組件
      container.container.remove() // 移除 DOM 元素
      const currentIndex = toastContainers.findIndex(c => c.id === id) // 再次查找索引（防止異步期間變化）
      if (currentIndex > -1) {
        toastContainers.splice(currentIndex, 1) // 從陣列中移除
        updateToastPositions() // 重新計算位置
      }
    }, 300) // 等待動畫完成（0.3秒）
  }
}

// Toast 主函數
const Toast: ToastService = (options: ToastOptions | string): ToastInstance => {
  const toastOptions = typeof options === 'string' ? { message: options } : options // 處理參數：字串轉物件
  const id = `toast-${++toastIdCounter}` // 生成唯一 ID

  // 創建 Toast 容器
  const container = createToastContainer()
  document.body.appendChild(container) // 掛載到 Body

  // 創建 VNode
  const vnode = createVNode(ToastComponent, {
    ...toastOptions, // 傳入選項
    onClose: () => { // 傳入關閉回調
      removeToastContainer(id) // 移除容器
    }
  })

  // 渲染到容器
  render(vnode, container)

  // 創建實例
  const instance: ToastInstance = {
    close: () => {
      vnode.component?.exposed?.close?.() // 調用組件暴露的 close 方法
    }
  }

  // 添加到容器列表
  const toastContainer: ToastContainer = {
    id,
    container,
    instance,
    offset: 0
  }

  toastContainers.push(toastContainer) // 加入列表
  updateToastPositions() // 更新位置

  return instance // 返回實例
}

// 添加類型方法：成功
Toast.success = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return Toast({ message, type: 'success', ...options })
}

// 添加類型方法：警告
Toast.warning = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return Toast({ message, type: 'warning', ...options })
}

// 添加類型方法：訊息
Toast.info = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return Toast({ message, type: 'info', ...options })
}

// 添加類型方法：錯誤
Toast.error = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
  return Toast({ message, type: 'error', ...options })
}

// 關閉所有消息
Toast.closeAll = () => {
  toastContainers.forEach(container => container.instance.close()) // 遍歷關閉
  toastContainers = [] // 清空列表
}

export default Toast // 導出 Toast
