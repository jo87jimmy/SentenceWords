import mitt from 'mitt' // 引入 mitt 事件總線庫
import { onMounted, onUnmounted } from "vue"; // 引入 Vue 的生命週期鉤子

export const emitter = mitt<Events>() // 匯出 mitt 事件發射器實例
export const EventKey = { // 定義事件鍵名常數物件
  resetWord: 'resetWord', // 重置單字事件
  changeDict: 'changeDict', // 切換字典事件
  openStatModal: 'openStatModal', // 開啟統計模態框事件
  openWordListModal: 'openWordListModal', // 開啟單字列表模態框事件
  closeOther: 'closeOther', // 關閉其他事件
  keydown: 'keydown', // 鍵盤按下事件
  keyup: 'keyup', // 鍵盤放開事件
  onTyping: 'onTyping', // 正在打字事件
  repeatStudy: 'repeatStudy', // 重複學習事件
  continueStudy: 'continueStudy', // 繼續學習事件
  write: 'write', // 寫入/輸入事件
  editDict: 'editDict', // 編輯字典事件
  openMyDictDialog: 'openMyDictDialog', // 開啟我的字典對話框事件
  stateInitEnd: 'stateInitEnd', // 狀態初始化結束事件
  randomWrite: 'randomWrite', // 隨機輸入事件 (測試用?)
} as const

type Events = {
  [EventKey.resetWord]: void;
  [EventKey.changeDict]: any;
  [EventKey.openStatModal]: any;
  [EventKey.openWordListModal]: any;
  [EventKey.closeOther]: any;
  [EventKey.keydown]: KeyboardEvent;
  [EventKey.keyup]: KeyboardEvent;
  [EventKey.onTyping]: KeyboardEvent;
  [EventKey.repeatStudy]: any;
  [EventKey.continueStudy]: any;
  [EventKey.write]: any;
  [EventKey.editDict]: any;
  [EventKey.openMyDictDialog]: any;
  [EventKey.stateInitEnd]: any;
  [EventKey.randomWrite]: any;
  [key: string]: any;
}

export function useEvent(key: string, func: any) { // 封裝事件監聽 Hook
  onMounted(() => { // 組件掛載時
    emitter.on(key, func) // 註冊事件監聽
  })

  onUnmounted(() => { // 組件卸載時
    emitter.off(key, func) // 移除事件監聽
  })
}

export function useEvents(arrs: any[],) { // 封裝多個事件監聽 Hook
  onMounted(() => { // 組件掛載時
    arrs.map((arr) => emitter.on(arr[0], arr[1])) // 遍歷註冊所有事件
  })

  onUnmounted(() => { // 組件卸載時
    arrs.map((arr) => emitter.off(arr[0], arr[1])) // 遍歷移除所有事件
  })
}
