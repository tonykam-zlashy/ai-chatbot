import type { ChatbotConfig } from 'adp-chat-component';

export type FixtureLanguage = 'zh-HK' | 'en-US';

const fixtureByLanguage: Record<string, FixtureLanguage> = {
  zh: 'zh-HK',
  'zh-HK': 'zh-HK',
  en: 'en-US',
  'en-US': 'en-US',
};

const defaultConfigByLanguage: Record<FixtureLanguage, ChatbotConfig> = {
  'zh-HK': {
    appId: 'carers-poc',
    language: 'zh-HK',
    assistant: {
      name: 'Assistant',
      headerTitle: 'Assistant',
      launcherAvatarUrl: '',
      messageAvatarUrl: '',
      greeting: 'Hello',
    },
    launcher: {
      enabled: true,
      prompt: '',
      position: 'bottom-right',
      offsetX: 22,
      offsetY: 16,
    },
    panel: {
      width: 380,
      height: 600,
      mobileMode: 'fullscreen',
    },
    theme: {
      mode: 'default',
      headerBackground: '#f7943d',
      surfaceBackground: '#fff8e8',
      primaryAction: '#b84222',
      bubbleBorder: '#b95a25',
      userBubbleBackground: '#b84222',
      userBubbleText: '#ffffff',
      assistantBubbleBackground: '#ffffff',
      assistantText: '#713614',
    },
    terms: {
      enabled: true,
      storageScope: 'global',
      titleTemplate: '你好，我是{{assistantName}}',
      intro: '使用前請先細閱並接受下列條款及細則。',
      links: [],
      acceptInstruction: '如同意使用條款及細則，請點擊接受按鈕。',
      scamNoticeBefore: '',
      scamNoticeAfter: '',
      acceptButton: '接受',
      declineButton: '拒絕',
      acceptedUserText: '接受',
    },
    composer: {
      disabledPlaceholder: '請先接受條款與細則後繼續',
      enabledPlaceholder: '請輸入',
    },
    hotline: {
      number: '',
      label: '',
      description: '',
      url: '',
    },
    features: {
      termsGate: true,
      fileUpload: true,
      voiceInput: true,
      mockChat: true,
    },
    mockChat: {
      reply: 'This is a frontend POC reply.',
    },
  },
  'en-US': {
    appId: 'carers-poc',
    language: 'en-US',
    assistant: {
      name: 'Assistant',
      headerTitle: 'Assistant',
      launcherAvatarUrl: '',
      messageAvatarUrl: '',
      greeting: 'Hello',
    },
    launcher: {
      enabled: true,
      prompt: '',
      position: 'bottom-right',
      offsetX: 22,
      offsetY: 16,
    },
    panel: {
      width: 380,
      height: 600,
      mobileMode: 'fullscreen',
    },
    theme: {
      mode: 'default',
      headerBackground: '#f7943d',
      surfaceBackground: '#fff8e8',
      primaryAction: '#b84222',
      bubbleBorder: '#b95a25',
      userBubbleBackground: '#b84222',
      userBubbleText: '#ffffff',
      assistantBubbleBackground: '#ffffff',
      assistantText: '#713614',
    },
    terms: {
      enabled: true,
      storageScope: 'global',
      titleTemplate: '{{assistantName}}',
      intro: 'Please read and accept the terms and conditions before use.',
      links: [],
      acceptInstruction: 'Click Accept if you agree to the terms and conditions.',
      scamNoticeBefore: '',
      scamNoticeAfter: '',
      acceptButton: 'ACCEPT',
      declineButton: 'REJECT',
      acceptedUserText: 'Accept',
    },
    composer: {
      disabledPlaceholder: 'Please accept T&C',
      enabledPlaceholder: 'Type here',
    },
    hotline: {
      number: '',
      label: '',
      description: '',
      url: '',
    },
    features: {
      termsGate: true,
      fileUpload: true,
      voiceInput: true,
      mockChat: true,
    },
    mockChat: {
      reply: 'This is a frontend POC reply.',
    },
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const mergeRecord = <T extends object>(defaults: T, value: unknown): T => ({
  ...defaults,
  ...(isRecord(value) ? value : {}),
}) as T;

const normalizeConfig = (value: unknown, language: FixtureLanguage): ChatbotConfig => {
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
      titleTemplate: String(terms.titleTemplate || defaults.terms.titleTemplate).replace(
        '{{assistantName}}',
        String(assistant.name || defaults.assistant.name),
      ),
      links: Array.isArray(terms.links) ? terms.links : defaults.terms.links,
    },
    composer: mergeRecord(defaults.composer, raw.composer),
    hotline: mergeRecord(defaults.hotline, raw.hotline),
    features: mergeRecord(defaults.features, raw.features),
    mockChat: mergeRecord(defaults.mockChat, raw.mockChat),
  } as ChatbotConfig;
};

export const resolveFixtureLanguage = (language: string | undefined): FixtureLanguage =>
  fixtureByLanguage[language || ''] || 'zh-HK';

const resolveFixtureUrl = (fixtureLanguage: FixtureLanguage) => {
  const publicBase = import.meta.env.BASE_URL || './';
  const baseUrl = new URL(publicBase, window.location.href);
  return new URL(`mock/chatbot-config.${fixtureLanguage}.json`, baseUrl).toString();
};

/**
 * Loads the frontend POC fixture that mirrors the future public chatbot config
 * API response. Missing fixture fields are filled from defensive defaults only.
 */
export const loadChatbotConfigFixture = async (language: string | undefined): Promise<ChatbotConfig> => {
  const fixtureLanguage = resolveFixtureLanguage(language);
  const response = await fetch(resolveFixtureUrl(fixtureLanguage), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to load chatbot fixture: ${response.status}`);
  }

  return normalizeConfig(await response.json(), fixtureLanguage);
};
