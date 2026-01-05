<script setup lang="ts">
import Tooltip from "@/components/base/Tooltip.vue"; // 引入 Tooltip 組件

interface IProps { // 定義 Props 介面
  keyboard?: string, // 鍵盤快捷鍵提示
  active?: boolean // 是否為激活狀態
  disabled?: boolean // 是否禁用
  loading?: boolean // 是否加載中
  size?: 'small' | 'normal' | 'large', // 按鈕尺寸
  type?: 'primary' | 'link' | 'info' | 'orange' // 按鈕類型
}

withDefaults(defineProps<IProps>(), { // 設置預設值
  type: 'primary', // 預設類型為 primary
  size: 'normal', // 預設尺寸為 normal
})

defineEmits(['click']) // 定義 click 事件

</script>

<template>
  <Tooltip :disabled="!keyboard" :title="`${keyboard}`"> <!-- 顯示 Tooltip 提示快捷鍵 -->
    <div class="base-button"
         v-bind="$attrs"
         @click="e => (!disabled && !loading) && $emit('click',e)"
         :class="[
             active && 'active',
             size,
             type,
             (disabled||loading) && 'disabled',
         ]"> <!-- 綁定樣式類別 -->
      <span :style="{opacity:loading?0:1}"><slot></slot></span> <!-- 按鈕內容插槽，加載時隱藏 -->
      <IconEosIconsLoading
          v-if="loading"
          class="loading"
          width="18"
          :color="type === 'info'?'#000000':'#ffffff'"
      /> <!-- 加載圖示 -->
    </div>
  </Tooltip>
</template>

<style scoped lang="scss">

.base-button {
  cursor: pointer; // 滑鼠游標為手指
  box-sizing: border-box; // 盒模型
  display: inline-flex; // 行內 Flex
  align-items: center; // 垂直居中
  justify-content: center; // 水平居中
  outline: none; // 無輪廓線
  text-align: center; // 文字居中
  transition: .1s; // 過渡效果
  user-select: none; // 禁止選中文字
  vertical-align: middle; // 垂直對齊
  white-space: nowrap; // 不換行
  border-radius: .3rem; // 圓角
  padding: 0 0.9rem; // 內邊距
  font-size: .9rem; // 字體大小
  height: 2rem; // 高度
  color: white; // 字體顏色

  & + .base-button { // 相鄰按鈕間距
    margin-left: 1rem;
  }

  .loading { // 加載圖示樣式
    position: absolute; // 絕對定位
  }

  &.disabled { // 禁用狀態
    opacity: .6; // 透明度
    cursor: not-allowed; // 禁止圖示
    user-select: none; // 禁止選中
  }

  &.small { // 小尺寸
    border-radius: 0.3rem;
    padding: 0 0.6rem;
    height: 1.6rem;
    font-size: .8rem;
  }

  &.large { // 大尺寸
    padding: 0 1.3rem;
    height: 2.4rem;
    font-size: 0.9rem;
    border-radius: .5rem;
  }

  & > span { // 內容 span
    line-height: 1;
    transform: translateY(-5%); // 微調垂直位置

    :deep(a) { // 內部連結樣式
      color: white;
    }
  }

  &.primary { // 主要按鈕樣式
    background: var(--btn-primary);

    &:hover:not(.disabled) {
      opacity: 0.6;
    }
  }

  &.link { // 連結按鈕樣式
    border-radius: 0;
    border-bottom: 2px solid transparent;

    &:hover:not(.disabled) {
      border-bottom: 2px solid var(--color-font-2);
    }
  }

  &.info { // 資訊按鈕樣式
    background: var(--btn-info);
    border: 1px solid var(--color-main-text);
    color: var(--color-main-text);

    &:hover:not(.disabled) {
      opacity: 0.6;
    }
  }

  &.orange { // 橙色按鈕樣式
    background: #FACC15;
    color: black;

    &:hover:not(.disabled) {
      background: #fbe27e;
      color: rgba(0, 0, 0, 0.6);
    }
  }

  &.active { // 激活狀態
    opacity: .4;
  }
}
</style>
