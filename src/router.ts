import * as VueRouter from 'vue-router'; // 引入 VueRouter 的所有匯出模組
import type { RouteRecordRaw } from 'vue-router'; // 引入 RouteRecordRaw 類型定義，用於定義路由規則
import Layout from "@/pages/layout.vue"; // 引入佈局元件 Layout
import WordsPage from "@/pages/word/WordsPage.vue"; // 引入單字頁面元件 WordsPage
import DictList from "@/pages/word/DictList.vue"; // 引入字典列表元件 DictList
import DictDetail from "@/pages/word/DictDetail.vue";
import PracticeWords from "@/pages/word/PracticeWords.vue";
import WordTest from "@/pages/word/WordTest.vue";

import ArticlesPage from "@/pages/article/ArticlesPage.vue";
import BookDetail from "@/pages/article/BookDetail.vue";
import BookList from "@/pages/article/BookList.vue";
import PracticeArticles from "@/pages/article/PracticeArticles.vue";

import Setting from "@/pages/setting/Setting.vue";

export const routes: RouteRecordRaw[] = [ // 定義應用程式的路由列表，類型為 RouteRecordRaw 陣列
    {
        path: '/', // 定義根路徑
        component: Layout, // 根路徑對應的元件為 Layout
        children: [ // 定義子路由
            { path: '/', redirect: '/words' }, // 當訪問根路徑時，重新導向到 /words
            { path: 'words', component: WordsPage }, // 定義 /words 路徑，對應 WordsPage 元件
            { path: 'word', redirect: '/words' },
            { path: 'dict-list', component: DictList }, // 定義 /dict-list 路徑，對應 DictList 元件
            { path: 'dict-detail', component: DictDetail },
            { path: 'practice-words/:id', component: PracticeWords },
            { path: 'word-test/:id', component: WordTest },

            { path: 'articles', component: ArticlesPage },
            { path: 'article', redirect: '/articles' },
            { path: 'book-list', component: BookList },
            { path: 'book-detail', component: BookDetail },
            { path: 'practice-articles/:id', component: PracticeArticles },
            { path: 'study-article', redirect: '/articles' },

            { path: 'setting', component: Setting },
        ]
    }, { path: '/batch-edit-article', component: () => import("@/pages/article/BatchEditArticlePage.vue") },
]


const router = VueRouter.createRouter({ // 建立 Vue Router 實例
    history: VueRouter.createWebHistory(import.meta.env.VITE_ROUTE_BASE), // 使用 HTML5 History 模式，並設定基礎路徑
    routes, // 傳入路由設定
    // 按上一頁時記住位置，去新頁面時回到頂部
    scrollBehavior(_to, _from, savedPosition) { // 定義路由切換時的滾動行為
        // console.log('savedPosition', savedPosition) // 除錯日誌：查看儲存的滾動位置
        if (savedPosition) { // 如果有儲存的滾動位置（例如按瀏覽器上一頁）
            return savedPosition // 返回儲存的位置
        } else { // 如果是新導航
            return { top: 0 } // 滾動到頁面頂部
        }
    },
})

export default router // 匯出 router 實例供 main.ts 使用