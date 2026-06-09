import type { ChatbotConfig } from "adp-chat-component";

export type FixtureLanguage = "zh-HK" | "en-US";

const fixtureByLanguage: Record<string, FixtureLanguage> = {
  zh: "zh-HK",
  "zh-HK": "zh-HK",
  en: "en-US",
  "en-US": "en-US",
};

const defaultConfigByLanguage: Record<FixtureLanguage, ChatbotConfig> = {
  "zh-HK": {
    appId: "carers-poc",
    language: "zh-HK",
    assistant: {
      name: "Assistant",
      headerTitle: "Assistant",
      launcherAvatarUrl: "",
      messageAvatarUrl: "",
      greeting: "Hello",
    },
    launcher: {
      enabled: true,
      prompt: "",
      position: "bottom-right",
      offsetX: 22,
      offsetY: 16,
    },
    panel: {
      width: 380,
      height: 600,
      mobileMode: "fullscreen",
    },
    theme: {
      mode: "default",
      headerBackground: "linear-gradient(180deg, #FFC284 0%, #FF7833 100%)",
      surfaceBackground: "#ffffff",
      primaryAction: "#B84319",
      bubbleBorder: "#B84319",
      userBubbleBackground: "#B84319",
      userBubbleText: "#FFFFFF",
      userBubbleBorder: "none",
      assistantBubbleBackground: "#FFEFD6",
      assistantText: "#B84319",
      timestampText: "#777",
      footerBackground:
        "linear-gradient(0deg, #FFEFD6 16.5%, #ffffff 100%), linear-gradient(180deg, #FFEFD6 0%, #FFC284 100%)",
      footerIconColor: "#FF7833",
      hotlineBackground: "#ECFDF0",
      hotlineText: "#139C6C",
    },
    terms: {
      enabled: true,
      storageScope: "global",
      intro: "使用前請先細閱並接受下列條款及細則。",
      links: [],
      acceptInstruction: "如同意使用條款及細則，請點擊接受按鈕。",
      scamNoticeBefore: "",
      scamNoticeAfter: "",
      acceptButton: "接受",
      declineButton: "拒絕",
      acceptedUserText: "接受",
    },
    composer: {
      disabledPlaceholder: "請先接受條款與細則後繼續",
      enabledPlaceholder: "請輸入",
    },
    hotline: {
      number: "",
      label: "",
      description: "",
      url: "",
    },
    features: {
      termsGate: true,
      fileUpload: true,
      voiceInput: true,
      mockChat: true,
    },
    mockChat: {
      reply:
        "對不起，系統暫時未能分析您的查詢。請您再輸入問題，或提供其他資料以便系統再作分析。",
      errorReply:
        "對不起，系統暫時未能分析您的查詢。請您再輸入問題，或提供其他資料以便系統再作分析。",
    },
  },
  "en-US": {
    appId: "carers-poc",
    language: "en-US",
    assistant: {
      name: "Assistant",
      headerTitle: "Assistant",
      launcherAvatarUrl: "",
      messageAvatarUrl: "",
      greeting: "Hello",
    },
    launcher: {
      enabled: true,
      prompt: "",
      position: "bottom-right",
      offsetX: 22,
      offsetY: 16,
    },
    panel: {
      width: 380,
      height: 600,
      mobileMode: "fullscreen",
    },
    theme: {
      mode: "default",
      headerBackground: "linear-gradient(180deg, #FFC284 0%, #FF7833 100%)",
      surfaceBackground: "#ffffff",
      primaryAction: "#B84319",
      bubbleBorder: "#B84319",
      userBubbleBackground: "#B84319",
      userBubbleText: "#FFFFFF",
      userBubbleBorder: "none",
      assistantBubbleBackground: "#FFEFD6",
      assistantText: "#B84319",
      timestampText: "#777",
      footerBackground:
        "linear-gradient(0deg, #FFEFD6 16.5%, #ffffff 100%), linear-gradient(180deg, #FFEFD6 0%, #FFC284 100%)",
      footerIconColor: "#FF7833",
      hotlineBackground: "#ECFDF0",
      hotlineText: "#139C6C",
    },
    terms: {
      enabled: true,
      storageScope: "global",
      intro: "Please read and accept the terms and conditions before use.",
      links: [],
      acceptInstruction:
        "Click Accept if you agree to the terms and conditions.",
      scamNoticeBefore: "",
      scamNoticeAfter: "",
      acceptButton: "ACCEPT",
      declineButton: "REJECT",
      acceptedUserText: "Accept",
    },
    composer: {
      disabledPlaceholder: "Please accept T&C",
      enabledPlaceholder: "Type here",
    },
    hotline: {
      number: "",
      label: "",
      description: "",
      url: "",
    },
    features: {
      termsGate: true,
      fileUpload: true,
      voiceInput: true,
      mockChat: true,
    },
    mockChat: {
      reply:
        "Sorry, the system is temporarily unable to analyze your query. Please enter your question again or provide more information for further analysis.",
      errorReply:
        "Sorry, the system is temporarily unable to analyze your query. Please enter your question again or provide more information for further analysis.",
    },
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const mergeRecord = <T extends object>(defaults: T, value: unknown): T =>
  ({
    ...defaults,
    ...(isRecord(value) ? value : {}),
  }) as T;

const normalizeConfig = (
  value: unknown,
  language: FixtureLanguage,
): ChatbotConfig => {
  const defaults = defaultConfigByLanguage[language];
  const raw = isRecord(value) ? value : {};
  const assistant = mergeRecord(defaults.assistant, raw.assistant);
  const terms = mergeRecord(defaults.terms, raw.terms);

  return {
    ...defaults,
    ...raw,
    assistant,
    launcher: mergeRecord(defaults.launcher, raw.launcher),
    panel: mergeRecord(defaults.panel, raw.panel),
    theme: mergeRecord(defaults.theme, raw.theme),
    terms: {
      ...terms,
      links: Array.isArray(terms.links) ? terms.links : defaults.terms.links,
    },
    composer: mergeRecord(defaults.composer, raw.composer),
    hotline: mergeRecord(defaults.hotline, raw.hotline),
    features: mergeRecord(defaults.features, raw.features),
    mockChat: mergeRecord(defaults.mockChat, raw.mockChat),
  } as ChatbotConfig;
};

export const resolveFixtureLanguage = (
  language: string | undefined,
): FixtureLanguage => fixtureByLanguage[language || ""] || "zh-HK";

const resolveFixtureUrl = (fixtureLanguage: FixtureLanguage) => {
  const publicBase = import.meta.env.BASE_URL || "./";
  const baseUrl = new URL(publicBase, window.location.href);
  return new URL(
    `mock/carer/chatbot-config.${fixtureLanguage}.json`,
    baseUrl,
  ).toString();
};

/**
 * Loads the frontend POC fixture that mirrors the future public chatbot config
 * API response. Missing fixture fields are filled from defensive defaults only.
 */
export const loadChatbotConfigFixture = async (
  language: string | undefined,
): Promise<ChatbotConfig> => {
  const fixtureLanguage = resolveFixtureLanguage(language);
  const response = await fetch(resolveFixtureUrl(fixtureLanguage), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load chatbot fixture: ${response.status}`);
  }

  return normalizeConfig(await response.json(), fixtureLanguage);
};
