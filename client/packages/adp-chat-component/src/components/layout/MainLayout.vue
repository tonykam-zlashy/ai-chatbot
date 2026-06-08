<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Application } from '../../model/application';
import type { Record } from '../../model/chat-v2';
import type { FileProps } from '../../model/file';
import { ScoreValue } from '../../model/chat-v2';
import { MessageCode } from '../../model/messages';
import Chat from '../Chat/Index.vue';
import AIWarning from '../AIWarning.vue';
import SidebarToggle from '../SidebarToggle.vue';
import CreateConversation from '../CreateConversation.vue';
import { Avatar as TAvatar, Layout as TLayout, Content as TContent, Header as THeader, Footer as TFooter } from 'tdesign-vue-next';

// TAvatar, TLayout, TContent, THeader, TFooter 已导入，模板中使用对应组件
import type { ChatRelatedProps, ChatI18n, ChatItemI18n, SenderI18n, ChatbotConfig } from '../../model/type';
import { chatRelatedPropsDefaults, defaultChatI18n } from '../../model/type';

export interface Props extends ChatRelatedProps {
    /** 当前应用信息 */
    currentApplication?: Application;
    /** 当前应用头像 */
    currentApplicationAvatar?: string;
    /** 尺寸 */
    size?: string;
    /** 当前应用名称 */
    currentApplicationName?: string;
    /** 当前应用欢迎语 */
    currentApplicationGreeting?: string;
    /** 当前应用推荐问题列表 */
    currentApplicationOpeningQuestions?: string[];
    /** 当前应用ID */
    currentApplicationId?: string;
    /** 当前会话摘要标题 */
    currentConversationTitle?: string;
    /** 当前会话ID */
    chatId?: string;
    /** 聊天消息列表 */
    chatList?: Record[];
    /** 是否正在聊天中 */
    isChatting?: boolean;
    /** 是否显示侧边栏切换按钮 */
    showSidebarToggle?: boolean;
    /** AI警告文本 */
    aiWarningText?: string;
    /** 国际化文本 */
    i18n?: ChatI18n;
    /** ChatItem 国际化文本 */
    chatItemI18n?: ChatItemI18n;
    /** Sender 国际化文本 */
    senderI18n?: SenderI18n;
    /** 是否使用内部录音处理（API 模式） */
    useInternalRecord?: boolean;
    /** ASR URL API 路径 */
    asrUrlApi?: string;
    /** 是否启用语音输入 */
    enableVoiceInput?: boolean;
    /** 是否启用文件上传入口 */
    enableFileUpload?: boolean;
    /** 是否正在上传文件 */
    isUploading?: boolean;
    /** 是否显示遮罩层 */
    isOverlay?: boolean;
    /** 条款状态是否仍在初始化 */
    termsResolving?: boolean;
    /** 是否已接受条款 */
    termsAccepted?: boolean;
    /** 条款提示刷新 key */
    termsPromptKey?: number;
    /** Public chatbot config contract for fixture/API-driven UI */
    chatbotConfig?: ChatbotConfig;
}

const props = withDefaults(defineProps<Props>(), {
    ...chatRelatedPropsDefaults,
    size: 'small',
    currentApplicationAvatar: '',
    currentApplicationName: '',
    currentApplicationGreeting: '',
    currentApplicationOpeningQuestions: () => [],
    currentApplicationId: '',
    currentConversationTitle: '',
    chatId: '',
    chatList: () => [],
    isChatting: false,
    showSidebarToggle: true,
    aiWarningText: '内容由AI生成，仅供参考',
    isUploading: false,
    enableVoiceInput: true,
    enableFileUpload: true,
    isOverlay: false,
    termsResolving: false,
    termsAccepted: false,
    termsPromptKey: 0,
});

// 合并 i18n 配置，获取 createConversation 文本
const createConversationText = computed(() => 
    props.i18n?.createConversation ?? defaultChatI18n.createConversation
);

const isEnglish = computed(() => props.language?.startsWith('en'));
const defaultApplicationName = computed(() => props.chatbotConfig?.assistant.name || (isEnglish.value ? 'Assistant' : '助手'));
const defaultApplicationAvatar = computed(() =>
    props.chatbotConfig?.assistant.messageAvatarUrl || ''
);
const hotlineLabel = computed(() =>
    props.chatbotConfig?.hotline.label || ''
);
const hotlineNumber = computed(() => props.chatbotConfig?.hotline.number || '');
const hotlineUrl = computed(() => props.chatbotConfig?.hotline.url || '');
const showHotline = computed(() => Boolean(hotlineNumber.value || hotlineLabel.value));
const themeStyle = computed(() => ({
    '--adp-chat-header-background': props.chatbotConfig?.theme.headerBackground || '#f7943d',
    '--adp-chat-surface-background': props.chatbotConfig?.theme.surfaceBackground || '#fff8e8',
    '--adp-chat-primary-action': props.chatbotConfig?.theme.primaryAction || '#b84222',
    '--adp-chat-bubble-border': props.chatbotConfig?.theme.bubbleBorder || '#b95a25',
    '--adp-chat-user-bubble-background': props.chatbotConfig?.theme.userBubbleBackground || props.chatbotConfig?.theme.primaryAction || '#b84222',
    '--adp-chat-user-bubble-text': props.chatbotConfig?.theme.userBubbleText || '#fff',
    '--adp-chat-assistant-bubble-background': props.chatbotConfig?.theme.assistantBubbleBackground || '#fff',
    '--adp-chat-assistant-text': props.chatbotConfig?.theme.assistantText || '#713614',
}));

const normalizeApplicationName = (name?: string) => {
    const trimmed = name?.trim();
    if (!trimmed || ['unknown', 'unknown application'].includes(trimmed.toLowerCase())) {
        return defaultApplicationName.value;
    }
    return trimmed;
};

const headerTitle = computed(() => (
    props.currentConversationTitle?.trim() ||
    normalizeApplicationName(props.currentApplicationName) ||
    defaultApplicationName.value
));

const emit = defineEmits<{
    /** 切换侧边栏显示/隐藏 */
    (e: 'toggleSidebar'): void;
    /** 创建新会话 */
    (e: 'createConversation'): void;
    /** 关闭聊天面板 */
    (e: 'close'): void;
    /** 发送消息
     * @param query - 消息内容
     * @param fileList - 文件列表
     * @param conversationId - 会话ID
     * @param applicationId - 应用ID
     */
    (e: 'send', query: string, fileList: FileProps[], conversationId: string, applicationId: string): void;
    /** 停止生成回复 */
    (e: 'stop'): void;
    /** 加载更多历史消息
     * @param conversationId - 会话ID
     * @param lastRecordId - 最后一条记录ID
     */
    (e: 'loadMore', conversationId: string, lastRecordId: string): void;
    /** 评分
     * @param conversationId - 会话ID
     * @param recordId - 记录ID
     * @param score - 评分值
     */
    (e: 'rate', conversationId: string, recordId: string, score: typeof ScoreValue[keyof typeof ScoreValue]): void;
    /** 分享会话
     * @param conversationId - 会话ID
     * @param applicationId - 应用ID
     * @param recordIds - 记录ID列表
     */
    (e: 'share', conversationId: string, applicationId: string, recordIds: string[]): void;
    /** 复制内容
     * @param rowtext - 原始文本
     * @param content - 复制内容
     * @param type - 复制类型
     */
    (e: 'copy', rowtext: string | undefined, content: string | undefined, type: string): void;
    /** 上传文件
     * @param files - 文件列表
     */
    (e: 'uploadFile', files: File[]): void;
    /** 上传状态变化
     * @param status - 上传状态：uploading-上传中，done-上传完成
     */
    (e: 'uploadStatus', status: 'uploading' | 'done'): void;
    /** 开始录音 */
    (e: 'startRecord'): void;
    /** 停止录音 */
    (e: 'stopRecord'): void;
    /** 消息提示
     * @param code - 消息代码
     * @param message - 消息内容
     */
    (e: 'message', code: MessageCode, message: string): void;
    /** 会话切换
     * @param conversationId - 会话ID
     */
    (e: 'conversationChange', conversationId: string): void;
    /** Widget 事件（用于与 SSE/对话流交互）
     * @param event - widget 事件
     * @param widgetRunId - widget run id
     * @param widgetId - widget id
     * @param recordId - 消息 record id
     */
    (e: 'widgetEvent', event: CustomEvent, widgetRunId: string, widgetId: string, recordId: string): void;
    /** 接受条款 */
    (e: 'acceptTerms'): void;
    /** 拒绝条款 */
    (e: 'declineTerms'): void;
}>();

const chatRef = ref<InstanceType<typeof Chat> | null>(null);

const handleToggleSidebar = () => {
    emit('toggleSidebar');
};

const handleCreateConversation = () => {
    emit('createConversation');
};

/**
 * 通知无限加载已加载更多数据
 */
const notifyLoaded = () => {
    chatRef.value?.notifyLoaded();
};

/**
 * 通知无限加载已完成（没有更多数据）
 */
const notifyComplete = () => {
    chatRef.value?.notifyComplete();
};

defineExpose({
    notifyLoaded,
    notifyComplete,
    getChatRef: () => chatRef.value,
});
</script>

<template>
    <TLayout class="main-layout" :class="{ isMobile: isMobile }" :style="themeStyle">
        <THeader class="layout-header">
            <div class="header-app-container">
                    <SidebarToggle v-if="showSidebarToggle && !isOverlay" :theme="theme"  @toggle="handleToggleSidebar" />
                    <CreateConversation v-if="!isOverlay" :tooltipText="createConversationText" :theme="theme" @create="handleCreateConversation" />
                    <TAvatar v-if="!isOverlay" :imageProps="{
                            lazy: true,
                            loading: ''
                        }" class="header-app__avatar" shape="round" :image="currentApplicationAvatar || defaultApplicationAvatar" :size="isMobile ? 'var(--td-line-height-headline-small)' : 'large'"></TAvatar>
                        <span class="header-app__title" :title="headerTitle">{{ headerTitle }}</span>
            </div>
            <div class="header-app-settings">
                <slot name="header-actions"></slot>
                <slot name="header-overlay-content"></slot>
                <slot name="header-close-content"></slot>
            </div>
        </THeader>
        <TContent class="layout-content">
            <Chat
                ref="chatRef"
                :chatId="chatId"
                :chatList="chatList"
                :isChatting="isChatting"
                :currentApplicationId="currentApplicationId"
                :currentApplicationAvatar="currentApplicationAvatar"
                :currentApplicationName="currentApplicationName"
                :currentApplicationGreeting="currentApplicationGreeting"
                :currentApplicationOpeningQuestions="currentApplicationOpeningQuestions"
                :isMobile="isMobile"
                :theme="theme"
                :language="props.language"
                :mode="props.mode"
                :i18n="i18n"
                :chatItemI18n="chatItemI18n"
                :senderI18n="senderI18n"
                :useInternalRecord="useInternalRecord"
                :asrUrlApi="asrUrlApi"
                :enableVoiceInput="enableVoiceInput"
                :enableFileUpload="enableFileUpload"
                :isUploading="isUploading"
                :isOverlay="isOverlay"
                :chatbotConfig="chatbotConfig"
                @send="(query: string, fileList: FileProps[], conversationId: string, applicationId: string) => emit('send', query, fileList, conversationId, applicationId)"
                @stop="emit('stop')"
                :termsResolving="termsResolving"
                :termsAccepted="termsAccepted"
                :termsPromptKey="termsPromptKey"
                @acceptTerms="emit('acceptTerms')"
                @declineTerms="emit('declineTerms')"
                @loadMore="(conversationId: string, lastRecordId: string) => emit('loadMore', conversationId, lastRecordId)"
                @rate="(conversationId: string, recordId: string, score: typeof ScoreValue[keyof typeof ScoreValue]) => emit('rate', conversationId, recordId, score)"
                @share="(conversationId: string, applicationId: string, recordIds: string[]) => emit('share', conversationId, applicationId, recordIds)"
                @copy="(rowtext: string | undefined, content: string | undefined, type: string) => emit('copy', rowtext, content, type)"
                @uploadFile="(files: File[]) => emit('uploadFile', files)"
                @uploadStatus="(status: 'uploading' | 'done') => emit('uploadStatus', status)"
                @startRecord="emit('startRecord')"
                @stopRecord="emit('stopRecord')"
                @message="(code: MessageCode, message: string) => emit('message', code, message)"
                @conversationChange="(conversationId: string) => emit('conversationChange', conversationId)"
                @widgetEvent="(event: CustomEvent, widgetRunId: string, widgetId: string, recordId: string) => emit('widgetEvent', event, widgetRunId, widgetId, recordId)"
            >
                <template #empty-content>
                    <slot name="empty-content"></slot>
                </template>
            </Chat>
        </TContent>
        <TFooter class="layout-footer">
            <a v-if="showHotline && hotlineUrl" class="carers-hotline-strip" :href="hotlineUrl">
                <span v-if="hotlineNumber" class="carers-hotline-number">{{ hotlineNumber }}</span>
                <span>{{ hotlineLabel }}</span>
            </a>
            <div v-else-if="showHotline" class="carers-hotline-strip">
                <span v-if="hotlineNumber" class="carers-hotline-number">{{ hotlineNumber }}</span>
                <span>{{ hotlineLabel }}</span>
            </div>
            <AIWarning :text="aiWarningText" />
        </TFooter>
    </TLayout>
</template>


<style scoped>
@import '../../styles/chat-overrides.css';
.main-layout {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--adp-chat-surface-background, #fff8e8);
    overflow: hidden;
}
.isMobile .layout-header{
    padding: var(--td-pop-padding-xl) var(--td-comp-margin-xl);
}
.layout-header {
    flex-shrink: 0;
    display: flex;
    padding: 0 12px;
    justify-content: space-between;
    height: 38px;
    min-height: 38px;
    background: var(--adp-chat-header-background, #f7943d);
    color: #fff;
    box-shadow: 0 1px 0 rgba(160, 78, 20, 0.16);
}
.header-app-settings{
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.layout-header .header-app-settings svg {
    cursor: pointer;
    margin-left: var(--td-comp-margin-s);
}

.layout-header .header-app__avatar{
    border-radius: 50%;
    margin-left: var(--td-comp-margin-s);
    border: 2px solid rgba(255, 255, 255, 0.8);
    background: #fff7e6;
}
.layout-header .header-app__title {
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    margin-left: 0;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.layout-content {
    flex: 1;
    overflow: hidden;
    background: var(--adp-chat-surface-background, #fff8e8);
}

.layout-footer {
    flex-shrink: 0;
    padding: 0 10px 8px;
    background: var(--adp-chat-surface-background, #fff8e8);
}
.header-app-driver{
    margin: 0 var(--td-size-6) 0 var(--td-size-4);
}
.header-app-container{
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
}
:deep(.t-chat__footer){
    position: relative;
    background: var(--adp-chat-surface-background, #fff8e8);
}
:deep(.content .t-chat__content, .content .t-chat__detail-reasoning){
    padding-top: 0;
}
:deep(.content .t-chat__inner){
    margin-bottom: 0;
}

/* content自定义 - 从 App.vue 移入，使用 :deep() 确保 build 后生效 */
:deep(.t-chat__detail-reasoning .t-collapse-panel__body) {
    background: transparent;
    background-color: transparent;
}
:deep(.t-chat__detail-reasoning .t-collapse-panel__wrapper) {
    background: transparent;
    background-color: transparent;
}
:deep(.t-chat__detail-reasoning .t-collapse-panel__content) {
    background: transparent;
    background-color: transparent;
    padding: 0 0 var(--td-comp-paddingTB-m) 0;
}
:deep(.t-chat__detail-reasoning .t-collapse-panel__header--blank) {
    display: none;
}
:deep(.t-chat__detail-reasoning .t-collapse-panel__icon) {
    transform: rotate(180deg);
}
:deep(.assistant .t-chat__detail) {
    max-width: 100%;
    width: 100%;
}
:deep(.isMobile .t-chat__content) {
    margin-left: 0;
}
:deep(.t-chat__detail-reasoning .t-collapse-panel) {
    margin-left: 0;
}
:deep(.t-chat__detail-reasoning .t-collapse-panel__header) {
    padding: 0;
}
:deep(.t-chat__text--variant--text .t-chat__detail-reasoning) {
    padding-top: 0;
}
:deep(.t-chat__text .other__model-change) {
    background-color: transparent;
    padding-left: var(--td-comp-paddingTB-s);
    text-align: left;
}
:deep(.t-chat__text .other__system) {
    background-color: transparent;
    padding-left: var(--td-comp-paddingTB-s);
    text-align: left;
}

:deep(.layout-header .t-icon),
:deep(.layout-header svg) {
    color: #fff;
}

:deep(.t-chat__list) {
    background: var(--adp-chat-surface-background, #fff8e8);
}

:deep(.t-chat__content) {
    color: var(--adp-chat-assistant-text, #6f3516);
}

:deep(.assistant .t-chat__text),
:deep(.assistant .t-chat__detail) {
    color: var(--adp-chat-assistant-text, #713614);
}

:deep(.t-chat__text) {
    border-radius: 12px;
}

:deep(.user .t-chat__text) {
    background: var(--adp-chat-user-bubble-background, #b84222);
    color: var(--adp-chat-user-bubble-text, #fff);
    border-radius: 14px 14px 4px 14px;
}

:deep(.assistant .t-chat__text) {
    background: var(--adp-chat-assistant-bubble-background, #fff);
    border: 1px solid var(--adp-chat-bubble-border, #b95a25);
    border-radius: 14px 14px 14px 4px;
    box-shadow: 0 2px 0 rgba(185, 90, 37, 0.08);
}

.carers-hotline-strip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 28px;
    margin: 0 auto 6px;
    padding: 4px 10px;
    border-radius: 7px;
    background: #d7f7df;
    color: #18805d;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
}

.carers-hotline-number {
    color: #00885b;
    font-size: 14px;
}
</style>
