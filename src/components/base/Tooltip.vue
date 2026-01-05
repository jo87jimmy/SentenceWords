<script lang="jsx">
import {Teleport, Transition} from 'vue' // 引入 Vue 組件

export default {
  name: "Tooltip", // 組件名稱
  components: {
    Teleport,
    Transition
  },
  props: { // 定義 Props
    title: {
      type: String,
      default() {
        return ''
      }
    },
    disabled: {
      type: Boolean,
      default() {
        return false
      }
    }
  },
  data() { // 定義數據
    return {
      show: false // 顯示狀態
    }
  },
  methods: { // 定義方法
    showPop(e) { // 顯示懸浮框
      if (this.disabled) return // 如果禁用則返回
      if (!this.title && !this.$slots?.reference) return; // 如果無標題且無引用插槽則返回
      e.stopPropagation() // 阻止冒泡
      let rect = e.target.getBoundingClientRect() // 獲取目標元素位置
      this.show = true // 顯示
      this.$nextTick(() => { // 等待 DOM 更新
        let tip = this.$refs?.tip?.getBoundingClientRect() // 獲取 Tooltip 元素位置
        if (!tip) return // 如果不存在則返回
        if (rect.top < 50) { // 如果距離頂部小於 50
            // 顯示在下方
          this.$refs.tip.style.top = rect.top + rect.height + 10 + 'px'
        } else {
            // 顯示在上方
          this.$refs.tip.style.top = rect.top - tip.height - 10 + 'px'
        }
        let tipWidth = tip.width // Tooltip 寬度
        let rectWidth = rect.width // 目標寬度
        // 水平居中對齊
        this.$refs.tip.style.left = rect.left - (tipWidth - rectWidth) / 2 + 'px'
        // onmouseleave={() => this.show = false}
      })
    },
  },
  render() { // 渲染函數
    let DefaultNode = this.$slots.default()[0] // 默認插槽
    let ReferenceNode = this.$slots?.reference?.()?.[0] // 引用插槽 (可選)
    return <>
      <Transition name="fade">
        <Teleport to="body">
          {this.show && (
              <div ref="tip" class="tip">
                {ReferenceNode ? <ReferenceNode/> : this.title}
              </div>
          )}
        </Teleport>
      </Transition>

      <DefaultNode
          onClick={() => this.show = false}
          onmouseenter={(e) => this.showPop(e)}
          onmouseleave={() => this.show = false}
      />
    </>
  }
}
</script>
<style lang="scss" scoped>
.tip { // Tooltip 樣式
  position: fixed; // 固定定位
  font-size: 1rem; // 字體大小
  z-index: 9999; // 層級
  border-radius: .3rem; // 圓角
  padding: 0.4rem .8rem; // 內邊距
  color: var(--color-font-1); // 字體顏色
  background: var(--color-tooltip-bg); // 背景色
  max-width: 22rem; // 最大寬度
  box-shadow: 0 0 6px 1px var(--color-tooltip-shadow); // 陰影
}
</style>
