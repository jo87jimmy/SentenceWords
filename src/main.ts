import { createApp } from 'vue' // 從 vue 引入 createApp 函數，用於創建應用實例
import './style.css' // 引入全域樣式文件 style.css
import App from './App.vue' // 引入根組件 App.vue
import { createPinia } from 'pinia' // 從 pinia 引入 createPinia，用於狀態管理
import router from '@/router' // 引入路由配置
import VueVirtualScroller from 'vue-virtual-scroller' // 引入虛擬捲動庫，用於優化長列表性能
// 讓滾動條正常顯示，需要在 main.ts 中引入它的 CSS 文件。
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css' // 引入虛擬捲動庫的 CSS 樣式
import PrimeVue from 'primevue/config'; // 引入 PrimeVue UI 庫的配置
import Aura from '@primeuix/themes/aura' // 引入 PrimeVue 的 Aura 主題
import ConfirmationService from 'primevue/confirmationservice'; // 引入 PrimeVue 的確認服務

const pinia = createPinia() // 創建 Pinia 實例
const app = createApp(App) // 創建 Vue 應用實例
app.use(VueVirtualScroller) // 註冊 VueVirtualScroller 插件
app.use(pinia) // 註冊 Pinia 插件
app.use(router) // 註冊 Router 插件
app.use(PrimeVue, { // 註冊 PrimeVue 插件並進行配置
    theme: { // 主題配置
        preset: Aura // 使用 Aura 主題預設
    }
})
app.use(ConfirmationService);
app.mount('#app') // 將應用掛載到 DOM 中的 #app 元素上

// 註冊 Service Worker (PWA 支持)
if ('serviceWorker' in navigator) { // 檢查瀏覽器是否支援 Service Worker
    window.addEventListener('load', () => { // 當頁面完全加載後執行
        navigator.serviceWorker.register('/service-worker.js') // 註冊 service-worker.js 腳本
            .then(registration => { // 註冊成功的回調
                console.log('ServiceWorker registration successful with scope: ', registration.scope); // 輸出成功訊息及作用域
            })
            .catch(err => { // 註冊失敗的錯誤捕獲
                console.log('ServiceWorker registration failed: ', err); // 輸出失敗錯誤訊息
            });
    });
}