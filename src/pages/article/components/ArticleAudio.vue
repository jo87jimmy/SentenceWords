<script setup lang="ts">
import { type Article } from "@/types/types.ts";
import { ref, watch } from "vue";
import { get } from "idb-keyval";
import Audio from "@/components/base/Audio.vue";
import { LOCAL_FILE_KEY } from "@/config/env.ts";

const props = defineProps<{
  article: Article
}>()

const emit = defineEmits<{
  (e: 'ended'): [],
  (e: 'update-volume', volume: number): void,
  (e: 'update-speed', volume: number): void
}>();

const file = ref<string | null>(null)
const instance = ref<InstanceType<typeof Audio> | null>(null)
const pendingUpdates = ref<Record<string, any>>({})

const handleVolumeUpdate = (volume: number) => {
  emit('update-volume', volume)
}

const handleSpeedUpdate = (speed: number) => {
  emit('update-speed', speed)
}

const setAudioRefValue = (key: string, value: any) => {
  if (instance.value?.audioRef) {
    switch (key) {
      case 'currentTime':
        instance.value.audioRef.currentTime = value;
        break;
      case 'volume':
        instance.value.audioRef.volume = value;
        break;
      case 'playbackRate':
        instance.value.audioRef.playbackRate = value;
        break;
      default:
        break
    }
  } else {
    // 如果audioRef还未初始化，先存起来，等初始化后再设置 => watch监听instance变化
    pendingUpdates.value[key] = value
  }
}

watch(() => props.article.audioFileId, async () => {
  if (!props.article.audioSrc && props.article.audioFileId) {
    let list = await get(LOCAL_FILE_KEY)
    if (list) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rItem = list.find((file: any) => file.id === props.article.audioFileId)
      if (rItem) {
        file.value = URL.createObjectURL(rItem.file)
      }
    }
  } else {
    file.value = null
  }
}, { immediate: true })

// 监听instance变化，设置之前pending的值
watch(instance, (newVal) => {
  if (newVal?.audioRef) {
    Object.entries(pendingUpdates.value).forEach(([key, value]) => {
      setAudioRefValue(key, value)
    });
    pendingUpdates.value = {};
  }
}, { immediate: true })

//转发一遍，这里Proxy的默认值不能为{}，可能是vue做了什么
defineExpose(new Proxy({
  currentTime: 0,
  played: false,
  src: '',
  volume: 0,
  playbackRate: 1,
  play: () => Promise.resolve(),
  pause: () => {},
}, {
  get(target, key) {
    if (key === 'currentTime') return instance.value?.audioRef?.currentTime
    if (key === 'played') return instance.value?.audioRef?.played
    if (key === 'src') return instance.value?.audioRef?.src
    if (key === 'volume') return instance.value?.audioRef?.volume
    if (key === 'playbackRate') return instance.value?.audioRef?.playbackRate
    if (key === 'play') return () => instance.value?.audioRef?.play()
    if (key === 'pause') return () => instance.value?.audioRef?.pause()
    return Reflect.get(target, key)
  },
  set(_, key, value) {
    setAudioRefValue(key as string, value)
    return true
  }
}))

</script>

<template>
  <Audio v-bind="$attrs" ref="instance" v-if="props.article.audioSrc" :src="props.article.audioSrc"
    @ended="emit('ended')" @update-volume="handleVolumeUpdate" @update-speed="handleSpeedUpdate" />
  <Audio v-bind="$attrs" ref="instance" v-else-if="file" :src="file" @ended="emit('ended')"
    @update-volume="handleVolumeUpdate" @update-speed="handleSpeedUpdate" />
</template>
