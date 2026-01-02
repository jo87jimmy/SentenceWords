import { defineStore } from "pinia" // 引入 Pinia 的 defineStore 函數
import { type Dict } from "@/types/types.ts"; // 引入 Dict 類型定義
import { getDefaultDict } from "@/types/func.ts"; // 引入獲取預設字典的輔助函數

export interface RuntimeState { // 定義 Runtime Store 的狀態介面
  disableEventListener: boolean, // 是否禁用全域事件監聽器
  modalList: Array<{ id: string | number, close: Function }> // 管理當前打開的模態框列表，包含 ID 和關閉函數
  editDict: Dict // 當前正在編輯的字典物件
  showDictModal: boolean // 是否顯示字典詳情模態框
  excludeRoutes: any[] // 路由排除列表（可能用於特定路由不執行某些邏輯）
  routeData: any, // 路由相關數據緩存
  isNew: boolean, // 標記是否為新用戶或新狀態
}

export const useRuntimeStore = defineStore('runtime', { // 定義 runtime store
  state: (): RuntimeState => { // 初始化狀態
    return {
      routeData: null, // 初始化路由數據為 null
      disableEventListener: false, // 預設不禁用事件監聽
      modalList: [], // 初始化模態框列表為空
      editDict: getDefaultDict(), // 初始化編輯字典為預設空字典
      showDictModal: false, // 預設不顯示字典模態框
      excludeRoutes: [], // 初始化排除路由列表為空
      isNew: false, // 初始化新狀態為 false
    }
  },
  actions: { // 定義操作方法
    updateExcludeRoutes(val: any) { // 更新排除路由列表的方法
      // console.log('val', val) // 調試日誌
      if (val.type === 'add') { // 如果操作類型是添加
        if (!this.excludeRoutes.find(v => v === val.value)) { // 檢查是否已存在
          this.excludeRoutes.push(val.value) // 不存在則添加
        }
      } else { // 如果操作類型不是添加（即刪除）
        let resIndex = this.excludeRoutes.findIndex(v => v === val.value) // 查找索引
        if (resIndex !== -1) { // 如果找到了
          this.excludeRoutes.splice(resIndex, 1) // 從列表中移除
        }
      }
      // console.log('store.excludeRoutes', this.excludeRoutes) // 調試日誌：輸出更新後的列表
    },
  }
})
