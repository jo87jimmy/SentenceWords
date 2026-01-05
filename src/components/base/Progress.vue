<script setup lang="ts">
import { computed } from 'vue'; // 引入 computed API

interface IProps { // 定義 Props 介面
  percentage: number; // 進度百分比
  showText?: boolean; // 是否顯示文字
  textInside?: boolean; // 文字是否在進度條內部
  strokeWidth?: number; // 進度條寬度
  color?: string; // 顏色
  format?: (percentage: number) => string; // 格式化函數
  size?: 'normal' | 'large'; // 尺寸
}

const props = withDefaults(defineProps<IProps>(), { // 設置 Prop 預設值
  showText: true, // 預設顯示文字
  textInside: false, // 預設文字在外部
  strokeWidth: 6, // 預設寬度 6
  color: '#409eff', // 預設顏色藍色
  format: (percentage: number) => `${percentage}%`, // 預設格式化為百分比
  size: 'normal', // 預設尺寸正常
});

const barStyle = computed(() => { // 計算進度條內部樣式
  return {
    width: `${props.percentage}%`, // 寬度為百分比
    backgroundColor: props.color, // 背景色
  };
});

const trackStyle = computed(() => { // 計算軌道樣式
  const height = props.size === 'large' ? props.strokeWidth * 2.5 : props.strokeWidth; // 大尺寸時增加高度
  return {
    height: `${height}px`, // 設置高度
  };
});

const progressTextSize = 18 // 文字大小變數

const content = computed(() => { // 計算顯示內容
  if (typeof props.format === 'function') { // 如果有自定義格式化函數
    return props.format(props.percentage) || ''; // 使用函數
  } else {
    return `${props.percentage}%`; // 默認百分比
  }
});
</script>

<template>
  <div class="progress" role="progressbar" :aria-valuenow="percentage" aria-valuemin="0" aria-valuemax="100"> <!-- 進度條容器 -->
    <div class="progress-bar" :style="trackStyle"> <!-- 軌道 -->
      <div class="progress-bar-inner" :style="barStyle"> <!-- 進度條 -->
        <div v-if="showText && textInside" class="progress-bar-text" :style="{ fontSize: progressTextSize + 'px' }"> <!-- 內部文字 -->
          {{ content }}
        </div>
      </div>
    </div>
    <div v-if="showText && !textInside" class="progress-bar-text" :style="{ fontSize: progressTextSize + 'px' }"> <!-- 外部文字 -->
      {{ content }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.progress { // 容器樣式
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;

  .progress-bar { // 軌道樣式
    width: 100%;
    border-radius: 100px;
    background-color: var(--color-progress-bar);
    overflow: hidden;
    position: relative;
    vertical-align: middle;

    .progress-bar-inner { // 進度條內部樣式
      position: relative;
      height: 100%;
      border-radius: 100px;
      transition: width 0.6s ease;
      text-align: right;

      .progress-bar-text { // 內部文字樣式
        display: inline-block;
        vertical-align: middle;
        color: #fff;
        font-size: 12px;
        margin: 0 5px;
        white-space: nowrap;
      }
    }
  }

  .progress-bar-text { // 外部文字樣式
    margin-left: 5px;
    min-width: 50px;
    color: var(--el-text-color-regular);
    font-size: 14px;
    text-align: center;
    flex-shrink: 0;
  }
}
</style>
