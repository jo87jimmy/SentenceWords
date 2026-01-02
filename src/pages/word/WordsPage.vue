<script setup lang="ts">
import BasePage from '@/components/BasePage.vue';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from 'primevue/useconfirm';
import { useRouter } from 'vue-router';

// Please ensure you have the necessary store and logic definitions or imports here
// The following variables are referenced in the template:
// store, settingStore, isSaveData, loading, currentStudy, WordPracticeMode
// progressTextLeft, progressTextRight, _getAccomplishDate
// showChangeLastPracticeIndexDialog, showPracticeWordListDialog, showPracticeSettingDialog, showShufflePracticeSettingDialog
// startPractice, goDictDetail, check

const router = useRouter();
const confirm = useConfirm();

// Helper to handle confirmation logic
const handleConfirm = (event: Event, message: string, acceptCallback: () => void) => {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: message,
        icon: 'pi pi-exclamation-triangle',
        accept: acceptCallback,
    });
};

const confirmAndExecute = (event: Event, condition: boolean, message: string, action: () => void) => {
    if (condition) {
        handleConfirm(event, message, action);
    } else {
        action();
    }
};
</script>

<template>
    <BasePage>
        <div class="card flex flex-col md:flex-row gap-8">
            <div class="flex-1 w-full flex flex-col justify-between">
                <div class="flex gap-3">
                    <div class="p-1 flex justify-center items-center rounded-full bg-white">
                        <IconFluentBookNumber20Filled class="text-xl text-blue-600" />
                    </div>
                    <div @click="goDictDetail(store.sdict)" class="text-2xl font-bold cursor-pointer">
                        {{ store.sdict.name || '目前無正在學習的詞典' }}
                    </div>
                </div>

                <template v-if="store.sdict.id">
                    <div class="mt-4 flex flex-col gap-2">
                        <div class="">目前進度：{{ progressTextLeft }}</div>
                        <ProgressBar :value="store.currentStudyProgress" :showValue="false" class="h-2" />
                        <div class="text-sm flex justify-between">
                            <span>已完成 {{ progressTextRight }} 詞 / 共 {{ store.sdict.words.length }} 詞</span>
                            <span v-if="store.sdict.id">
                                預計完成日期：{{ _getAccomplishDate(store.sdict.words.length, store.sdict.perDayStudyNumber) }}
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center mt-4 gap-4">
                        <Button severity="info" size="small" @click="router.push('/dict-list')">
                            <div class="flex justify-center items-center gap-1">
                                <IconFluentArrowSwap20Regular />
                                <span>選擇詞典</span>
                            </div>
                        </Button>
                        <Button severity="info" size="small" v-if="store.sdict.id"
                            :disabled="!isSaveData"
                            @click="confirmAndExecute($event, isSaveData, '目前存在未完成的學習任務，修改會重新生成學習任務，是否繼續？', () => check(() => showChangeLastPracticeIndexDialog = true))">
                            <div class="flex justify-center items-center gap-1">
                                <IconFluentSlideTextTitleEdit20Regular />
                                <span>更改進度</span>
                            </div>
                        </Button>
                    </div>
                </template>

                <div class="flex items-center gap-4 mt-2 flex-1" v-else>
                    <div class="title">請選擇一本詞典開始學習</div>
                    <Button id="step1" severity="primary" size="large" @click="router.push('/dict-list')">
                        <div class="flex justify-center items-center gap-1">
                            <IconFluentAdd16Regular />
                            <span>選擇詞典</span>
                        </div>
                    </Button>
                </div>
            </div>

            <div class="flex-1 w-full mt-4 md:mt-0 transition-opacity duration-200"
                :class="!store.sdict.id && 'opacity-30 cursor-not-allowed'">
                <div class="flex justify-between">
                    <div class="flex items-center gap-2">
                        <div class="p-2 flex justify-center items-center rounded-full bg-white">
                            <IconFluentStar20Filled class="text-lg text-amber-500" />
                        </div>
                        <div class="text-xl font-bold">
                            {{ isSaveData ? '上次任務' : '今日任務' }}
                        </div>
                        <span class="text-blue-600 cursor-pointer" v-if="store.sdict.id"
                            @click="showPracticeWordListDialog = true">詞表</span>

                    </div>
                    <div class="flex gap-1 items-center" v-if="store.sdict.id">
                        每日目標
                        <div style="color:#ac6ed1;" class="bg-purple-100 px-2 h-10 flex justify-center items-center text-2xl rounded">
                            {{ store.sdict.id ? store.sdict.perDayStudyNumber : 0 }}
                        </div>
                        個單字
                        <Button severity="info" size="small"
                                :disabled="!isSaveData"
                                @click="confirmAndExecute($event, isSaveData, '目前存在未完成的學習任務，修改會重新生成學習任務，是否繼續？', () => check(() => showPracticeSettingDialog = true))">
                            更改
                        </Button>
                    </div>
                </div>
                <div class="flex mt-4 justify-between">
                    <div class="stat">
                        <div class="num">{{ currentStudy.new.length }}</div>
                        <div class="txt">新詞數</div>
                    </div>
                    <template v-if="settingStore.wordPracticeMode === WordPracticeMode.System">
                        <div class="stat">
                            <div class="num">{{ currentStudy.review.length }}</div>
                            <div class="txt">複習上次</div>
                        </div>
                        <div class="stat">
                            <div class="num">{{ currentStudy.write.length }}</div>
                            <div class="txt">複習之前</div>
                        </div>
                    </template>
                </div>
                <div class="flex items-end mt-4">
                    <Button size="large" class="flex-1" :disabled="!store.sdict.id" :loading="loading"
                        @click="startPractice">
                        <div class="flex items-center gap-2">
                            <span class="leading-[2]">{{ isSaveData ? '繼續學習' : '開始學習' }}</span>
                            <IconFluentArrowCircleRight16Regular class="text-xl" />
                        </div>
                    </Button>

                    <Button v-if="store.sdict.id && store.sdict.lastLearnIndex" size="large" severity="warn" class="ml-2"
                        :loading="loading" @click="check(() => showShufflePracticeSettingDialog = true)">
                        <div class="flex items-center gap-2">
                            <span class="leading-[2]">隨機複習</span>
                            <IconFluentArrowShuffle20Filled class="text-xl" />
                        </div>
                    </Button>
                </div>
            </div>
        </div>
        <ConfirmPopup />
    </BasePage>
</template>