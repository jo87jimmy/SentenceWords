import { onDeactivated, onMounted, onUnmounted, watch } from "vue"; // 引入 Vue 的生命週期鉤子及監聽器
import { emitter, EventKey } from "@/utils/eventBus.ts"; // 引入事件總線及事件鍵名
import { useRuntimeStore } from "@/stores/runtime.ts"; // 引入 Runtime Store
import { useSettingStore } from "@/stores/setting.ts"; // 引入 Setting Store
import { isMobile } from "@/utils"; // 引入是否為行動裝置判斷函數

export function useWindowClick(cb: (e: PointerEvent) => void) { // 定義視窗點擊事件 Hook
  onMounted(() => { // 組件掛載時
    emitter.on(EventKey.closeOther, cb as any) // 監聽關閉其他事件
    window.addEventListener('click', cb as any) // 監聽視窗點擊事件
  })
  onUnmounted(() => { // 組件卸載時
    window.removeEventListener('click', cb as any) // 移除視窗點擊監聽
  })
}

export function useEventListener(type: string, listener: EventListenerOrEventListenerObject) { // 自定義事件監聽 Hook
  const invokeListener = (event: KeyboardEvent) => { // 呼叫監聽器的輔助函數
    if (typeof listener === 'function') { // 如果監聽器是函數
      return (listener as EventListener)(event) // 直接呼叫
    }
    if (listener && typeof (listener as EventListenerObject).handleEvent === 'function') { // 如果是物件
      return (listener as EventListenerObject).handleEvent(event) // 呼叫 handleEvent 方法
    }
  }

  let cleanup: (() => void) | null = null // 清理函數引用

  onMounted(() => { // 組件掛載時
    const cleanupFns: Array<() => void> = [] // 存儲清理函數的陣列
    const registerCleanup = (fn: () => void) => cleanupFns.push(fn) // 註冊清理函數的方法

    const performCleanup = () => { // 執行清理的方法
      while (cleanupFns.length) { // 遍歷所有清理函數
        const fn = cleanupFns.pop() // 取出最後一個
        if (fn) {
          try {
            fn() // 執行清理
          } catch (err) {
            console.warn('[useEventListener] cleanup error', err) // 捕獲並打印錯誤
          }
        }
      }
    }

    if (isMobile() && type === 'keydown') { // 如果是行動裝置且監聽 keydown 事件
      const ensureMobileInput = () => { // 確保行動裝置輸入框存在
        let input = document.querySelector('#typing-listener') as HTMLInputElement | null // 查找輸入框
        if (!input) { // 如果不存在
          input = document.createElement('input') // 建立輸入框
          input.id = 'typing-listener' // 設定 ID
          input.type = 'text' // 設定類型
          input.autocomplete = 'off' // 關閉自動完成
          input.autocapitalize = 'off' // 關閉自動大寫
          input.setAttribute('autocorrect', 'off') // 關閉自動更正
          input.spellcheck = false // 關閉拼寫檢查
          input.tabIndex = -1 // 設定 Tab 索引
          input.setAttribute('aria-hidden', 'true') // 設定無法訪問
          Object.assign(input.style, { // 設定樣式
            position: 'fixed', // 固定定位
            opacity: '0', // 透明
            pointerEvents: 'none', // 不響應滑鼠事件
            width: '1px', // 寬度 1px
            height: '1px', // 高度 1px
            top: '0', // 頂部對齊
            left: '-9999px', // 移出螢幕
            zIndex: '-1', // 層級最低
          })
        }
        if (!input.parentNode) { // 如果未插入 DOM
          document.body.appendChild(input) // 插入 body
        }
        return input // 返回輸入框元素
      }

      const hiddenInput = ensureMobileInput() // 獲取隱藏輸入框
      let isComposing = false // 是否正在輸入中文 (組字中)
      const ignoredKeys = new Set<string>() // 忽略的按鍵集合
      const markIgnore = (key: string) => { // 標記忽略按鍵
        ignoredKeys.add(key) // 加入集合
        window.setTimeout(() => ignoredKeys.delete(key), 150) // 150ms 後移除
      }

      const createSyntheticEvent = (payload: { key: string; code?: string; keyCode: number }) => { // 建立合成事件物件
        const base = {
          key: payload.key, // 按鍵字元
          code: payload.code ?? '', // 按鍵代碼
          keyCode: payload.keyCode, // 按鍵碼
          which: payload.keyCode, // 相容 which
          ctrlKey: false, // Ctrl 鍵狀態
          altKey: false, // Alt 鍵狀態
          shiftKey: false, // Shift 鍵狀態
          metaKey: false, // Meta 鍵狀態
          repeat: false, // 是否重複
          isComposing: false, // 是否組字中
          type, // 事件類型
          preventDefault() { }, // 阻止預設行為
          stopPropagation() { }, // 停止冒泡
          stopImmediatePropagation() { }, // 立即停止傳播
        }
        return base as unknown as KeyboardEvent // 返回 KeyboardEvent 類型
      }

      const dispatchSyntheticKey = (payload: { key: string; code?: string; keyCode: number }) => { // 派發合成按鍵事件
        markIgnore(payload.key) // 標記忽略原生事件
        invokeListener(createSyntheticEvent(payload)) // 呼叫監聽器
      }

      const handleCompositionStart = () => { // 處理組字開始
        isComposing = true // 標記組字中
      }

      const handleCompositionEnd = (event: CompositionEvent) => { // 處理組字結束
        isComposing = false // 標記組字結束
        if (!event.data) { // 如果沒有數據
          hiddenInput.value = '' // 清空輸入框
          return
        }
        for (const char of event.data) { // 遍歷輸入的字元
          const keyCode = char === ' ' ? 32 : char.toUpperCase().charCodeAt(0) // 獲取 keyCode
          dispatchSyntheticKey({ // 派發按鍵事件
            key: char, // 字元
            code: char === ' ' ? 'Space' : undefined, // 代碼
            keyCode, // keyCode
          })
        }
        hiddenInput.value = '' // 清空輸入框
      }

      const handleInput = (e: Event) => { // 處理輸入事件
        const event = e as InputEvent // 類型轉換
        if (isComposing) return // 如果組字中則忽略
        const target = event.target as HTMLInputElement | null // 獲取目標元素
        const value = target?.value ?? '' // 獲取值

        if (event.inputType === 'deleteContentBackward') { // 如果是退格刪除
          dispatchSyntheticKey({ key: 'Backspace', code: 'Backspace', keyCode: 8 }) // 派發 Backspace 事件
          if (target) target.value = '' // 清空輸入框
          return
        }

        const char = value.slice(-1) || (event as any).data?.slice(-1) // 獲取最後一個輸入的字元
        if (!char) { // 如果無字元
          if (target) target.value = '' // 清空
          return
        }

        const keyCode = char === ' ' ? 32 : char.toUpperCase().charCodeAt(0) // 計算 keyCode
        dispatchSyntheticKey({ // 派發按鍵事件
          key: char,
          code: char === ' ' ? 'Space' : undefined,
          keyCode,
        })

        window.setTimeout(() => { // 延遲清空
          if (target) target.value = ''
        }, 0)
      }

      const shouldFocusInput = (target: HTMLElement | null) => { // 判斷是否應該聚焦輸入框
        if (!target) return false // 無目標則否
        if (!window.location.pathname.includes('/practice')) return false // 非練習頁面否
        const typingWord = target.closest('.typing-word') // 是否在 typing-word 內
        if (!typingWord) return false
        if (target.closest('.sentence') || target.closest('.phrase')) return false // 是否在句子或短語內
        if (target.classList?.contains('flex') && target.querySelector('.phrase')) return false // 檢查特定結構
        return true // 允許聚焦
      }

      const handleFocusRequest = (event: MouseEvent | TouchEvent) => { // 處理聚焦請求
        const target = event.target as HTMLElement | null // 獲取目標
        if (!shouldFocusInput(target)) return // 如果不該聚焦則返回
        window.setTimeout(() => hiddenInput.focus(), 60) // 延遲聚焦
      }

      const windowListener = (event: KeyboardEvent) => { // 視窗按鍵監聽器
        if (ignoredKeys.has(event.key)) { // 如果在忽略列表中
          ignoredKeys.delete(event.key) // 移除並返回
          return
        }
        invokeListener(event) // 呼叫監聽器
      }

      hiddenInput.addEventListener('compositionstart', handleCompositionStart) // 監聽組字開始
      registerCleanup(() => hiddenInput.removeEventListener('compositionstart', handleCompositionStart)) // 註冊清理

      hiddenInput.addEventListener('compositionend', handleCompositionEnd) // 監聽組字結束
      registerCleanup(() => hiddenInput.removeEventListener('compositionend', handleCompositionEnd)) // 註冊清理

      hiddenInput.addEventListener('input', handleInput) // 監聽輸入
      registerCleanup(() => hiddenInput.removeEventListener('input', handleInput)) // 註冊清理

      window.addEventListener('click', handleFocusRequest) // 監聽點擊聚焦
      registerCleanup(() => window.removeEventListener('click', handleFocusRequest)) // 註冊清理

      window.addEventListener('touchstart', handleFocusRequest) // 監聽觸摸聚焦
      registerCleanup(() => window.removeEventListener('touchstart', handleFocusRequest)) // 註冊清理

      window.addEventListener(type, windowListener) // 監聽視窗事件
      registerCleanup(() => window.removeEventListener(type, windowListener)) // 註冊清理

      registerCleanup(() => { // 註冊清理輸入框值
        hiddenInput.value = ''
      })
    } else { // 非行動裝置
      const windowListener = (event: Event) => invokeListener(event as KeyboardEvent) // 封裝監聽器
      window.addEventListener(type, windowListener) // 監聽事件
      registerCleanup(() => window.removeEventListener(type, windowListener)) // 註冊清理
    }

    cleanup = () => { // 定義清理函數
      performCleanup() // 執行清理
      cleanup = null // 置空
    }
  })

  const remove = () => { // 定義移除方法
    if (cleanup) cleanup() // 執行清理
  }

  onUnmounted(remove) // 卸載時移除
  onDeactivated(remove) // 停用時移除
}

export function getShortcutKey(e: KeyboardEvent) { // 獲取快捷鍵字串函數
  let shortcutKey = '' // 初始化快捷鍵字串
  if (e.ctrlKey || e.metaKey) shortcutKey += 'Ctrl+' // 如果按下 Ctrl 或 Meta (Mac)
  if (e.altKey) shortcutKey += 'Alt+' // 如果按下 Alt
  if (e.shiftKey) shortcutKey += 'Shift+' // 如果按下 Shift
  if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift') { // 如果不是修飾鍵本身
    if (e.keyCode >= 65 && e.keyCode <= 90) { // 如果是字母鍵
      shortcutKey += e.key.toUpperCase() // 轉大寫加入
    } else { // 其他鍵
      if (e.key === 'ArrowRight') {
        shortcutKey += '➡' // 右箭頭
      } else if (e.key === 'ArrowLeft') {
        shortcutKey += '⬅' // 左箭頭
      } else if (e.key === 'ArrowUp') {
        shortcutKey += '⬆' // 上箭頭
      } else if (e.key === 'ArrowDown') {
        shortcutKey += '⬇' // 下箭頭
      } else {
        shortcutKey += e.key // 其他按鍵直接加入
      }
    }
  }
  shortcutKey = shortcutKey.trim() // 去除空白

  // console.log('key', shortcutKey) // 除錯日誌
  return shortcutKey // 返回快捷鍵字串
}

export function useStartKeyboardEventListener() { // 啟動全域鍵盤監聽 Hook
  const runtimeStore = useRuntimeStore() // 獲取 Runtime Store
  const settingStore = useSettingStore() // 獲取 Setting Store

  useEventListener('keydown', (evt: Event) => { // 監聽 keydown
    const e = evt as KeyboardEvent // 類型轉換
    if (!runtimeStore.disableEventListener) { // 如果未禁用監聽

      // 檢查當前單字是否包含空格，如果包含，則空格鍵應該被視為輸入
      if (e.code === 'Space') {
        // 獲取當前正在輸入的單字資訊 (掛載在 window 上的全域變數)
        const currentWord = window.__CURRENT_WORD_INFO__;

        // 如果當前單字包含空格，且下一個字元應該是空格，則將空格鍵視為輸入
        // 或者如果當前處於輸入鎖定狀態（等待空格輸入），也將空格鍵視為輸入
        if (currentWord &&
          ((currentWord.word &&
            currentWord.word.includes(' ') &&
            currentWord.word[currentWord.input.length] === ' ') ||
            currentWord.inputLock === true)) {
          e.preventDefault(); // 阻止預設行為 (滾動等)
          return emitter.emit(EventKey.onTyping, e); // 發送輸入事件
        }
      }

      let shortcutKey = getShortcutKey(e) // 獲取快捷鍵
      // console.log('shortcutKey', shortcutKey)

      let list = Object.entries(settingStore.shortcutKeyMap) // 獲取快捷鍵設定列表
      let shortcutEvent = '' // 初始化快捷鍵事件
      for (const [k, v] of list) { // 遍歷設定
        if (v === shortcutKey) { // 如果匹配
          // console.log('快捷鍵', k)
          shortcutEvent = k // 記錄事件名
          break
        }
      }
      if (shortcutEvent) { // 如果有匹配的快捷鍵事件
        e.preventDefault() // 阻止預設行為
        emitter.emit(shortcutEvent, e) // 發送快捷鍵事件
      } else {
        // 非英文模式下，輸入區域的 keyCode 均為 229時，
        // 空格鍵始終應該被轉發到 onTyping 函數，由它來決定是作為輸入還是切換單字
        if (e.code === 'Space') {
          e.preventDefault(); // 阻止預設行為
          return emitter.emit(EventKey.onTyping, e); // 發送輸入事件
        }

        if (((e.keyCode >= 65 && e.keyCode <= 90) // 字母鍵
          || (e.keyCode >= 48 && e.keyCode <= 57) // 數字鍵
          // 空格鍵已經在上面處理過了
          || e.code === 'Slash' // 斜線
          || e.code === 'Quote' // 引號
          || e.code === 'Comma' // 逗號
          || e.code === 'BracketLeft' // 左括號
          || e.code === 'BracketRight' // 右括號
          || e.code === 'Period' // 句號
          || e.code === 'Minus' // 減號
          || e.code === 'Equal' // 等號
          || e.code === 'Semicolon' // 分號
          // || e.code === 'Backquote'
          || e.keyCode === 229 // 輸入法組字中常出現的許多鍵碼 (Android/IME)
          // 當按下功能鍵時，不阻止事件傳播
        ) && (!e.ctrlKey && !e.altKey)) { // 且未按下 Ctrl 或 Alt
          if (isMobile() && e.keyCode === 229 && e.key === 'Unidentified') {
            // Android 軟鍵盤在 keydown 階段不會提供字元，等待 input/composition 事件來派發實際輸入
            return
          }
          e.preventDefault() // 阻止預設行為
          emitter.emit(EventKey.onTyping, e) // 發送輸入事件
        } else {
          emitter.emit(EventKey.keydown, e) // 發送普通 keydown 事件
        }
      }

    }
  })
  useEventListener('keyup', (evt: Event) => { // 監聽 keyup
    const e = evt as KeyboardEvent
    if (!runtimeStore.disableEventListener) {
      emitter.emit(EventKey.keyup, e) // 發送 keyup 事件
    }
  })
}

export function useOnKeyboardEventListener(onKeyDown: (e: KeyboardEvent) => void, onKeyUp: (e: KeyboardEvent) => void) { // 註冊特定鍵盤監聽器的 Hook
  onMounted(() => {
    emitter.on(EventKey.keydown, onKeyDown as any) // 註冊 keydown
    emitter.on(EventKey.keyup, onKeyUp as any) // 註冊 keyup
  })
  onUnmounted(() => {
    emitter.off(EventKey.keydown, onKeyDown as any) // 移除 keydown
    emitter.off(EventKey.keyup, onKeyUp as any) // 移除 keyup
  })
}

// 因為如果用 useStartKeyboardEventListener 區域變數控制，當出現多個 hooks 時就不行了，所以用全域變數來控制
export function useDisableEventListener(watchVal: any) { // 禁用事件監聽的 Hook
  const runtimeStore = useRuntimeStore() // 獲取 Runtime Store
  watch(watchVal, (n: any) => { // 監聽傳入的值
    runtimeStore.disableEventListener = n // 更新 store 中的禁用狀態
  })
}
