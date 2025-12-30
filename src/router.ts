import * as VueRouter from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import Layout from "@/pages/layout.vue";
import WordsPage from "@/pages/word/WordsPage.vue";

export const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: Layout,
        children: [
            { path: '/', redirect: '/words' },
            { path: 'words', component: WordsPage },
        ]
    }
]


const router = VueRouter.createRouter({
    history: VueRouter.createWebHistory(import.meta.env.VITE_ROUTE_BASE),
    routes,
    //按上一頁時記住位置，去新頁面時回到頂部
    scrollBehavior(to, from, savedPosition) {
        // console.log('savedPosition', savedPosition)
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    },
})

export default router