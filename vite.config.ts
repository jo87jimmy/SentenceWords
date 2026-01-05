import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { resolve } from 'path'

function pathResolve(dir: string) {
  return resolve(__dirname, ".", dir)
}
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools(), tailwindcss(),
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
  base: './',
  resolve: {
    alias: {
      '@': pathResolve("src"),
    },
    extensions: ['.js', '.ts', '.json', '.vue']
  },

})
