<script setup lang="ts">

import { inject, type Ref, computed } from "vue"
import { usePracticeStore } from "@/stores/practice.ts";
import { useSettingStore } from "@/stores/setting.ts";
import { type PracticeData, ShortcutKey } from "@/types/types.ts";
import BaseIcon from "@/components/BaseIcon.vue";
import Tooltip from "@/components/base/Tooltip.vue";
import Progress from '@/components/base/Progress.vue'

const statStore = usePracticeStore()
const settingStore = useSettingStore()

defineProps<{
  showEdit?: boolean,
  isCollect: boolean,
  isSimple: boolean
}>()

const emit = defineEmits<{
  toggleCollect: [],
  toggleSimple: [],
  edit: [],
  skip: [],
  skipStep:[]
}>()

let practiceData = inject<PracticeData>('practiceData')
let isTypingWrongWord = inject<Ref<boolean>>('isTypingWrongWord')

function format(val: number, suffix: string = '', check: number = -1) {
  return val === check ? '-' : (val + suffix)
}

const status = computed(() => {
  if (isTypingWrongWord?.value) return '複習錯詞'
  return getStepStr(statStore.step)
})

function getStepStr(step: number) {
  let str = ''
  switch (step) {
    case 0:
      str += `學習新詞`
      break
    case 1:
      str += `聽寫新詞`
      break
    case 2:
      str += `默寫新詞`
      break
    case 3:
      str += `辨認上次學習`
      break
    case 4:
      str += '聽寫上次學習'
      break
    case 5:
      str += '默寫上次學習'
      break
    case 6:
      str += '辨認之前學習'
      break
    case 7:
      str += '聽寫之前學習'
      break
    case 8:
      str += '默寫之前學習'
      break
    case 9:
      str += '學習完成'
      break
    case 10:
      str += '隨機複習'
      break
  }
  return str
}

const progress = computed(() => {
  if (!practiceData?.words.length) return 0
  return ((practiceData.index / practiceData.words.length) * 100)
})

</script>

<template>
  <div class="footer">
    <Tooltip :title="settingStore.showToolbar?'收起':'展開'">
      <IconFluentChevronLeft20Filled
          @click="settingStore.showToolbar = !settingStore.showToolbar"
          class="arrow"
          :class="!settingStore.showToolbar && 'down'"
          color="#999"/>
    </Tooltip>

    <div class="bottom">
      <Progress
          :percentage="progress"
          :stroke-width="8"
          :show-text="false"/>
      <div class="flex justify-between items-center">
        <div class="stat">
          <div class="row">
            <div class="num">{{ practiceData ? `${practiceData.index + 1}/${practiceData.words.length}` : '-/-' }}</div>
            <div class="line"></div>
            <div class="name">{{ status }}</div>
          </div>
          <div class="row">
            <div class="num">{{ statStore.total }}</div>
            <div class="line"></div>
            <div class="name">單字總數</div>
          </div>
<!--          <div class="row">-->
<!--            <div class="num">{{ format(statStore.inputWordNumber, '', 0) }}</div>-->
<!--            <div class="line"></div>-->
<!--            <div class="name">總輸入數</div>-->
<!--          </div>-->
          <div class="row">
            <div class="num">{{ format(statStore.wrong, '', 0) }}</div>
            <div class="line"></div>
            <div class="name">錯誤數</div>
          </div>
        </div>
        <div class="flex gap-2 justify-center items-center" id="toolbar-icons">
          <BaseIcon
              v-if="statStore.step < 9"
              @click="emit('skipStep')"
              :title="`跳到下一階段:${getStepStr(statStore.step+1)}`">
            <IconFluentArrowRight16Regular/>
          </BaseIcon>

          <BaseIcon
              :class="!isSimple?'collect':'fill'"
              @click="$emit('toggleSimple')"
              :title="(!isSimple ? '標記為已掌握' : '取消標記已掌握')+`(${settingStore.shortcutKeyMap[ShortcutKey.ToggleSimple]})`">
            <IconFluentCheckmarkCircle16Regular v-if="!isSimple"/>
            <IconFluentCheckmarkCircle16Filled v-else/>
          </BaseIcon>

          <BaseIcon
              :class="!isCollect?'collect':'fill'"
              @click.stop="$emit('toggleCollect')"
              :title="(!isCollect ? '收藏' : '取消收藏')+`(${settingStore.shortcutKeyMap[ShortcutKey.ToggleCollect]})`">
            <IconFluentStarAdd16Regular v-if="!isCollect"/>
            <IconFluentStar16Filled v-else/>
          </BaseIcon>
          <BaseIcon
              @click="emit('skip')"
              :title="`跳過當前單字(${settingStore.shortcutKeyMap[ShortcutKey.Next]})`">
            <IconFluentArrowBounce20Regular class="transform-rotate-180"/>
          </BaseIcon>

          <BaseIcon
              @click="settingStore.dictation = !settingStore.dictation"
              :title="`開關默寫模式(${settingStore.shortcutKeyMap[ShortcutKey.ToggleDictation]})`"
          >
            <IconFluentEyeOff16Regular v-if="settingStore.dictation"/>
            <IconFluentEye16Regular v-else/>
          </BaseIcon>

          <BaseIcon
              :title="`開關釋義顯示(${settingStore.shortcutKeyMap[ShortcutKey.ToggleShowTranslate]})`"
              @click="settingStore.translate = !settingStore.translate">
            <IconFluentTranslate16Regular v-if="settingStore.translate"/>
            <IconFluentTranslateOff16Regular v-else/>
          </BaseIcon>

          <BaseIcon
              @click="settingStore.showPanel = !settingStore.showPanel"
              :title="`單字本(${settingStore.shortcutKeyMap[ShortcutKey.TogglePanel]})`">
            <IconFluentTextListAbcUppercaseLtr20Regular/>
          </BaseIcon>
        </div>
      </div>
    </div>
    <div class="progress-wrap">
      <Progress :percentage="progress"
                :stroke-width="8"
                :show-text="false"/>
    </div>
  </div>
</template>

<style scoped lang="scss">

.footer {
  flex-shrink: 0;
  width: var(--toolbar-width);
  position: relative;
  z-index: 20; // 提高z-index确保在最上方

  &.hide {
    margin-bottom: -6rem;
    margin-top: 3rem;

    .progress-wrap {
      bottom: calc(100% + 1.8rem);
    }
  }

  .bottom {
    position: relative;
    width: 100%;
    box-sizing: border-box;
    border-radius: .6rem;
    background: var(--color-second);
    padding: .2rem var(--space) calc(.4rem + env(safe-area-inset-bottom, 0px)) var(--space);
    border: 1px solid var(--color-item-border);
    box-shadow: var(--shadow);
    z-index: 10;

    .stat {
      margin-top: .5rem;
      display: flex;
      justify-content: space-around;
      gap: var(--stat-gap);

      .row {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: .3rem;
        color: gray;

        .line {
          height: 1px;
          width: 100%;
          background: var(--color-sub-gray);
        }
      }
    }
  }

  .progress-wrap {
    width: var(--toolbar-width);
    transition: all .3s;
    padding: 0 .6rem;
    box-sizing: border-box;
    position: fixed;
    bottom: 1rem;
    z-index: 1; // 确保进度条也在最上方
  }

  .arrow {
    position: absolute;
    top: -40%;
    left: 50%;
    cursor: pointer;
    transition: all .5s;
    transform: rotate(-90deg);
    padding: .5rem;
    font-size: 1.2rem;

    &.down {
      top: -90%;
      transform: rotate(90deg);
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .footer {
    width: 100%;
    
    .bottom {
      padding: 0.3rem 0.5rem 0.5rem 0.5rem;
      border-radius: 0.4rem;
      
      .stat {
        margin-top: 0.3rem;
        gap: 0.2rem;
        flex-direction: row;
        overflow-x: auto;
        
        .row {
          min-width: 3.5rem;
          gap: 0.2rem;
          
          .num {
            font-size: 0.8rem;
            font-weight: bold;
          }
          
          .name {
            font-size: 0.7rem;
          }
        }
      }
      
      // 移动端按钮组调整 - 改为网格布局
      .flex.gap-2 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.4rem;
        justify-content: center;
        
        .base-icon {
          padding: 0.3rem;
          font-size: 1rem;
          min-height: 44px;
          min-width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
    
    .progress-wrap {
      width: 100%;
      padding: 0 0.5rem;
      bottom: 0.5rem;
    }
    
    .arrow {
      font-size: 1rem;
      padding: 0.3rem;
    }
  }
}

// 超小屏幕适配
@media (max-width: 480px) {
  .footer {
    .bottom {
      padding: 0.2rem 0.3rem 0.3rem 0.3rem;
      
      .stat {
        margin-top: 0.2rem;
        gap: 0.1rem;
        
        .row {
          min-width: 3rem;
          gap: 0.1rem;
          
          .num {
            font-size: 0.7rem;
          }
          
          .name {
            font-size: 0.6rem;
          }
          
          // 隐藏部分统计信息，只保留关键数据
          &:nth-child(n+3) {
            display: none;
          }
        }
      }
      
      .flex.gap-2 {
        gap: 0.2rem;
        
        .base-icon {
          padding: 0.2rem;
          font-size: 0.9rem;
        }
      }
    }
    
    .progress-wrap {
      padding: 0 0.3rem;
      bottom: 0.3rem;
    }
  }
}
</style>
