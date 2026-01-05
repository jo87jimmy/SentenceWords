<script setup lang="ts">
import BaseIcon from "@/components/BaseIcon.vue";
import { ref } from "vue";

const props = withDefaults(defineProps<{
  time?: number,
  simple?: boolean
  title?: string
  cb?: Function
}>(), {
  time: 300,
  simple: false
})
const emit = defineEmits(['click'])

let step = ref(2)
let count = ref(0)

function play(time = props.time, reset = false) {
  if (reset) {
    step.value = 2
    count.value = 0
  }
  if (count.value === 0) {
    props?.cb?.()
  }
  count.value++
  setTimeout(() => {
    if (step.value === 2) {
      if (count.value === 1) {
        step.value = 0
        play(time + 100)
      } else {
        count.value = 0
      }
    } else {
      step.value++
      play(time + 100)
    }
  }, time)
}

function click() {
  emit('click')
  play()
}

defineExpose({play})

</script>

<template>
  <template v-if="props.simple">
    <BaseIcon
        :title="title"
        @click.stop="click"
              no-bg
    >
      <IconBxVolume v-if="step === 0"/>
      <IconBxVolumeLow v-if="step === 1"/>
      <IconBxVolumeFull v-if="step === 2"/>
    </BaseIcon>
  </template>
  <template v-else>
    <BaseIcon
        :title="title"
        @click.stop="click"
    >
      <IconBxVolume v-if="step === 0"/>
      <IconBxVolumeLow v-if="step === 1"/>
      <IconBxVolumeFull v-if="step === 2"/>
    </BaseIcon>
  </template>
</template>

<style scoped lang="scss">
</style>
