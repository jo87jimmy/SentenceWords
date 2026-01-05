<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, type PropType } from 'vue'
import BaseButton from "@/components/BaseButton.vue";

// 定義標題項目的接口
interface TitleItem {
  text: string;
  type: 'normal' | 'bold' | 'red' | 'redBold';
}

const props = defineProps({
  title: {
    type: [String, Array] as PropType<string | TitleItem[]>,
    default: '',
    validator(value: any) {
      // Validate that array items have the correct structure
      if (Array.isArray(value)) {
        return value.every(item => 
          typeof item === 'object' && 
          item !== null && 
          typeof item.text === 'string' &&
          ['normal', 'bold', 'red', 'redBold'].includes(item.type)
        )
      }
      return typeof value === 'string'
    }
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm'])

const show = ref(false)
const tipRef = ref<HTMLElement | null>(null) // 對應原有的 ref="tip"

const titleItems = computed<TitleItem[]>(() => {
  if (typeof props.title === 'string') {
    return [{ text: props.title, type: 'normal' }]
  }
  if (Array.isArray(props.title)) {
    return props.title as TitleItem[]
  }
  return []
})

const getTextStyle = (type: string) => {
  const styles: Record<string, any> = {
    normal: {
      fontWeight: 'normal',
      color: 'inherit'
    },
    bold: {
      fontWeight: 'bold',
      color: 'inherit'
    },
    red: {
      fontWeight: 'normal',
      color: 'red'
    },
    redBold: {
      fontWeight: 'bold',
      color: 'red'
    }
  }
  return styles[type] || styles.normal
}

const showPop = (e: Event) => {
  if (props.disabled) return emit('confirm')
  e?.stopPropagation()
  
  const target = e.target as HTMLElement
  let rect = target.getBoundingClientRect()
  
  show.value = true
  
  nextTick(() => {
    let tip = tipRef.value?.getBoundingClientRect()
    // console.log('rect', rect, tip)
    if (!tip || !tipRef.value) return
    
    // 計算位置
    if (rect.top < 150) {
      tipRef.value.style.top = rect.top + rect.height + tip.height + 30 + 'px'
    } else {
      tipRef.value.style.top = rect.top - 10 + 'px'
    }
    tipRef.value.style.left = rect.left + rect.width / 2 - 50 + 'px'
  })
}

const confirm = () => {
  show.value = false
  emit('confirm')
}

// 關閉彈窗
const close = () => {
  show.value = false
}

onMounted(() => {
  window.addEventListener('click', close)
  window.addEventListener('keydown', close)
})

onUnmounted(() => {
  window.removeEventListener('click', close)
  window.removeEventListener('keydown', close)
})
</script>

<template>
  <div class="pop-confirm leading-none" @click="showPop">
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="show" ref="tipRef" class="pop-confirm-content shadow-2xl">
          <div class="w-52 title-content">
            <div 
              v-for="(item, index) in titleItems"
              :key="index"
              :style="getTextStyle(item.type)"
              class="title-item"
            >
              {{ item.text }}
            </div>
          </div>
          <div class="options">
            <BaseButton type="info" size="small" @click.stop="show = false">取消</BaseButton>
            <BaseButton size="small" @click.stop="confirm()">確認</BaseButton>
          </div>
        </div>
      </Transition>
    </Teleport>
    
    <!-- 渲染默認插槽 -->
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
.pop-confirm-content {
  position: fixed;
  background: var(--color-tooltip-bg);
  padding: 1rem;
  border-radius: .6rem;
  transform: translate(-50%, calc(-100% - .6rem));
  z-index: 999;

  .title-content {
    .title-item {
      margin-bottom: 0.25rem;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .options {
    margin-top: .9rem;
    text-align: right;
  }
}
</style>
