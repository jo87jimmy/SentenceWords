import { createApp } from 'vue' // 從 vue 引入 createApp 函數，用於建立應用程式實例
import '@/assets/style.css' // 引入全域樣式檔案 style.css
import '@/assets/tailwind.css' // 引入 Tailwind CSS 樣式檔案
import App from './App.vue' // 引入根元件 App.vue
import { createPinia } from 'pinia' // 從 pinia 引入 createPinia，用於狀態管理
import router from '@/router' // 引入路由設定
import VueVirtualScroller from 'vue-virtual-scroller' // 引入虛擬捲動庫，用於最佳化長列表效能
// 讓捲軸正常顯示，需要在 main.ts 中引入它的 CSS 檔案。
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css' // 引入虛擬捲動庫的 CSS 樣式
import PrimeVue from 'primevue/config'; // 引入 PrimeVue UI 庫的設定
import Aura from '@primeuix/themes/aura' // 引入 PrimeVue 的 Aura 主題
import ConfirmationService from 'primevue/confirmationservice'; // 引入 PrimeVue 的確認服務
import loadingDirective from './directives/loading.tsx' // 引入自訂的載入指令 loadingDirective

const pinia = createPinia() // 建立 Pinia 實例
const app = createApp(App) // 建立 Vue 應用程式實例
app.use(VueVirtualScroller) // 註冊 VueVirtualScroller 套件
app.use(pinia) // 註冊 Pinia 套件
app.use(router) // 註冊 Router 套件
app.use(PrimeVue, { // 註冊 PrimeVue 套件並進行設定
    theme: { // 主題設定
        preset: Aura // 使用 Aura 主題預設值
    }
})
app.use(ConfirmationService); // 註冊 ConfirmationService 服務
app.directive('loading', loadingDirective) // 註冊全域指令 'loading'
app.mount('#app') // 將應用程式掛載到 DOM 中的 #app 元素上

// 註冊 Service Worker (PWA 支援)
