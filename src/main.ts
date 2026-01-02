import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from '@/router'
import VueVirtualScroller from 'vue-virtual-scroller'
//讓滾動條正常顯示，需要在 main.ts中引入它的 CSS 文件。
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura'

const pinia = createPinia()
const app = createApp(App)
app.use(VueVirtualScroller)
app.use(pinia)
app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
})
app.mount('#app')

// 註冊Service Worker(pwa支持)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}