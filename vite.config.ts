import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss(),
  Icons({
    autoInstall: true,
    compiler: 'vue3',
  }),
  Components({
    resolvers: [
      IconsResolver({
        prefix: 'Icon',
      }),
    ],
  })],

})
