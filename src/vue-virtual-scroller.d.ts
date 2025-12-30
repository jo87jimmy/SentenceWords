//因為 vue-virtual-scroller (特別是新版 @next) 可能沒有內建完整的 TypeScript 類型定義文件，
//或者 TypeScript 無法自動找到它。在 src 目錄下創建了一個類型聲明文件
//這會告訴 TypeScript 將該模組視為 any 類型，從而消除編譯錯誤。
declare module 'vue-virtual-scroller';
