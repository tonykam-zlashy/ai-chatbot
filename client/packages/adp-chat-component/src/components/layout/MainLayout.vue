<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import type { Application } from "../../model/application";
import type { Record } from "../../model/chat-v2";
import type { FileProps } from "../../model/file";
import { ScoreValue } from "../../model/chat-v2";
import { MessageCode } from "../../model/messages";
import Chat from "../Chat/Index.vue";
import AIWarning from "../AIWarning.vue";
import SidebarToggle from "../SidebarToggle.vue";
import CreateConversation from "../CreateConversation.vue";
import {
  Avatar as TAvatar,
  Layout as TLayout,
  Content as TContent,
  Header as THeader,
  Footer as TFooter,
} from "tdesign-vue-next";

// TAvatar, TLayout, TContent, THeader, TFooter 已导入，模板中使用对应组件
import type {
  ChatRelatedProps,
  ChatI18n,
  ChatItemI18n,
  SenderI18n,
  ChatbotConfig,
} from "../../model/type";
import { chatRelatedPropsDefaults, defaultChatI18n } from "../../model/type";
import { installVisualViewportCssVars } from "../../utils/device";

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
  /** ASR 文件识别 API 路径 */
  asrFileApi?: string;
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
  size: "small",
  currentApplicationAvatar: "",
  currentApplicationName: "",
  currentApplicationGreeting: "",
  currentApplicationOpeningQuestions: () => [],
  currentApplicationId: "",
  currentConversationTitle: "",
  chatId: "",
  chatList: () => [],
  isChatting: false,
  showSidebarToggle: true,
  aiWarningText: "内容由AI生成，仅供参考",
  isUploading: false,
  enableVoiceInput: false,
  enableFileUpload: false,
  isOverlay: false,
  termsResolving: false,
  termsAccepted: false,
  termsPromptKey: 0,
});
let cleanupVisualViewportCssVars: (() => void) | null = null;

onMounted(() => {
  cleanupVisualViewportCssVars = installVisualViewportCssVars();
});

onUnmounted(() => {
  cleanupVisualViewportCssVars?.();
  cleanupVisualViewportCssVars = null;
});

// 合并 i18n 配置，获取 createConversation 文本
const createConversationText = computed(
  () => props.i18n?.createConversation ?? defaultChatI18n.createConversation,
);

const isEnglish = computed(() => props.language?.startsWith("en"));
const defaultApplicationName = computed(
  () =>
    props.chatbotConfig?.assistant.name ||
    (isEnglish.value ? "Assistant" : "助手"),
);
const defaultApplicationAvatar = computed(
  () => props.chatbotConfig?.assistant.messageAvatarUrl || "",
);
const hotlineLabel = computed(() => props.chatbotConfig?.hotline.label || "");
const hotlineNumber = computed(() => props.chatbotConfig?.hotline.number || "");
const hotlineUrl = computed(() => props.chatbotConfig?.hotline.url || "");
const hotlineTutorialUrl = computed(() => {
  const url = hotlineUrl.value.trim();
  return url && !url.toLowerCase().startsWith("tel:")
    ? url
    : "https://carers.hk/chatbot-tutorial";
});
const hotlineTelUrl = computed(() => {
  const dialNumber = hotlineNumber.value.replace(/[^\d+]/g, "");
  return dialNumber ? `tel:${dialNumber}` : "";
});
const hotlineDescription = computed(
  () => props.chatbotConfig?.hotline.description || "",
);
const showHotline = computed(() =>
  Boolean(hotlineNumber.value || hotlineLabel.value),
);
const useCarersHeaderChrome = computed(() => Boolean(props.chatbotConfig));
const themeStyle = computed(() => ({
  "--adp-chat-font-family":
    '"DM Sans", "微軟正黑體", "Microsoft JhengHei", sans-serif',
  "--td-font-family":
    '"DM Sans", "微軟正黑體", "Microsoft JhengHei", sans-serif',
  "--td-font-family-medium":
    '"DM Sans", "微軟正黑體", "Microsoft JhengHei", sans-serif',
  "--adp-chat-header-background":
    props.chatbotConfig?.theme.headerBackground ||
    "linear-gradient(180deg, #ffd4ac 0%, #ff7e33 100%)",
  "--adp-chat-surface-background":
    props.chatbotConfig?.theme.surfaceBackground || "#fff",
  "--adp-chat-primary-action":
    props.chatbotConfig?.theme.primaryAction || "#b84319",
  "--adp-chat-bubble-border":
    props.chatbotConfig?.theme.bubbleBorder || "#b95a25",
  "--adp-chat-user-bubble-background":
    props.chatbotConfig?.theme.userBubbleBackground ||
    props.chatbotConfig?.theme.primaryAction ||
    "#b84222",
  "--adp-chat-user-bubble-text":
    props.chatbotConfig?.theme.userBubbleText || "#fff",
  "--adp-chat-user-bubble-border":
    props.chatbotConfig?.theme.userBubbleBorder || "none",
  "--adp-chat-assistant-bubble-background":
    props.chatbotConfig?.theme.assistantBubbleBackground || "#ffefd6",
  "--adp-chat-assistant-text":
    props.chatbotConfig?.theme.assistantText || "#b84319",
  "--adp-chat-timestamp-text":
    props.chatbotConfig?.theme.timestampText || "#777",
  "--adp-chat-footer-background":
    props.chatbotConfig?.theme.footerBackground ||
    "linear-gradient(0deg, #FFEFD6 16.5%, #fff 100%), linear-gradient(180deg, #FFEFD6 0%, #FFC284 100%)",
  "--adp-chat-layout-footer-height":
    showHotline.value && hotlineExpanded.value && hotlineDescription.value
      ? "72px"
      : showHotline.value
        ? "40px"
        : "32px",
  "--adp-chat-footer-icon-color":
    props.chatbotConfig?.theme.footerIconColor ||
    props.chatbotConfig?.theme.primaryAction ||
    "#FF7833",
  "--adp-chat-hotline-background":
    props.chatbotConfig?.theme.hotlineBackground || "#ECFDF0",
  "--adp-chat-hotline-text":
    props.chatbotConfig?.theme.hotlineText || "#139C6C",
  "--adp-chat-link-color": "rgb(26, 13, 171)",
}));

const headerTitle = computed(() => defaultApplicationName.value);

const emit = defineEmits<{
  /** 切换侧边栏显示/隐藏 */
  (e: "toggleSidebar"): void;
  /** 创建新会话 */
  (e: "createConversation"): void;
  /** 关闭聊天面板 */
  (e: "close"): void;
  /** 发送消息
   * @param query - 消息内容
   * @param fileList - 文件列表
   * @param conversationId - 会话ID
   * @param applicationId - 应用ID
   */
  (
    e: "send",
    query: string,
    fileList: FileProps[],
    conversationId: string,
    applicationId: string,
  ): void;
  /** 停止生成回复 */
  (e: "stop"): void;
  (
    e: "recordAudio",
    file: FileProps,
    conversationId: string,
    applicationId: string,
  ): void;
  /** 加载更多历史消息
   * @param conversationId - 会话ID
   * @param lastRecordId - 最后一条记录ID
   */
  (e: "loadMore", conversationId: string, lastRecordId: string): void;
  /** 评分
   * @param conversationId - 会话ID
   * @param recordId - 记录ID
   * @param score - 评分值
   */
  (
    e: "rate",
    conversationId: string,
    recordId: string,
    score: (typeof ScoreValue)[keyof typeof ScoreValue],
  ): void;
  /** 分享会话
   * @param conversationId - 会话ID
   * @param applicationId - 应用ID
   * @param recordIds - 记录ID列表
   */
  (
    e: "share",
    conversationId: string,
    applicationId: string,
    recordIds: string[],
  ): void;
  /** 复制内容
   * @param rowtext - 原始文本
   * @param content - 复制内容
   * @param type - 复制类型
   */
  (
    e: "copy",
    rowtext: string | undefined,
    content: string | undefined,
    type: string,
  ): void;
  /** 上传文件
   * @param files - 文件列表
   */
  (e: "uploadFile", files: File[]): void;
  /** 上传状态变化
   * @param status - 上传状态：uploading-上传中，done-上传完成
   */
  (e: "uploadStatus", status: "uploading" | "done"): void;
  /** 开始录音 */
  (e: "startRecord"): void;
  /** 停止录音 */
  (e: "stopRecord"): void;
  /** 消息提示
   * @param code - 消息代码
   * @param message - 消息内容
   */
  (e: "message", code: MessageCode, message: string): void;
  /** 会话切换
   * @param conversationId - 会话ID
   */
  (e: "conversationChange", conversationId: string): void;
  /** Widget 事件（用于与 SSE/对话流交互）
   * @param event - widget 事件
   * @param widgetRunId - widget run id
   * @param widgetId - widget id
   * @param recordId - 消息 record id
   */
  (
    e: "widgetEvent",
    event: CustomEvent,
    widgetRunId: string,
    widgetId: string,
    recordId: string,
  ): void;
  /** 接受条款 */
  (e: "acceptTerms"): void;
  /** 拒绝条款 */
  (e: "declineTerms"): void;
}>();

const chatRef = ref<InstanceType<typeof Chat> | null>(null);
const hotlineExpanded = ref(true);

const handleToggleSidebar = () => {
  emit("toggleSidebar");
};

const handleCreateConversation = () => {
  emit("createConversation");
};

const toggleHotline = () => {
  hotlineExpanded.value = !hotlineExpanded.value;
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
  <TLayout
    class="main-layout"
    :class="{ isMobile: isMobile }"
    :style="themeStyle"
  >
    <THeader class="layout-header">
      <div class="header-app-container">
        <SidebarToggle
          v-if="showSidebarToggle && !isOverlay && !useCarersHeaderChrome"
          :theme="theme"
          @toggle="handleToggleSidebar"
        />
        <CreateConversation
          v-if="!isOverlay && !useCarersHeaderChrome"
          :tooltipText="createConversationText"
          :theme="theme"
          @create="handleCreateConversation"
        />
        <TAvatar
          v-if="!isOverlay && !useCarersHeaderChrome"
          :imageProps="{
            lazy: true,
            loading: '',
          }"
          class="header-app__avatar"
          shape="round"
          :image="currentApplicationAvatar || defaultApplicationAvatar"
          :size="isMobile ? 'var(--td-line-height-headline-small)' : 'large'"
        ></TAvatar>
        <span class="header-app__title" :title="headerTitle">{{
          headerTitle
        }}</span>
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
        :asrFileApi="asrFileApi"
        :enableVoiceInput="props.enableVoiceInput"
        :enableFileUpload="props.enableFileUpload"
        :isUploading="isUploading"
        :isOverlay="isOverlay"
        :chatbotConfig="chatbotConfig"
        @send="
          (
            query: string,
            fileList: FileProps[],
            conversationId: string,
            applicationId: string,
          ) => emit('send', query, fileList, conversationId, applicationId)
        "
        @stop="emit('stop')"
        @recordAudio="
          (
            file: FileProps,
            conversationId: string,
            applicationId: string,
          ) => emit('recordAudio', file, conversationId, applicationId)
        "
        :termsResolving="termsResolving"
        :termsAccepted="termsAccepted"
        :termsPromptKey="termsPromptKey"
        @acceptTerms="emit('acceptTerms')"
        @declineTerms="emit('declineTerms')"
        @loadMore="
          (conversationId: string, lastRecordId: string) =>
            emit('loadMore', conversationId, lastRecordId)
        "
        @rate="
          (
            conversationId: string,
            recordId: string,
            score: (typeof ScoreValue)[keyof typeof ScoreValue],
          ) => emit('rate', conversationId, recordId, score)
        "
        @share="
          (
            conversationId: string,
            applicationId: string,
            recordIds: string[],
          ) => emit('share', conversationId, applicationId, recordIds)
        "
        @copy="
          (
            rowtext: string | undefined,
            content: string | undefined,
            type: string,
          ) => emit('copy', rowtext, content, type)
        "
        @uploadFile="(files: File[]) => emit('uploadFile', files)"
        @uploadStatus="
          (status: 'uploading' | 'done') => emit('uploadStatus', status)
        "
        @startRecord="emit('startRecord')"
        @stopRecord="emit('stopRecord')"
        @message="
          (code: MessageCode, message: string) => emit('message', code, message)
        "
        @conversationChange="
          (conversationId: string) => emit('conversationChange', conversationId)
        "
        @widgetEvent="
          (
            event: CustomEvent,
            widgetRunId: string,
            widgetId: string,
            recordId: string,
          ) => emit('widgetEvent', event, widgetRunId, widgetId, recordId)
        "
      >
        <template #empty-content>
          <slot name="empty-content"></slot>
        </template>
      </Chat>
    </TContent>
    <TFooter class="layout-footer">
      <div v-if="showHotline" class="carers-hotline-panel">
        <div class="carers-hotline-strip">
          <div class="carers-hotline-link">
            <a
              class="carers-hotline-icon carers-hotline-icon--web carers-hotline-action"
              :href="hotlineTutorialUrl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open chatbot tutorial"
            >
              <span aria-hidden="true"></span>
            </a>
            <span
              class="carers-hotline-icon carers-hotline-icon--phone"
              aria-hidden="true"
            >
              <span></span>
            </span>
            <a
              v-if="hotlineNumber"
              class="carers-hotline-number carers-hotline-action"
              :href="hotlineTelUrl"
              >{{ hotlineNumber }}</a
            >
            <span
              v-if="hotlineNumber && hotlineLabel"
              class="carers-hotline-divider"
              aria-hidden="true"
            ></span>
            <span class="carers-hotline-label">{{ hotlineLabel }}</span>
          </div>
          <button
            type="button"
            class="carers-hotline-toggle"
            :aria-expanded="hotlineExpanded"
            :aria-label="
              hotlineExpanded
                ? 'Collapse hotline details'
                : 'Expand hotline details'
            "
            @click="toggleHotline"
          >
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
        <div
          v-if="hotlineExpanded && hotlineDescription"
          class="carers-hotline-detail"
        >
          {{ hotlineDescription }}
        </div>
      </div>
      <AIWarning v-if="!showHotline" :text="aiWarningText" />
    </TFooter>
  </TLayout>
</template>

<style scoped>
@import "../../styles/chat-overrides.css";
.main-layout {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: var(--adp-chat-font-family);
  font-size: 16px;
  background: var(--adp-chat-surface-background, #fff);
  border: 1px solid var(--adp-chat-bubble-border, #b95a25);
  border-radius: 12px;
  box-sizing: border-box;
  overflow: hidden;
}
.isMobile .layout-header {
  height: 38px;
  min-height: 38px;
  padding: 0 8px;
}
.layout-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 8px;
  justify-content: space-between;
  height: 38px;
  min-height: 38px;
  background: var(--adp-chat-header-background, #f7943d);
  color: #fff;
  border-radius: 11px 11px 0 0;
  box-shadow: none;
}
.header-app-settings {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 100%;
}

.layout-header .header-app-settings svg {
  cursor: pointer;
  margin-left: 18px;
}

.layout-header .header-app__avatar {
  border-radius: 50%;
  margin-left: 6px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: #fff7e6;
}
.layout-header .header-app__title {
  color: #fff;
  font-size: 16px;
  line-height: 38px;
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
  background: var(--adp-chat-surface-background, #fff);
}

.layout-footer {
  flex-shrink: 0;
  padding: 0 8px
    max(
      env(safe-area-inset-bottom, 0px),
      var(--adp-chat-viewport-bottom-offset, 0px)
    );
  border-radius: 0 0 11px 11px;
  background: var(--adp-chat-footer-background);
  background-size: 100%
    calc(
      var(--chat-composer-footer-height, 41px) +
        var(--adp-chat-layout-footer-height, 72px)
    );
  background-position: bottom;
  box-sizing: border-box;
}
.header-app-driver {
  margin: 0 var(--td-size-6) 0 var(--td-size-4);
}
.header-app-container {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  height: 100%;
}
:deep(.t-chat__footer) {
  position: relative;
  padding: 0;
  background: var(--adp-chat-footer-background);
  background-size: 100%
    calc(
      var(--chat-composer-footer-height, 41px) +
        var(--adp-chat-layout-footer-height, 72px)
    );
  background-position: top;
}
:deep(.content .t-chat__content, .content .t-chat__detail-reasoning) {
  padding-top: 0;
}
:deep(.content .t-chat__inner) {
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

:deep(.layout-header .customeized-icon),
:deep(.layout-header .header-overlay-icon),
:deep(.layout-header .open-file-list-btn) {
  color: #fff;
}

:deep(.layout-header .customeized-icon:hover),
:deep(.layout-header .header-overlay-icon:hover),
:deep(.layout-header .open-file-list-btn:hover) {
  background-color: rgba(0, 0, 0, 0.04);
}

:deep(.layout-header .customeized-icon) {
  width: 28px;
  height: 28px;
}

:deep(.layout-header .customeized-icon svg) {
  width: 24px;
  height: 24px;
}

:deep(.t-chat__list) {
  background: var(--adp-chat-surface-background, #fff);
}

:deep(.t-chat__content) {
  color: var(--adp-chat-assistant-text, #6f3516);
}

:deep(.chat-box),
:deep(.t-chat),
:deep(.t-chat__list),
:deep(.t-chat__content),
:deep(.t-chat__text),
:deep(.t-chat__detail),
:deep(.markdown-body),
:deep(.markdown-body p),
:deep(.user-message),
:deep(.terms-message-card),
:deep(.sender-container) {
  font-family: var(--adp-chat-font-family);
}

:deep(.t-chat__text),
:deep(.t-chat__detail),
:deep(.markdown-body),
:deep(.markdown-body p),
:deep(.user-message),
:deep(.terms-message-card) {
  font-size: 16px !important;
  line-height: 1.5 !important;
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
  border: var(--adp-chat-user-bubble-border, none);
  border-radius: 12px 12px 0 12px;
}

:deep(.assistant .t-chat__text) {
  background: var(--adp-chat-assistant-bubble-background, #ffefd6);
  border: 1px solid var(--adp-chat-bubble-border, #b95a25);
  border-radius: 12px 12px 12px 0;
  box-shadow: none;
}

:deep(.terms-message-card) {
  max-width: calc(100% - 40px);
  padding: 16px;
  border-radius: 12px 12px 12px 0;
  background: var(--adp-chat-assistant-bubble-background, #ffefd6);
  color: var(--adp-chat-assistant-text, #b84319);
  font-size: 16px;
  line-height: 1.5;
  box-shadow: none;
}

:deep(.terms-message-title) {
  color: var(--adp-chat-assistant-text, #b84319);
}

:deep(.terms-message-card a),
:deep(.markdown-body a) {
  color: var(--adp-chat-link-color, rgb(26, 13, 171));
}

:deep(.terms-actions) {
  gap: 16px;
}

:deep(.terms-btn) {
  flex: 1 1 0;
  height: 45px;
  border-radius: 12px;
  font-size: 16px;
}

:deep(.sender-container) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: 40px;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

:deep(.sender-container.is-focused) {
  box-shadow: none;
}

:deep(.sender-container.is-disabled) {
  background: transparent;
}

:deep(.sender-editor-area) {
  grid-column: 1;
  min-height: 40px;
  max-height: 88px;
  display: flex;
  align-items: center;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}

:deep(.sender-editor-area .qa-editor),
:deep(.sender-editor-area .qa-editor__editor),
:deep(.sender-editor-area .w-e-text-container) {
  min-height: 40px;
}

:deep(.sender-editor-area .w-e-text-container [data-slate-editor]) {
  min-height: 20px;
  padding: 8px 12px;
  color: #464747;
  font-size: 16px;
  line-height: 23px;
}

:deep(.sender-editor-area .w-e-text-placeholder) {
  top: 8px;
  color: #9a9a9a;
  font-size: 16px;
  line-height: 23px;
}

:deep(.sender-toolbar) {
  grid-column: 2;
  height: 40px;
  padding: 0;
  justify-content: flex-end;
}

:deep(.sender-toolbar__left) {
  display: none;
}

:deep(.sender-toolbar__right) {
  width: auto;
  min-width: max-content;
  height: 40px;
  justify-content: center;
}

:deep(.send-icon),
:deep(.send-icon .customeized-icon),
:deep(.send-icon svg) {
  width: 36px;
  height: 36px;
}

.carers-hotline-panel {
  margin: 0 -8px;
  overflow: hidden;
}

.carers-hotline-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-height: 40px;
  padding: 0 8px;
  background: transparent;
  color: #101111;
  font-size: 14px;
  font-weight: 700;
}

.carers-hotline-link {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 8px;
  color: inherit;
  text-decoration: none;
}

.carers-hotline-action {
  color: inherit;
  text-decoration: none;
}

.carers-hotline-action:focus,
.carers-hotline-action:focus-visible,
.carers-hotline-action:active {
  outline: none;
  box-shadow: none;
}

.carers-hotline-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  min-width: 28px;
  flex: 0 0 28px;
  color: var(--adp-chat-hotline-text, #139c6c);
}

.carers-hotline-action.carers-hotline-icon {
  width: 28px;
  height: 28px;
  min-width: 28px;
}

.carers-hotline-icon svg {
  display: block;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.carers-hotline-icon--web svg path:nth-child(2) {
  fill: currentColor;
  stroke: none;
}

.carers-hotline-icon--web span {
  display: block;
  width: 28px;
  height: 28px;
  background-color: currentColor;
  mask: url("https://carers-webchat.aienchat.com/video-outlined.svg") center /
    contain no-repeat;
  -webkit-mask: url("https://carers-webchat.aienchat.com/video-outlined.svg")
    center / contain no-repeat;
}

.carers-hotline-icon--phone span {
  display: block;
  width: 24px;
  height: 24px;
  background-color: currentColor;
  mask: url("https://carers-webchat.aienchat.com/phone.svg") center / contain
    no-repeat;
  -webkit-mask: url("https://carers-webchat.aienchat.com/phone.svg") center /
    contain no-repeat;
}

.carers-hotline-number {
  color: var(--adp-chat-hotline-text, #139c6c);
  font-weight: bold;
  font-size: 16px;
  line-height: 24px;
  flex: 0 0 auto;
}

.carers-hotline-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--td-font-size-link-small);
  line-height: 18px;
}

.carers-hotline-divider {
  width: 1px;
  height: 12px;
  flex: 0 0 1px;
  background: #ababab;
  margin: 0 2px;
}

.carers-hotline-toggle {
  flex: 0 0 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--adp-chat-footer-icon-color, #ff7833);
  cursor: pointer;
}

.carers-hotline-toggle:focus,
.carers-hotline-toggle:focus-visible,
.carers-hotline-toggle:active {
  outline: none;
  box-shadow: none;
}

.carers-hotline-toggle:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.carers-hotline-toggle svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.18s ease;
}

.carers-hotline-toggle[aria-expanded="false"] svg {
  transform: rotate(180deg);
}

.carers-hotline-detail {
  min-height: 32px;
  padding: 4px 16px;
  border-radius: 0 0 12px 12px;
  background: var(--adp-chat-hotline-background, #ecfdf0);
  color: #101111;
  font-size: 16px;
  line-height: 24px;
  text-align: left;
}
</style>
