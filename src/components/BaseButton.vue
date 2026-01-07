<script setup lang="ts">
import Tooltip from "@/components/base/Tooltip.vue";
import Button from 'primevue/button';

interface IProps {
  keyboard?: string,
  active?: boolean
  disabled?: boolean
  loading?: boolean
  size?: 'small' | 'normal' | 'large',
  type?: 'primary' | 'link' | 'info' | 'orange'
}

withDefaults(defineProps<IProps>(), {
  type: 'primary',
  size: 'normal',
})

defineEmits(['click'])

</script>

<template>
  <Tooltip :disabled="!keyboard" :title="`${keyboard}`">
    <Button
        v-bind="$attrs"
        @click="!disabled && !loading && $emit('click', $event)"
        :disabled="disabled || loading"
        class="base-button border-none focus:ring-0 transition-opacity duration-100"
        :class="[
           // Common
           'cursor-pointer box-border inline-flex items-center justify-center text-center select-none align-middle whitespace-nowrap',
           
           // Active
           active ? 'opacity-40' : '',
           
           // Size: Normal
           size === 'normal' ? 'h-[2rem] px-[0.9rem] text-[0.9rem] rounded-[0.3rem]' : '',
           // Size: Small
           size === 'small' ? 'h-[1.6rem] px-[0.6rem] text-[0.8rem] rounded-[0.3rem]' : '',
           // Size: Large
           size === 'large' ? 'h-[2.4rem] px-[1.3rem] text-[0.9rem] rounded-[0.5rem]' : '',

           // Type: Primary
           type === 'primary' ? 'bg-[var(--btn-primary)] text-white hover:opacity-60' : '',
           
           // Type: Link
           type === 'link' ? '!bg-transparent text-white rounded-none border-b-2 border-transparent hover:border-[var(--color-font-2)] !p-0 h-auto' : '',
           
           // Type: Info
           type === 'info' ? 'bg-[var(--btn-info)] border !border-solid border-[var(--color-main-text)] text-[var(--color-main-text)] hover:opacity-60' : '',
           
           // Type: Orange
           type === 'orange' ? 'bg-[#FACC15] text-black hover:bg-[#fbe27e] hover:text-black/60' : '',
           
           // Disabled state handled by PrimeVue but we can enforce styles if needed, 
           // though PrimeVue usually handles disabled opacity. 
           // Original had custom disabled style: opacity: .6; cursor: not-allowed;
           (disabled || loading) ? '!opacity-60 !cursor-not-allowed' : ''
        ]"
    >
      <span :class="{'opacity-0': loading}" class="leading-none transform -translate-y-[5%]">
        <slot></slot>
      </span>
      <IconEosIconsLoading
          v-if="loading"
          class="absolute"
          width="18"
          :color="type === 'info' ? '#000000' : '#ffffff'"
      />
    </Button>
  </Tooltip>
</template>

<style scoped lang="scss">
// Maintain sibling margin behavior
.base-button + .base-button {
  margin-left: 1rem;
}

// Deep selector for links inside the button (from original SCSS)
.base-button :deep(a) {
  color: white;
}
</style>
