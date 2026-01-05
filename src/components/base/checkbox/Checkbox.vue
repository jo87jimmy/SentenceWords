<template>
  <label class="checkbox" @click.stop> <!-- 複選框標籤，阻止點擊冒泡 -->
    <input
        type="checkbox"
        :checked="modelValue"
        @change="change"
    /> <!-- 原生複選框輸入元素 (隱藏) -->
    <span class="checkbox-box"> <!-- 自定義複選框外觀 -->
      <span class="checkbox-inner"></span> <!-- 選中狀態的內部方塊 -->
    </span>
    <span class="checkbox-label"><slot/></span> <!-- 標籤文本插槽 -->
  </label>
</template>

<script setup lang="ts">
defineProps({ // 定義 Props
  modelValue: Boolean // 綁定值，布林類型
})

const emit = defineEmits(['update:modelValue', 'click', 'onChange']) // 定義 Emits

function change($event: Event) { // 變更處理函數
  emit('update:modelValue', ($event.target as HTMLInputElement).checked) // 更新綁定值
  emit('onChange', ($event.target as HTMLInputElement).checked) // 觸發 onChange 事件
}
</script>

<style lang="scss" scoped>
.checkbox { // 複選框容器樣式
  display: inline-flex; // 行內 Flex
  align-items: center; // 垂直居中
  cursor: pointer; // 手指游標
  user-select: none; // 禁止選中

  input { // 隱藏原生 Input
    display: none;
  }

  .checkbox-box { // 自定義框樣式
    position: relative; // 相對定位
    width: 16px; // 寬度
    height: 16px; // 高度
    border: 1px solid #dcdfe6; // 邊框
    border-radius: 2px; // 圓角
    background-color: #fff; // 背景白
    margin-right: 8px; // 右間距
    transition: all 0.3s; // 過渡動畫

    .checkbox-inner { // 內部選中標記
      position: absolute; // 絕對定位
      top: 3px; // 位置調整
      left: 3px;
      width: 10px; // 大小
      height: 10px;
      background-color: #409eff; // 選中顏色
      opacity: 0; // 默認隱藏
      transition: opacity 0.3s; // 透明度過渡
      border-radius: 1px; // 圓角
    }
  }

  input:checked + .checkbox-box .checkbox-inner { // 選中時顯示內部標記
    opacity: 1;
  }

  &:hover .checkbox-box { // 懸停時邊框變色
    border-color: #409eff;
  }

  .checkbox-label { // 標籤文本樣式
    font-size: 14px;
    color: #606266;
  }
}
</style>
