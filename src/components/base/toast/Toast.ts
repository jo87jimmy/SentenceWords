import { createVNode, render } from 'vue' // 引入 Vue 的 createVNode 和 render 函數
import ToastComponent from '@/components/base/toast/Toast.vue' // 引入 Toast 組件
import type { ToastOptions, ToastInstance, ToastService } from '@/components/base/toast/type.ts' // 引入類型定義

interface ToastContainer { // 定義 Toast 容器介面
  id: string // 容器的唯一識別符
  container: HTMLElement // 儲存 Toast DOM 元素的引用
  instance: ToastInstance // 儲存 Toast 實例的引用
  offset: number // 垂直偏移量，用於定位 Toast
}

let toastContainers: ToastContainer[] = [] // 儲存所有活躍的 Toast 容器的陣列
let toastIdCounter = 0 // 用於生成唯一 Toast ID 的計數器

// 創建 Toast 容器的函數
const createToastContainer = (): HTMLElement => { // 定義創建 Toast 容器的函數
  const container = document.createElement('div') // 創建一個新的 div 元素作為 Toast 容器
  container.className = 'toast-container' // 為容器設定 CSS class 名稱
  container.style.cssText = ` // 設定容器的內聯樣式
    position: fixed; // 固定定位，使其不隨滾動條移動
    top: 20px; // 距離視窗頂部 20 像素
    left: 50%; // 距離視窗左側 50%
    transform: translateX(-50%); // 水平居中對齊
    z-index: 9999; // 設定較高的 z-index，確保 Toast 顯示在其他元素之上
    pointer-events: none; // 禁用鼠標事件，允許點擊穿透
  ` // 結束樣式設定
  return container // 返回創建好的容器 DOM 元素
}

// 更新所有 Toast 位置的函數
const updateToastPositions = () => { // 定義更新 Toast 位置的函數
  toastContainers.forEach((toastContainer, index) => { // 遍歷所有活躍的 Toast 容器
    const offset = index * 70 // 根據索引計算垂直偏移量，每個 Toast 間距 70px
    toastContainer.offset = offset // 更新 Toast 容器物件中的偏移量屬性
    toastContainer.container.style.marginTop = `${offset}px` // 將計算出的偏移量應用為容器的 margin-top 樣式
  }) // 結束遍歷
}

// 移除 Toast 容器的函數
const removeToastContainer = (id: string) => { // 定義移除 Toast 容器的函數，接收 Toast ID
  const index = toastContainers.findIndex(container => container.id === id) // 根據 ID 查找對應容器在陣列中的索引
  if (index > -1) { // 如果找到了容器
    const container = toastContainers[index] // 獲取對應的 Toast 容器物件
    // TypeScript 的靜態分析無法確定 toastContainers[index] 是否一定存在。
    if (!container) return // 確保 container 變數有值，避免潛在的 undefined 錯誤
    // 延遲銷毀，等待 Toast 的關閉動畫完成
    setTimeout(() => { // 設定一個定時器，延遲執行後續的銷毀操作
      render(null, container.container) // 卸載 Vue 組件，將其從 DOM 中移除
      container.container.remove() // 從 DOM 中移除 Toast 容器元素
      const currentIndex = toastContainers.findIndex(c => c.id === id) // 再次查找索引，以防在異步操作期間陣列發生變化
      if (currentIndex > -1) { // 如果再次找到容器
        toastContainers.splice(currentIndex, 1) // 從活躍 Toast 容器陣列中移除該容器
        updateToastPositions() // 重新計算並更新所有剩餘 Toast 的位置
      } // 結束內部條件判斷
    }, 300) // 定時器延遲 300 毫秒，與 Toast 的關閉動畫時間匹配
  } // 結束外部條件判斷
}

// Toast 主函數，用於創建和顯示 Toast
const Toast: ToastService = (options: ToastOptions | string): ToastInstance => { // 定義 Toast 服務函數
  const toastOptions = typeof options === 'string' ? { message: options } : options // 判斷傳入的 options 類型，如果是字串則轉換為物件
  const id = `toast-${++toastIdCounter}` // 生成一個唯一的 Toast ID，並遞增計數器

  // 創建 Toast 容器
  const container = createToastContainer() // 調用 createToastContainer 函數創建一個新的 Toast 容器
  document.body.appendChild(container) // 將創建的容器元素添加到文檔的 body 中

  // 創建 VNode
  const vnode = createVNode(ToastComponent, { // 創建一個 Vue 虛擬節點 (VNode)
    ...toastOptions, // 將 Toast 選項傳遞給 Toast 組件的 props
    onClose: () => { // 定義 Toast 組件的關閉回調函數
      removeToastContainer(id) // 在 Toast 關閉時調用 removeToastContainer 函數移除容器
    } // 結束 onClose 定義
  }) // 結束 createVNode 調用

  // 渲染到容器
  render(vnode, container) // 將創建的 VNode 渲染到 Toast 容器中

  // 創建實例
  const instance: ToastInstance = { // 創建一個 Toast 實例物件
    close: () => { // 定義實例的 close 方法
      vnode.component?.exposed?.close?.() // 調用 Toast 組件暴露的 close 方法來關閉 Toast
    } // 結束 close 方法定義
  } // 結束實例物件定義

  // 添加到容器列表
  const toastContainer: ToastContainer = { // 創建一個 ToastContainer 物件
    id, // 設定容器的 ID
    container, // 設定容器的 DOM 元素
    instance, // 設定容器的 Toast 實例
    offset: 0 // 初始化偏移量為 0
  } // 結束 ToastContainer 物件定義

  toastContainers.push(toastContainer) // 將新的 Toast 容器添加到活躍容器列表中
  updateToastPositions() // 更新所有 Toast 的位置，以確保新 Toast 正確顯示

  return instance // 返回創建的 Toast 實例
}

// 添加類型方法：成功提示
Toast.success = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => { // 定義 Toast.success 方法
  return Toast({ message, type: 'success', ...options }) // 調用主 Toast 函數，設定類型為 'success'
}

// 添加類型方法：警告提示
Toast.warning = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => { // 定義 Toast.warning 方法
  return Toast({ message, type: 'warning', ...options }) // 調用主 Toast 函數，設定類型為 'warning'
}

// 添加類型方法：訊息提示
Toast.info = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => { // 定義 Toast.info 方法
  return Toast({ message, type: 'info', ...options }) // 調用主 Toast 函數，設定類型為 'info'
}

// 添加類型方法：錯誤提示
Toast.error = (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => { // 定義 Toast.error 方法
  return Toast({ message, type: 'error', ...options }) // 調用主 Toast 函數，設定類型為 'error'
}

// 關閉所有消息的函數
Toast.closeAll = () => { // 定義 Toast.closeAll 方法
  toastContainers.forEach(container => container.instance.close()) // 遍歷所有活躍的 Toast 容器，並調用其 close 方法
  toastContainers = [] // 清空活躍 Toast 容器列表
} // 結束 closeAll 方法定義

export default Toast // 導出 Toast 服務
