<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue';

interface IProps {
  src?: string;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number; // 0-1
  currentTime?: number;
  playbackRate?: number;
  disabled?: boolean;

}

const props = withDefaults(defineProps<IProps>(), {
  autoplay: false,
  loop: false,
  volume: 1,
  currentTime: 0,
  playbackRate: 1,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'ended'): [],
  (e: 'update-volume', volume: number): void,
  (e: 'update-speed', volume: number): void
}>();

const attrs = useAttrs();

// 音頻元素引用
const audioRef = ref<HTMLAudioElement>();
const progressBarRef = ref<HTMLDivElement>();
const volumeBarRef = ref<HTMLDivElement>();
const volumeFillRef = ref<HTMLElement>();

// 狀態管理
const isPlaying = ref(false);
const isLoading = ref(false);
const duration = ref(0);
const currentTime = ref(0);
// const volume = ref(props.volume);
const volume = ref(props.volume);
const playbackRate = ref<number>(props.playbackRate);
const isDragging = ref(false);
const isVolumeDragging = ref(false);
const isVolumeHovering = ref(false); // 添加音量控制hover狀態變數
const volumePosition = ref('top') // 音量控制位置，'top'或'down'
const error = ref('');

// 計算屬性
const progress = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0;
});

const volumeProgress = computed(() => {
  return volume.value * 100;
});

const formatTime = (time: number) => {
  if (!isFinite(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// 播放控制
const togglePlay = async () => {
  if (!audioRef.value || props.disabled) return;

  try {
    if (isPlaying.value) {
      audioRef.value.pause();
    } else {
      await audioRef.value.play();
    }
  } catch (err) {
    console.error('播放失敗:', err);
    error.value = '播放失敗';
  }
};

const toggleMute = () => {
  if (!audioRef.value || props.disabled) return;

  if (volume.value > 0) {
    volume.value = 0;
    audioRef.value.volume = 0;
  } else {
    volume.value = 1;
    audioRef.value.volume = 1;
  }
  emit('update-volume', Math.floor(volume.value * 100));
};

const changePlaybackRate = () => {
  if (!audioRef.value || props.disabled) return;
  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const currentIndex = rates.indexOf(playbackRate.value);
  const nextIndex = (currentIndex + 1) % rates.length;
  playbackRate.value = rates[nextIndex] ?? 1;
  audioRef.value.playbackRate = playbackRate.value;
  // 提交更新播放速度事件
  emit('update-speed', playbackRate.value);
};

// 事件處理
const handleLoadStart = () => {
  isLoading.value = true;
};

const handleLoadedData = () => {
  isLoading.value = false;
};

const handleLoadedMetadata = () => {
  if (audioRef.value) {
    audioRef.value.volume = volume.value;
  }

  duration.value = audioRef.value?.duration || 0;
};

const handleCanPlayThrough = () => {
};

const handlePlay = () => {
  isPlaying.value = true;
};

const handlePause = () => {
  isPlaying.value = false;
};

const handleEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
  emit('ended');
};

const handleError = (e: Event) => {
  const target = e.target as HTMLAudioElement;
  if (!props.src || (target && target.error?.code === 4 && !target.currentSrc)) return;

  error.value = '音頻加載失敗';
  isLoading.value = false;
};

const handleTimeUpdate = () => {
  if (audioRef.value && !isDragging.value) {
    currentTime.value = audioRef.value.currentTime;
  }
};

const handleVolumeChange = () => {
  if (audioRef.value && !isVolumeDragging.value) {
    volume.value = audioRef.value.volume;
  }
};

const handleRateChange = () => {
  if (audioRef.value) {
    playbackRate.value = audioRef.value.playbackRate;
  }
};

// 進度條處理
const handleProgressMouseDown = (event: MouseEvent) => {
  if (!audioRef.value || !progressBarRef.value || props.disabled) return;

  event.preventDefault();
  event.stopPropagation();

  const rect = progressBarRef.value.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  let hasMoved = false;
  let lastPosition = 0; // 記錄最後的位置
  const moveThreshold = 3; // 移動閾值，超過這個距離才認為是拖曳

  // 獲取DOM元素引用
  const progressFill = progressBarRef.value.querySelector('.progress-fill') as HTMLElement;
  const progressThumb = progressBarRef.value.querySelector('.progress-thumb') as HTMLElement;

  // 立即跳轉到點擊位置
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  const newTime = percentage * duration.value;

  // 直接更新DOM樣式
  if (progressFill && progressThumb) {
    progressFill.style.width = `${percentage * 100}%`;
    progressThumb.style.left = `${percentage * 100}%`;
  }

  audioRef.value.currentTime = newTime;
  currentTime.value = newTime;
  lastPosition = newTime;
  isDragging.value = true;

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      hasMoved = true;
    }

    if (!hasMoved) return;

    // 禁用過渡動畫
    if (progressFill && progressThumb) {
      progressFill.style.transition = 'none';
      progressThumb.style.transition = 'none';
    }

    const rect = progressBarRef.value!.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration.value;

    // 直接更新DOM樣式，不使用響應式變數
    if (progressFill && progressThumb) {
      progressFill.style.width = `${percentage * 100}%`;
      progressThumb.style.left = `${percentage * 100}%`;
    }

    // 只更新響應式變數用於時間顯示，不用於樣式
    currentTime.value = newTime;
    lastPosition = newTime;
  };

  const handleMouseUp = () => {
    isDragging.value = false;

    // 恢復過渡動畫
    if (progressFill && progressThumb) {
      progressFill.style.transition = '';
      progressThumb.style.transition = '';
    }

    // 如果是拖曳，在結束時更新audio元素到最終位置
    if (hasMoved && audioRef.value) {
      audioRef.value.currentTime = lastPosition;
    }

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 音量控制處理
const handleVolumeMouseDown = (event: MouseEvent) => {
  if (!audioRef.value || !volumeBarRef.value || props.disabled) return;

  event.preventDefault();
  event.stopPropagation();

  const rect = volumeBarRef.value.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  let hasMoved = false;
  let lastVolume = 0; // 記錄最後音量
  const moveThreshold = 3; // 超過這個距離才認為是拖曳

  const volumeFill = volumeFillRef.value;

  // 計算點擊位置對應音量百分比（最上 100%，最下 0%）
  const clickY = event.clientY - rect.top;
  const percentage = 1 - Math.max(0, Math.min(1, clickY / rect.height));

  // 更新 UI 與音量
  if (volumeFill) {
    volumeFill.style.height = `${percentage * 100}%`;
  }

  volume.value = percentage;
  audioRef.value.volume = percentage;
  lastVolume = percentage;
  isVolumeDragging.value = true;

  // 滑鼠移動時調整音量
  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      hasMoved = true;
    }

    if (!hasMoved) return;

    // 禁用過渡動畫
    if (volumeFill) {
      volumeFill.style.transition = 'none';
    }

    const rect = volumeBarRef.value!.getBoundingClientRect();
    const moveY = e.clientY - rect.top;
    const percentage = 1 - Math.max(0, Math.min(1, moveY / rect.height));

    if (volumeFill) {
      volumeFill.style.height = `${percentage * 100}%`;
    }

    volume.value = percentage;
    lastVolume = percentage;
    if (audioRef.value) {
      audioRef.value.volume = percentage;
    }
  };

  // 滑鼠釋放時結束拖動
  const handleMouseUp = () => {
    isVolumeDragging.value = false;

    // 恢復過渡動畫
    if (volumeFill) {
      volumeFill.style.transition = '';
    }

    if (hasMoved && audioRef.value) {
      audioRef.value.volume = lastVolume;
    }
    // 提交更新音量事件
    emit('update-volume', Math.floor(volume.value * 100));

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 音量控制滑鼠移入事件，自動調整音量控制條位置
const onVolumeSectionEnter = (e: MouseEvent) => {
  isVolumeHovering.value = true;
  const section = e.target as HTMLElement
  const top = section.getBoundingClientRect().top + window.scrollY
  const dropdown = section.querySelector('.volume-dropdown')
  if (!dropdown) return
  const dropdownH = dropdown.clientHeight
  if (top < dropdownH * 1.25) {
    volumePosition.value = 'down'
  } else {
    volumePosition.value = 'top'
  }
}


// 監聽屬性變化
watch(() => props.src, (newSrc) => {
  if (audioRef.value) {
    // 重置所有狀態
    isPlaying.value = false;
    isLoading.value = false;
    currentTime.value = 0;
    duration.value = 0;
    error.value = '';

    if (newSrc) {
      audioRef.value.src = newSrc;
      audioRef.value.load();
    } else {
      // 如果src為空，清空音頻源
      audioRef.value.removeAttribute('src');
      audioRef.value.load();
    }
  }
});

watch(() => props.volume, (newVolume) => {
  volume.value = newVolume;
  if (audioRef.value) {
    audioRef.value.volume = newVolume;
  }
});

watch(() => props.currentTime, (newTime) => {
  if (audioRef.value && !isDragging.value) {
    audioRef.value.currentTime = newTime;
    currentTime.value = newTime;
  }
});

watch(() => props.playbackRate, (newRate) => {
  playbackRate.value = newRate;
  if (audioRef.value) {
    audioRef.value.playbackRate = newRate;
  }
});

defineExpose({ audioRef })
</script>

<template>
  <div class="custom-audio" :class="{ 'disabled': disabled || error, 'has-error': error }" v-bind="attrs">
    <!-- 隱藏的原生audio元素 -->
    <audio ref="audioRef" :src="src" preload="auto" :autoplay="autoplay" :loop="loop" :controls="false"
      @loadstart="handleLoadStart" @loadeddata="handleLoadedData" @loadedmetadata="handleLoadedMetadata"
      @canplaythrough="handleCanPlayThrough" @play="handlePlay" @pause="handlePause" @ended="handleEnded"
      @error="handleError" @timeupdate="handleTimeUpdate" @volumechange="handleVolumeChange"
      @ratechange="handleRateChange" />

    <!-- 自定義控制介面 -->
    <div class="audio-container">
      <!-- 播放/暫停按鈕 -->
      <button class="play-button" :class="{ 'loading': isLoading }" @click="togglePlay" :disabled="disabled"
        :aria-label="isPlaying ? '暫停' : '播放'">
        <div v-if="isLoading" class="loading-spinner"></div>
        <IconFluentPause20Regular v-else-if="isPlaying" class="icon" />
        <IconFluentPlay20Regular v-else class="icon" />
      </button>

      <!-- 進度條區域 -->
      <div class="progress-section">
        <!-- 時間顯示 -->
        <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        <!-- 進度條 -->
        <div class="progress-container" @mousedown="handleProgressMouseDown" ref="progressBarRef">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            <div class="progress-thumb" :style="{ left: progress + '%' }"></div>
          </div>
        </div>

      </div>

      <!-- 音量控制 -->
      <div class="volume-section" @mouseenter="onVolumeSectionEnter" @mouseleave="isVolumeHovering = false">
        <button class="volume-button" tabindex="-1" @click="toggleMute" :disabled="disabled"
          :aria-label="volume > 0 ? '靜音' : '取消靜音'">
          <IconBxVolumeMute v-if="volume === 0" class="icon"></IconBxVolumeMute>
          <IconBxVolumeLow v-else-if="volume < 0.5" class="icon"></IconBxVolumeLow>
          <IconBxVolumeFull v-else class="icon"></IconBxVolumeFull>
        </button>

        <!-- 音量下拉控制條 -->
        <div class="volume-dropdown" :class="[{ 'active': isVolumeHovering || isVolumeDragging }, volumePosition]">
          <div class="volume-container" @mousedown="handleVolumeMouseDown" ref="volumeBarRef">
            <div class="volume-track">
              <div class="volume-fill" ref="volumeFillRef" :style="{ height: volumeProgress + '%', bottom: 0 }"></div>
            </div>
            <div class="volume-num">
              <span>{{ Math.floor(volumeProgress) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 播放速度控制 -->
      <button class="speed-button" @click="changePlaybackRate" :disabled="disabled"
        :aria-label="`播放速度: ${playbackRate}x`">
        {{ playbackRate }}x
      </button>
    </div>

    <!-- 錯誤訊息 -->
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<style scoped lang="scss">
.custom-audio {
  --audio-border-radius: 8px;
  --audio-box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
  --audio-button-bg: rgba(255, 255, 255, 0.2);
  --audio-thumb-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  --audio-volume-thumb-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  --audio-speed-button-border: rgba(255, 255, 255, 0.3);
  --audio-error-bg: #f56c6c;
  --height: 32px;
  --gap: 8px;

  display: inline-block;
  box-sizing: border-box;
  width: 100%;
  max-width: 600px;
  background: var(--color-primary);
  border-radius: var(--audio-border-radius);
  box-shadow: var(--audio-box-shadow);
  color: var(--color-reverse-black);
  transition: all 0.3s ease;
  font-family: var(--font-family);
  padding: 0.3rem 0.4rem;
  position: relative;

  &.disabled {
    pointer-events: none;
  }

  &.has-error {
    border: 1px solid var(--audio-error-bg);
  }
}

.audio-container {
  display: flex;
  align-items: center;
  gap: var(--gap);
}

.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--height);
  height: var(--height);
  color: var(--color-reverse-black);
  border-radius: 50%;
  background: var(--color-second);
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  border: 1px solid var(--audio-speed-button-border);

  &:hover {
    background: var(--color-card-active) !important;
  }

  &.loading {
    background: var(--audio-button-bg);
  }

  .icon {
    width: 20px;
    height: 20px;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

.progress-section {
  display: flex;
  align-items: center;
  gap: var(--gap);
  flex: 1;
  min-width: 0;
}

.time-display {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.8;
  white-space: nowrap;
  text-align: center;
}

.progress-container {
  flex: 1;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 0;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 6px;
  background: var(--color-second);
  border-radius: 2px;
}

.progress-fill {
  height: 100%;
  background: var(--color-fourth);
  border-radius: 2px;
  transition: width 0.1s ease;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: var(--color-fourth);
  border-radius: 50%;
  box-shadow: var(--audio-thumb-shadow);
  cursor: grab;
  opacity: 1;
  transition: all 0.2s ease;

  &:active {
    cursor: grabbing;
  }
}

.volume-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  position: relative;
}

.volume-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--height);
  height: var(--height);
  border-radius: 4px;
  background: var(--color-second);
  cursor: pointer;
  color: var(--color-reverse-black);
  transition: all 0.2s ease;
  border: 1px solid var(--audio-speed-button-border);

  &:hover {
    background: var(--color-card-active);
  }

  .icon {
    width: 16px;
    height: 16px;
  }
}

.volume-dropdown {
  position: absolute;
  background: var(--color-primary);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 10;

  &.active {
    opacity: 1;
    visibility: visible;
  }

  &.top {
    bottom: 42px;
  }

  &.down {
    top: 42px;
  }
}

.volume-container {
  width: 24px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px 0;
}

.volume-track {
  position: relative;
  width: 6px;
  height: 100%;
  background: var(--color-second);
  border-radius: 6px;
  // overflow: hidden;
}

.volume-num {
  display: flex;
  position: absolute;
  bottom: 0;
  font-size: 12px;
  color: #333;
  transform: scale(0.85);
  line-height: normal;
}

.volume-fill {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: var(--fill-height);
  background: var(--color-fourth);
  border-radius: 6px;
  display: flex;
  justify-content: center;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background: var(--color-fourth);
    transform: translateY(-50%);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
    cursor: grab;
  }
}

.speed-button {
  padding: 0 0.5rem;
  border: 1px solid var(--audio-speed-button-border);
  border-radius: 4px;
  background: var(--color-second);
  height: var(--height);
  cursor: pointer;
  color: var(--color-reverse-black);
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-card-active);
  }
}

.error-message {
  position: absolute;
  right: 0;
  left: 2.6rem;
  top: 0;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--audio-error-bg);
  color: var(--color-reverse-white);
  font-size: 12px;
  border-radius: var(--audio-border-radius);
}

// 動畫
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
