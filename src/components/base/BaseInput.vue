<script setup lang="ts">
import { ref, useAttrs, watch, computed} from 'vue'; // 引入 Vue API
import Close from "@/components/icon/Close.vue"; // 引入 Close 圖標組件
import {useDisableEventListener} from "@/hooks/event.ts"; // 引入禁用事件監聽 Hook

defineOptions({ // 定義組件選項
  name: "BaseInput", // 組件名稱
})

const props = defineProps({ // 定義 Props
  modelValue: [String, Number], // 綁定值
  placeholder: String, // 佔位符
  disabled: Boolean, // 是否禁用
  autofocus: Boolean, // 是否自動聚焦
  error: Boolean, // 是否顯示錯誤狀態
  type: { // 輸入框類型
    type: String,
    default: 'text', // 預設為文本輸入
  },
  clearable: { // 是否可清空
    type: Boolean,
    default: false,
  },
  required: { // 是否必填
    type: Boolean,
    default: false,
  },
  maxLength: Number, // 最大長度
  size: { // 尺寸
    type: String,
    default: 'normal',
    validator: (value: string) => ['normal', 'large'].includes(value) // 驗證尺寸值
  },
});

const emit = defineEmits(['update:modelValue', 'input', 'change', 'focus', 'blur', 'validation', 'enter']); // 定義 Emits
const attrs = useAttrs(); // 獲取組件屬性

const inputValue = ref(props.modelValue); // 內部輸入值 ref
let focus = ref(false) // 聚焦狀態
const passwordVisible = ref(false) // 密碼可見狀態

const inputType = computed(() => { // 計算當前輸入框類型
  if (props.type === 'password') { // 如果是密碼類型
    return passwordVisible.value ? 'text' : 'password' // 根據可見狀態切換
  }
  return props.type // 其他類型直接返回
})

const togglePasswordVisibility = () => { // 切換密碼可見性
  passwordVisible.value = !passwordVisible.value
}

watch(() => props.modelValue, (val) => { // 監聽綁定值變化
  inputValue.value = val;
});

const onInput = (e: Event) => { // 輸入事件處理
  const target = e.target as HTMLInputElement;
  inputValue.value = target.value;
  emit('update:modelValue', target.value); // 更新父組件綁定值
  emit('input', e);
  emit('change', e);
};

const onChange = (e: Event) => { // 變更事件處理
  emit('change', e);
};

const onFocus = (e: FocusEvent) => { // 聚焦事件處理
  focus.value = true
  emit('focus', e);
};

const onBlur = (e: FocusEvent) => { // 失焦事件處理
  focus.value = false
  emit('blur', e);
};

const onEnter = (e: KeyboardEvent) => { // Enter 鍵處理
  emit('enter', e);
};

const clearInput = () => { // 清空輸入
  inputValue.value = '';
  emit('update:modelValue', '');
};

//當聚焦時，禁用輸入監聽
useDisableEventListener(() => focus) // 使用 Hook 在聚焦時禁用其他全局事件監聽

const vFocus = { // 自定義聚焦指令
  mounted: (el:any, bind:any) => {
    if (bind.value) {
      el.focus()
      setTimeout(() => focus.value = true) // 延遲設置聚焦狀態
    }
  }
}

</script>

<template>
  <div class="base-input"
       ref="inputEl"
       :class="{ 'is-disabled': disabled, 'error': props.error, focus, [`base-input--${size}`]: true }"> <!-- 容器樣式綁定 -->
    <slot name="subfix"></slot> <!-- 後綴插槽 (命名 subfix 可能有誤，通常為 suffix，暫保留) -->
    <!-- PreIcon slot -->
    <div v-if="$slots.preIcon" class="pre-icon"> <!-- 前綴圖標容器 -->
      <slot name="preIcon"></slot> <!-- 前綴插槽 -->
    </div>
    <IconFluentLockClosed20Regular class="pre-icon" v-if="type === 'password'"/> <!-- 密碼類型圖標 -->
    <IconFluentMail20Regular class="pre-icon" v-if="type === 'email'"/> <!-- 郵件類型圖標 -->
    <IconFluentPhone20Regular class="pre-icon" v-if="type === 'tel'"/> <!-- 電話類型圖標 -->
    <IconFluentNumberSymbol20Regular class="pre-icon" v-if="type === 'code'"/> <!-- 驗證碼類型圖標 -->

    <input
      v-bind="attrs"
      :type="inputType"
      :placeholder="placeholder"
      :disabled="disabled"
      :value="inputValue"
      @input="onInput"
      @change="onChange"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.enter="onEnter"
      class="inner"
      v-focus="autofocus"
      :maxlength="maxLength"
    /> <!-- 輸入框元素 -->
    <slot name="prefix"></slot> <!-- 前綴插槽 (位置可能在後？命名 prefix 通常在前，但這裡放後面) -->
    <Close
      v-if="clearable && inputValue && !disabled"
      @click="clearInput"/> <!-- 清除按鈕 -->
    <!-- Password visibility toggle -->
    <div
      v-if="type === 'password' && !disabled"
      class="password-toggle"
      @click="togglePasswordVisibility"
      :title="passwordVisible ? '隱藏密碼' : '顯示密碼'"> <!-- 密碼可見性切換按鈕，TC 翻譯 -->
      <IconFluentEye16Regular v-if="!passwordVisible"/> <!-- 顯示密碼圖標 -->
      <IconFluentEyeOff16Regular v-else/> <!-- 隱藏密碼圖標 -->
    </div>
  </div>
</template>

<style scoped lang="scss">
.base-input {
  position: relative; // 相對定位
  display: inline-flex; // 行內 Flex
  box-sizing: border-box; // 盒模型
  width: 100%; // 寬度 100%
  border: 1px solid var(--color-input-border); // 邊框
  border-radius: 6px; // 圓角
  overflow: hidden; // 溢出隱藏
  padding: .2rem .3rem; // 內邊距
  transition: all .3s; // 過渡
  align-items: center; // 垂直居中
  background: var(--color-input-bg); // 背景色

  ::placeholder { // 佔位符樣式
    font-size: 0.9rem;
    color: darkgray;
  }

  // normal size (default)
  &--normal {
    padding: .2rem .3rem;

    .inner {
      height: 1.5rem;
      font-size: 1rem;
    }
  }

  // large size
  &--large {
    padding: .4rem .6rem;
    border-radius: .5rem;

    .inner {
      height: 2rem;
      font-size: 1.125rem;
    }
  }

  &.is-disabled { // 禁用狀態
    opacity: 0.6;
  }

  &.error { // 錯誤狀態
    border-color: #f56c6c;
    background: rgba(245, 108, 108, 0.07);
  }

  &.focus { // 聚焦狀態
    border: 1px solid var(--color-select-bg);
  }

  &:disabled { // Input 禁用
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  // PreIcon styling
  &.has-preicon {
    .inner {
      padding-left: 2rem; // 留出圖標空間
    }
  }

  .pre-icon { // 前綴圖標樣式
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-input-color);
    opacity: 0.6;
    z-index: 1;
    pointer-events: none;
    margin-right: 0.2rem;
  }

  .inner { // 內部 Input 樣式
    flex: 1;
    font-size: 1rem;
    outline: none;
    border: none;
    box-sizing: border-box;
    transition: all .3s;
    height: 1.5rem;
    color: var(--color-input-color);
    background: transparent;
    width: 100%;
  }

  .password-toggle { // 密碼切換按鈕樣式
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-left: 4px;
    cursor: pointer;
    color: var(--color-input-color);
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
