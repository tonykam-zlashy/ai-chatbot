<script setup lang="ts">
import {
  ADPChat,
  type ApiConfig,
  type Application,
  type ChatConversation,
  type ChatbotConfig,
} from "adp-chat-component";
import { onMounted, onUnmounted, computed, ref, watch } from "vue";
import { useUiStore } from "@/stores/ui";
import { logout } from "@/service/login";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { languageMap } from "@/i18n";
import { getBaseURL } from "@/utils/url";
import { loadChatbotConfigFixture } from "@/utils/chatbotConfig";
import Logo from "@/assets/img/favicon.png";

const router = useRouter();
const uiStore = useUiStore();
const route = useRoute();
const { t } = useI18n();
const FRONTEND_POC_MODE = false;

// 当前选中的应用和会话（用于 URL 同步）
const currentApplicationId = ref<string>("");
const currentConversationId = ref<string>("");
const chatbotConfig = ref<ChatbotConfig | null>(null);
const chatbotConfigLoading = ref(false);
const chatbotConfigError = ref("");
const externalPocConfigReceived = ref(false);
const embedHostMode = ref(false);

const LAST_CHAT_STORAGE_KEY = "adp_chat_last_conversation";

type LastChatState = {
  conversationId?: string;
  applicationId?: string;
};

const hasBrowserStorage = () =>
  typeof window !== "undefined" && !!window.localStorage;

const readLastChatState = (): LastChatState => {
  if (!hasBrowserStorage()) {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(LAST_CHAT_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as LastChatState;
    return {
      conversationId: parsedValue.conversationId || "",
      applicationId: parsedValue.applicationId || "",
    };
  } catch (error) {
    console.warn("Failed to read last chat state from localStorage", error);
    return {};
  }
};

const persistLastChatState = (
  conversationId: string,
  applicationId?: string,
) => {
  if (!hasBrowserStorage() || !conversationId) {
    return;
  }

  const state: LastChatState = {
    conversationId,
    applicationId: applicationId || currentApplicationId.value || "",
  };

  window.localStorage.setItem(LAST_CHAT_STORAGE_KEY, JSON.stringify(state));
};

const clearLastChatState = () => {
  if (!hasBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(LAST_CHAT_STORAGE_KEY);
};

// API 配置 - 使用组件自动加载数据

const apiConfig: ApiConfig = {
  baseURL: getBaseURL(),
  timeout: 1000 * 60,
  apiDetailConfig: {
    applicationListApi: "/application/list",
    conversationListApi: "/chat/conversations",
    conversationDetailApi: "/chat/messages",
    sendMessageApi: "/chat/message",
    rateApi: "/feedback/rate",
    shareApi: "/share/create",
    userInfoApi: "/account/info",
    uploadApi: "/file/upload",
    asrUrlApi: "/helper/asr/url",
    systemConfigApi: "/system/config",
  },
};

// 语言选项
const languageOptions = computed(() => {
  return Object.entries(languageMap).map(([key, value]) => ({
    key,
    value,
  }));
});

// 侧边栏国际化
const sideI18n = computed(() => ({
  more: t("common.more"),
  collapse: t("common.collapse"),
  today: t("common.today"),
  recent: t("common.recent"),
  switchTheme: t("sider.switchTheme"),
  selectLanguage: t("sider.selectLanguage"),
  logout: t("account.logout"),
}));

// 聊天国际化
const chatI18n = computed(() => ({
  uploading: t("common.uploading"),
  loading: t("common.loading"),
  thinking: t("common.thinking"),
  checkAll: t("operation.checkAll"),
  shareFor: t("operation.shareFor"),
  copyUrl: t("operation.copyUrl"),
  cancelShare: t("operation.cancelShare"),
  sendError: t("conversation.sendError"),
  networkError: t("conversation.networkError"),
  loginExpired: t("conversation.loginExpired"),
  createConversation: t("conversation.createConversation"),
  copySuccess: t("common.copySuccess"),
  copyFailed: t("common.copyFailed"),
  shareFailed: t("common.shareFailed"),
  rateFailed: t("common.rateFailed"),
  loadMoreFailed: t("common.loadMoreFailed"),
  getAppListFailed: t("common.getAppListFailed"),
  getConversationListFailed: t("common.getConversationListFailed"),
  getConversationDetailFailed: t("common.getConversationDetailFailed"),
}));

// ChatItem 国际化
const chatItemI18n = computed(() => ({
  thinking: t("conversation.thinking"),
  deepThinkingFinished: t("conversation.deepThinkingFinished"),
  deepThinkingExpand: t("conversation.deepThinkingExpand"),
  copy: t("operation.copy"),
  replay: t("operation.replay"),
  share: t("operation.share"),
  good: t("operation.good"),
  bad: t("operation.bad"),
  thxForGood: t("operation.thxForGood"),
  thxForBad: t("operation.thxForBad"),
  references: t("sender.references"),
}));

// Sender 国际化
const senderI18n = computed(() => ({
  placeholder:
    chatbotConfig.value?.composer.enabledPlaceholder ||
    t("conversation.input.placeholder"),
  placeholderMobile:
    chatbotConfig.value?.composer.enabledPlaceholder ||
    t("conversation.input.placeholderMobile"),
  uploadImg: t("sender.uploadImg"),
  startRecord: t("sender.startRecord"),
  stopRecord: t("sender.stopRecord"),
  answering: t("sender.answering"),
  notSupport: t("sender.notSupport"),
  uploadError: t("sender.uploadError"),
  recordTooLong: t("sender.recordTooLong"),
  asrServiceFailed: t("sender.asrServiceFailed"),
  recordFailed: t("sender.recordFailed"),
  chromeSecurityError: t("sender.chromeSecurityError"),
  browserNotSupport: t("sender.browserNotSupport"),
  audioContextNotSupport: t("sender.audioContextNotSupport"),
  webAudioApiNotSupport: t("sender.webAudioApiNotSupport"),
  mediaStreamSourceNotSupport: t("sender.mediaStreamSourceNotSupport"),
}));

const pocApplication = computed<Application | undefined>(() => {
  const config = chatbotConfig.value;
  if (!config) return undefined;

  return {
    ApplicationId: config.appId,
    Name: config.assistant.headerTitle || config.assistant.name,
    Avatar: config.assistant.messageAvatarUrl,
    Greeting: config.assistant.greeting,
    OpeningQuestions: [],
    Pattern: "standard",
  };
});

const pocLanguage = computed(
  () =>
    chatbotConfig.value?.language ||
    (uiStore.language === "en" ? "en-US" : "zh-HK"),
);
const pocTheme = computed(() =>
  chatbotConfig.value ? "light" : uiStore.theme || "light",
);
const pocFeatureFlags = computed(
  () =>
    chatbotConfig.value?.features || {
      termsGate: true,
      fileUpload: false,
      voiceInput: false,
      mockChat: false,
    },
);

const loadPocConfig = async () => {
  if (externalPocConfigReceived.value) return;

  chatbotConfigLoading.value = true;
  chatbotConfigError.value = "";

  try {
    const config = await loadChatbotConfigFixture(uiStore.language);
    if (!externalPocConfigReceived.value) {
      chatbotConfig.value = config;
    }
  } catch (error) {
    chatbotConfig.value = null;
    chatbotConfigError.value =
      error instanceof Error ? error.message : "Failed to load chatbot fixture";
  } finally {
    chatbotConfigLoading.value = false;
  }
};

const handlePocConfigMessage = (event: MessageEvent) => {
  if (!FRONTEND_POC_MODE || event.source !== window.parent) return;
  const data = event.data as { type?: string; config?: ChatbotConfig };
  if (data?.type !== "adp-chatbot-config" || !data.config) return;

  externalPocConfigReceived.value = true;
  embedHostMode.value = true;
  chatbotConfig.value = data.config;
  chatbotConfigError.value = "";
  chatbotConfigLoading.value = false;
};

watch(
  () => uiStore.language,
  () => {
    void loadPocConfig();
  },
  { immediate: true },
);

/**
 * 页面挂载时执行的生命周期钩子
 * 1. 获取用户信息
 * 2. 初始化应用列表
 * 3. 更新聊天列表
 */
onMounted(async () => {
  console.log("[onMounted]");
  window.addEventListener("message", handlePocConfigMessage);

  // url参数 -> store
  updateFromUrl();
});

onUnmounted(() => {
  window.removeEventListener("message", handlePocConfigMessage);
});

/**
 * 页面url路径、参数处理
 * 1. url参数处理应该在pages层面，不能在组件里读写url参数（组件需要通过store，或者组件参数间接使用url参数）
 * 2. url参数和store应该保持一致，优先级：url参数 > store
 */

// URL 参数处理
const updateFromUrl = () => {
  console.log("updateFromUrl", route.params);
  if (!route.params.conversationId) {
    currentApplicationId.value = (route.params.applicationId as string) || "";
    currentConversationId.value = "";
  } else {
    currentConversationId.value = route.params.conversationId as string;
  }
};

const tryRestoreLastConversation = (conversations: ChatConversation[]) => {
  if (route.params.conversationId || currentConversationId.value) {
    return false;
  }

  const storedState = readLastChatState();
  if (!storedState.conversationId) {
    return false;
  }

  const storedConversation = conversations.find(
    (conversation) => conversation.Id === storedState.conversationId,
  );
  if (!storedConversation) {
    clearLastChatState();
    return false;
  }

  currentConversationId.value = storedConversation.Id;
  currentApplicationId.value =
    storedConversation.ApplicationId ||
    storedState.applicationId ||
    currentApplicationId.value;
  persistLastChatState(currentConversationId.value, currentApplicationId.value);
  updateUrl();

  return true;
};

// 监听路由参数变化
watch(
  () => route.params.applicationId,
  () => updateFromUrl(),
);
watch(
  () => route.params.conversationId,
  () => updateFromUrl(),
);

// 更新 URL
const updateUrl = () => {
  if (currentConversationId.value === "") {
    if (currentApplicationId.value) {
      router.push({
        name: "app",
        params: { applicationId: currentApplicationId.value },
      });
    }
  } else {
    router.push({
      name: "home",
      params: { conversationId: currentConversationId.value },
    });
  }
};

// 事件处理函数
const handleSelectApplication = (app: Application) => {
  currentApplicationId.value = app.ApplicationId || "";
  currentConversationId.value = "";
  clearLastChatState();
  updateUrl();
};

const handleSelectConversation = (conversation: ChatConversation) => {
  currentConversationId.value = conversation.Id;
  currentApplicationId.value = conversation.ApplicationId;
  persistLastChatState(conversation.Id, conversation.ApplicationId);
  updateUrl();
};

const handleCreateConversation = () => {
  currentConversationId.value = "";
  clearLastChatState();
  updateUrl();
};

const handleToggleTheme = () => {
  const newTheme = uiStore.theme === "light" ? "dark" : "light";
  uiStore.setTheme(newTheme);
};

const handleChangeLanguage = (key: string) => {
  uiStore.setLanguage(key as "en" | "zh");
};

const handleLogout = () => {
  logout(() => router.replace({ name: "login" }));
};

// 数据加载完成回调
const handleDataLoaded = (
  type: "applications" | "conversations" | "chatList" | "user" | "systemConfig",
  data: any,
) => {
  if (type === "conversations" && Array.isArray(data)) {
    if (tryRestoreLastConversation(data)) {
      return;
    }

    if (currentConversationId.value) {
      const currentConversation = data.find(
        (conversation: ChatConversation) =>
          conversation.Id === currentConversationId.value,
      );
      if (currentConversation) {
        currentApplicationId.value =
          currentConversation.ApplicationId || currentApplicationId.value;
        persistLastChatState(
          currentConversation.Id,
          currentConversation.ApplicationId,
        );
      }
    }
  }

  // 初始化时从 URL 同步状态
  if (type === "applications" && data.length > 0) {
    // 如果 URL 没有指定应用，默认选中第一个
    if (!currentApplicationId.value && !currentConversationId.value) {
      currentApplicationId.value = data[0].ApplicationId;
    }
    updateUrl();
  }
};

// 会话变化回调
const handleConversationChange = (conversationId: string) => {
  currentConversationId.value = conversationId;
  persistLastChatState(conversationId, currentApplicationId.value);
  updateUrl();
};
</script>

<template>
  <div v-if="FRONTEND_POC_MODE && chatbotConfigLoading" class="poc-status">
    {{ t("common.loading") }}
  </div>
  <div
    v-else-if="FRONTEND_POC_MODE && chatbotConfigError"
    class="poc-status poc-status--error"
  >
    {{ chatbotConfigError }}
  </div>
  <ADPChat
    v-else
    :apiConfig="apiConfig"
    :autoLoad="!FRONTEND_POC_MODE"
    :frontendPocMode="FRONTEND_POC_MODE"
    :chatbotConfig="chatbotConfig || undefined"
    :theme="pocTheme"
    :language="FRONTEND_POC_MODE ? pocLanguage : uiStore.language || 'zh'"
    :languageOptions="languageOptions"
    :isOverlay="false"
    :isSidePanelOverlay="true"
    :showCloseButton="!(FRONTEND_POC_MODE && embedHostMode)"
    :showOverlayButton="!(FRONTEND_POC_MODE && embedHostMode)"
    :logoUrl="Logo"
    :currentApplication="FRONTEND_POC_MODE ? pocApplication : undefined"
    :currentApplicationId="
      FRONTEND_POC_MODE
        ? pocApplication?.ApplicationId || ''
        : currentApplicationId
    "
    :currentConversationId="FRONTEND_POC_MODE ? '' : currentConversationId"
    :aiWarningText="t('common.aiWarning')"
    :createConversationText="t('conversation.createConversation')"
    :sideI18n="sideI18n"
    :chatI18n="chatI18n"
    :chatItemI18n="chatItemI18n"
    :senderI18n="senderI18n"
    :enableVoiceInput="FRONTEND_POC_MODE ? pocFeatureFlags.voiceInput : true"
    :enableFileUpload="FRONTEND_POC_MODE ? pocFeatureFlags.fileUpload : true"
    @selectApplication="handleSelectApplication"
    @selectConversation="handleSelectConversation"
    @createConversation="handleCreateConversation"
    @toggleTheme="handleToggleTheme"
    @changeLanguage="handleChangeLanguage"
    @logout="handleLogout"
    @dataLoaded="handleDataLoaded"
    @conversationChange="handleConversationChange"
  />
</template>

<style scoped>
:global(html),
:global(body),
:global(#app) {
  background: #fbf2df !important;
}

.poc-status {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: #fbf2df;
  color: #6f3516;
  font-size: 14px;
}

.poc-status--error {
  color: #b84222;
}
</style>
