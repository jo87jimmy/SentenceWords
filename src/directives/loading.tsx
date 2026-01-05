// src/directives/loading.tsx
import { createApp } from 'vue' // 引入 Vue 的 createApp 函數
//@ts-ignore
import IconEosIconsLoading from '~icons/eos-icons/loading' // 引入 loading 圖標組件

// 創建一個 Loading 組件
const LoadingComponent = {
  name: 'LoadingComponent', // 組件名稱
  render() { // 渲染函數
    return (
      <div
        style={{ // 樣式物件
          position: 'absolute', // 絕對定位
          top: 0, // 頂部對齊
          left: 0, // 左側對齊
          right: 0, // 右側對齊
          bottom: 0, // 底部對齊
          display: 'flex', // 彈性佈局
          justifyContent: 'center', // 水平居中
          alignItems: 'center', // 垂直居中
          background: 'rgba(255, 255, 255, 0.7)', // 半透明白色背景
          zIndex: 9999 // 高層級
        }}
      >
        <IconEosIconsLoading class="text-3xl" /> {/* loading 圖標，字體大小 3xl */}
      </div>
    )
  }
}

// 自定義指令
export default {
  mounted(el: any, binding: any) { // 掛載時鉤子
    // console.log('el',)
    const position = getComputedStyle(el).position // 獲取元素的定位屬性
    if (position === 'static' || !position) { // 如果是靜態定位或無定位
      el.style.position = 'relative' // 設置為相對定位，保證 loading 居中覆蓋
    }

    const app = createApp(LoadingComponent) // 創建應用實例
    const instance = app.mount(document.createElement('div')) // 掛載到新創建的 div
    el.__loadingInstance = instance // 將實例掛載到元素上以便後續訪問

    if (binding.value) { // 如果指令值為 true
      el.appendChild(instance.$el) // 將 loading 元素添加到目標元素中
    }
  },
  updated(el: any, binding: any) { // 更新時鉤子
    const instance = el.__loadingInstance // 獲取保存的實例
    if (binding.value && !el.contains(instance.$el)) { // 如果值為 true 且 loading 未顯示
      el.appendChild(instance.$el) // 添加 loading
    } else if (!binding.value && el.contains(instance.$el)) { // 如果值為 false 且 loading 已顯示
      el.removeChild(instance.$el) // 移除 loading
    }
  },
  unmounted(el: any) { // 卸載時鉤子
    const instance = el.__loadingInstance // 獲取實例
    if (instance && instance.$el.parentNode) { // 如果實例存在且有父節點
      instance.$el.parentNode.removeChild(instance.$el) // 從 DOM 移除
    }
    delete el.__loadingInstance // 刪除引用
  }
}
