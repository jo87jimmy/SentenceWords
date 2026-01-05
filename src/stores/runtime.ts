import { defineStore } from "pinia" // 引入 Pinia 的 defineStore 函數，用於定義狀態管理儲存
import { type Dict } from "@/types/types.ts"; // 引入 Dict 類型定義，用於表示字典物件的結構
import { getDefaultDict } from "@/types/func.ts"; // 引入獲取預設字典的輔助函數，用於初始化字典狀態

export interface RuntimeState { // 定義 Runtime Store 的狀態介面，規範儲存中數據的類型
  disableEventListener: boolean, // 標示是否禁用全域事件監聽器，控制事件處理行為
  modalList: Array<{ id: string | number, close: Function }> // 管理當前打開的模態框列表，每個模態框包含其唯一ID和關閉函數
  editDict: Dict // 當前正在編輯的字典物件，用於表單編輯或詳情展示
  showDictModal: boolean // 標示是否顯示字典詳情模態框，控制模態框的顯示隱藏
  excludeRoutes: any[] // 路由排除列表，用於特定路由不執行某些邏輯或權限檢查
  routeData: any, // 路由相關數據緩存，用於在不同路由間傳遞或暫存數據
  isNew: boolean, // 標記是否為新用戶或新狀態，用於區分首次加載或特定行為
}

export const useRuntimeStore = defineStore('runtime', { // 定義名為 'runtime' 的 Pinia 儲存
  state: (): RuntimeState => { // 定義儲存的初始狀態，返回一個符合 RuntimeState 介面的物件
    return { // 返回初始狀態物件的具體內容
      routeData: null, // 初始化路由數據為 null，表示尚未載入任何路由數據
      disableEventListener: false, // 預設不禁用事件監聽，允許事件正常觸發
      modalList: [], // 初始化模態框列表為空陣列，表示目前沒有打開的模態框
      editDict: getDefaultDict(), // 初始化編輯字典為預設空字典物件，準備進行編輯
      showDictModal: false, // 預設不顯示字典模態框，保持隱藏狀態
      excludeRoutes: [], // 初始化排除路由列表為空陣列，表示目前沒有需要排除的路由
      isNew: false, // 初始化新狀態為 false，表示不是新用戶或新狀態
    }
  },
  actions: { // 定義儲存的操作方法，用於修改狀態或執行業務邏輯
    updateExcludeRoutes(val: any) { // 更新排除路由列表的方法，接收一個包含操作類型和值的物件
      // console.log('val', val) // 調試日誌：輸出傳入的 val 物件，用於檢查數據
      if (val.type === 'add') { // 如果操作類型是 'add'，表示要添加一個路由到排除列表
        if (!this.excludeRoutes.find(v => v === val.value)) { // 檢查要添加的值是否已存在於排除路由列表中
          this.excludeRoutes.push(val.value) // 如果不存在，則將值添加到排除路由列表中
        }
      } else { // 如果操作類型不是 'add'（例如 'remove'），表示要從排除列表中刪除一個路由
        let resIndex = this.excludeRoutes.findIndex(v => v === val.value) // 查找要刪除的值在排除路由列表中的索引
        if (resIndex !== -1) { // 如果找到了該值（索引不為 -1）
          this.excludeRoutes.splice(resIndex, 1) // 從排除路由列表中移除該值
        }
      }
      // console.log('store.excludeRoutes', this.excludeRoutes) // 調試日誌：輸出更新後的排除路由列表，用於驗證
    },
  }
})
