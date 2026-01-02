<template>
  <Transition name="message-fade" appear> <!-- 使用 Transition 組件實現淡入淡出動畫 -->
    <div v-if="visible" class="message" :class="type" :style="style" @mouseenter="handleMouseEnter"
         @mouseleave="handleMouseLeave"> <!-- 訊息框容器，綁定樣式和滑鼠事件 -->
      <div class="message-content"> <!-- 內容區域 -->
        <!-- 根據類型顯示不同的圖示 -->
        <IconFluentCheckmarkCircle20Filled v-if="props.type === 'success'" class="message-icon"/>
        <IconFluentErrorCircle20Filled v-if="props.type === 'warning'" class="message-icon"/>
        <IconFluentErrorCircle20Filled v-if="props.type === 'info'" class="message-icon"/>
        <IconFluentDismissCircle20Filled v-if="props.type === 'error'" class="message-icon"/>
        <span class="message-text">{{ message }}</span> <!-- 顯示訊息文本 -->
        <Close v-if="showClose" class="message-close" @click="close"/> <!-- 關閉按鈕 -->
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue' // 引入 Vue API

interface Props { // 定義 Props 介面
  message: string // 訊息內容
  type?: 'success' | 'warning' | 'info' | 'error' // 訊息類型
  duration?: number // 顯示時長
  showClose?: boolean // 是否顯示關閉按鈕
}

const props = withDefaults(defineProps<Props>(), { // 定義 Props 並設定預設值
  type: 'info',
  duration: 3000, // 預設 3 秒
  showClose: false
})

const emit = defineEmits(['close']) // 定義發送的事件
const visible = ref(false) // 控制顯示隱藏的響應式變量
let timer = null // 定時器變量

const style = computed(() => ({
  // 移除 offset，現在由父層容器管理位置
}))

const startTimer = () => { // 開始計時器
  if (props.duration > 0) { // 如果時長大於 0
    timer = setTimeout(close, props.duration) // 設定定時關閉
  }
}

const clearTimer = () => { // 清除計時器
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

const handleMouseEnter = () => { // 滑鼠移入時暫停計時
  clearTimer()
}

const handleMouseLeave = () => { // 滑鼠移出時恢復計時
  startTimer()
}

const close = () => { // 關閉函數
  visible.value = false // 隱藏
  // 延遲發出 close 事件，等待動畫完成
  setTimeout(() => {
    emit('close')
  }, 300) // 等待動畫完成（0.3秒）
}

onMounted(() => { // 組件掛載後
  visible.value = true // 顯示
  startTimer() // 開始計時
})

onBeforeUnmount(() => { // 組件卸載前
  clearTimer() // 清除計時器
})

// 暴露方法給父組件
defineExpose({
  close,
  show: () => {
    visible.value = true
    startTimer()
  }
})
</script>

<style scoped lang="scss">
.message { // 訊息框基本樣式
  position: relative;
  min-width: 16rem;
  padding: 0.8rem 1rem;
  border-radius: 0.2rem;
  box-shadow: 0 0.2rem 0.9rem rgba(0, 0, 0, 0.15);
  background: white;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
  pointer-events: auto;

  &.success { // 成功樣式
    background: #f0f9ff;
    border-color: #67c23a;
    color: #67c23a;
  }

  &.warning { // 警告樣式
    background: #fdf6ec;
    border-color: #e6a23c;
    color: #e6a23c;
  }

  &.info { // 資訊樣式
    background: #f4f4f5;
    border-color: #909399;
    color: #909399;
  }

  &.error { // 錯誤樣式
    background: #fef0f0;
    border-color: #f56c6c;
    color: #f56c6c;
  }
}

// 深色模式支持
html.dark {
  .message {
    background: var(--color-second);
    border-color: var(--color-item-border);
    color: var(--color-main-text);

    &.success {
      background: rgba(103, 194, 58, 0.1);
      border-color: #67c23a;
      color: #67c23a;
    }

    &.warning {
      background: rgba(230, 162, 60, 0.1);
      border-color: #e6a23c;
      color: #e6a23c;
    }

    &.info {
      background: rgba(144, 147, 153, 0.1);
      border-color: #909399;
      color: #909399;
    }

    &.error {
      background: rgba(245, 108, 108, 0.1);
      border-color: #f56c6c;
      color: #f56c6c;
    }
  }
}

.message-content { // 內容佈局
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-icon { // 圖示樣式
  font-size: 1.2rem;
}

.message-text { // 文本樣式
  flex: 1;
  font-size: 14px;
}

.message-close { // 關閉按鈕樣式
  cursor: pointer;
  font-size: 1.2rem;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
}

// Vue Transition 動畫
.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-enter-from {
  opacity: 0;
  transform: translateY(-40px);
}

.message-fade-leave-to {
  opacity: 0;
  transform: translateY(-40px);
}
</style>
