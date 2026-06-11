"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ADPChatEmbedApi = {
  setLanguage?: (
    language: string,
    overrides?: Record<string, unknown>,
  ) => unknown;
  changeLanguage?: (
    language: string,
    overrides?: Record<string, unknown>,
  ) => unknown;
  setVoiceInput?: (enabled: boolean) => void;
  setFileUpload?: (enabled: boolean) => void;
  setAccessibility?: (options: {
    language?: string;
    label?: string;
    role?: string;
    fontScale?: number;
  }) => void;
};

declare global {
  interface Window {
    ADPChatEmbed?: ADPChatEmbedApi;
  }
}

type AdpChatEmbedControlsProps = {
  locale: string;
};

type FontSize = "small" | "medium" | "large";

const embedOrigin = "https://e7fd-45-144-227-44.ngrok-free.app";

const controlClass =
  "rounded px-3 py-2 text-xs font-medium shadow-md transition disabled:cursor-not-allowed disabled:opacity-50";

const controlStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #d1d5db",
  color: "#111827",
};

const activeControlStyle: CSSProperties = {
  ...controlStyle,
  backgroundColor: "#111827",
  border: "1px solid #111827",
  color: "#ffffff",
};

const mapLocaleToAdpLanguage = (locale: string) => {
  if (locale === "zh") return "zh-HK";
  return "en";
};

const getConfigLanguageFileKey = (language: string) => {
  if (language === "zh-HK") return "zh-HK";
  if (language === "zh_CN") return "zh_CN";
  return "en";
};

const getAccessibilityLabel = (language: string) => {
  if (language === "en") return "Customer support chatbot";
  if (language === "zh_CN") return "客户支援聊天机器人";
  return "客戶支援聊天機械人";
};

const fontScaleBySize: Record<FontSize, number> = {
  small: 1,
  medium: 1.05,
  large: 1.1,
};

const languageOptions = [
  { label: "EN", value: "en" },
  { label: "ZH-HK", value: "zh-HK" },
  { label: "ZH-CN", value: "zh_CN" },
] as const;

const fontSizeOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
] as const;

const AdpChatEmbedControls = ({ locale }: AdpChatEmbedControlsProps) => {
  const initialLanguageRef = useRef(mapLocaleToAdpLanguage(locale));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const syncedSettingsKeyRef = useRef("");
  const [isReady, setIsReady] = useState(false);
  const [isFrameExpanded, setIsFrameExpanded] = useState(false);
  const [language, setLanguage] = useState(initialLanguageRef.current);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(false);
  const [fileUploadEnabled, setFileUploadEnabled] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("medium");

  const initialLanguage = initialLanguageRef.current;
  const initialConfigLanguageFileKey =
    getConfigLanguageFileKey(initialLanguage);
  const embedConfig = useMemo(
    () => ({
      theme: "light",
      language: initialLanguage,
      mode: "standard",
      isOpen: false,
      enableVoiceInput: false,
      enableFileUpload: false,
      launcherPosition: "bottom-right",
      apiConfig: {
        baseURL: embedOrigin,
        withCredentials: true,
      },
    }),
    [initialLanguage],
  );

  const iframeSrcDoc = useMemo(
    () => `<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<style>
			html,
			body {
				width: 100%;
				height: 100%;
				margin: 0;
				background: transparent !important;
				overflow: hidden;
			}
			#adp-chat-embed-root {
				position: fixed;
				width: 0;
				height: 0;
				overflow: visible;
				pointer-events: none;
				bottom: 0;
				right: 0;
			}

			#adp-chat-embed-root > * {
				pointer-events: auto;
			}
		</style>
	</head>
	<body>
		<script>
			window.ADPChatEmbedConfig = ${JSON.stringify(embedConfig)};
		</script>
		<script
			src="${embedOrigin}/static/adp-chat-component/umd/embed.js"
			data-config-url="${embedOrigin}/mock/carer/chatbot-config.${initialConfigLanguageFileKey}.json"
			data-language="${initialLanguage}"
			data-enable-voice-input="false"
			data-enable-file-upload="false"
			data-launcher-offset-x="84"
			data-launcher-offset-y="32"
			data-theme="light"
			defer
		></script>
	</body>
</html>`,
    [embedConfig, initialConfigLanguageFileKey, initialLanguage],
  );

  const getEmbedApi = useCallback(() => {
    try {
      return iframeRef.current?.contentWindow?.ADPChatEmbed;
    } catch {
      return undefined;
    }
  }, []);

  const syncEmbedSettings = useCallback(
    (
      nextLanguage = language,
      nextVoiceInputEnabled = voiceInputEnabled,
      nextFileUploadEnabled = fileUploadEnabled,
      nextFontSize = fontSize,
    ) => {
      const api = getEmbedApi();
      if (!api) return false;

      const settingsKey = [
        nextLanguage,
        nextVoiceInputEnabled ? "voice-on" : "voice-off",
        nextFileUploadEnabled ? "upload-on" : "upload-off",
        nextFontSize,
      ].join("|");

      if (syncedSettingsKeyRef.current === settingsKey) {
        return true;
      }

      if (api.changeLanguage) {
        api.changeLanguage(nextLanguage);
      } else {
        api.setLanguage?.(nextLanguage);
      }

      api.setVoiceInput?.(nextVoiceInputEnabled);
      api.setFileUpload?.(nextFileUploadEnabled);
      api.setAccessibility?.({
        language: nextLanguage,
        label: getAccessibilityLabel(nextLanguage),
        role: "region",
        fontScale: fontScaleBySize[nextFontSize],
      });

      syncedSettingsKeyRef.current = settingsKey;
      return true;
    },
    [fileUploadEnabled, fontSize, getEmbedApi, language, voiceInputEnabled],
  );

  useEffect(() => {
    const handleEmbedMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;

      const data = event.data;
      if (!data || data.source !== "ADPChatEmbed") return;

      if (data.type === "ADP_CHAT_OVERLAY_CHANGE") {
        setIsFrameExpanded(data.isExpanded === true);
      }

      if (data.type === "ADP_CHAT_OPEN_CHANGE" && data.isOpen === false) {
        setIsFrameExpanded(false);
      }
    };

    window.addEventListener("message", handleEmbedMessage);
    return () => window.removeEventListener("message", handleEmbedMessage);
  }, []);

  useEffect(() => {
    const updateReadyState = () => {
      const ready = Boolean(getEmbedApi());
      setIsReady(ready);

      if (ready) {
        syncEmbedSettings();
      } else {
        syncedSettingsKeyRef.current = "";
      }
    };

    updateReadyState();
    const intervalId = window.setInterval(updateReadyState, 500);
    return () => window.clearInterval(intervalId);
  }, [getEmbedApi, syncEmbedSettings]);

  useEffect(() => {
    syncEmbedSettings();
  }, [
    fileUploadEnabled,
    fontSize,
    language,
    syncEmbedSettings,
    voiceInputEnabled,
  ]);

  const updateLanguage = (nextLanguage: string) => {
    setLanguage(nextLanguage);
    syncEmbedSettings(
      nextLanguage,
      voiceInputEnabled,
      fileUploadEnabled,
      fontSize,
    );
  };

  const updateVoiceInput = (enabled: boolean) => {
    setVoiceInputEnabled(enabled);
    syncEmbedSettings(language, enabled, fileUploadEnabled, fontSize);
  };

  const updateFileUpload = (enabled: boolean) => {
    setFileUploadEnabled(enabled);
    syncEmbedSettings(language, voiceInputEnabled, enabled, fontSize);
  };

  const updateFontSize = (nextFontSize: FontSize) => {
    setFontSize(nextFontSize);
    syncEmbedSettings(
      language,
      voiceInputEnabled,
      fileUploadEnabled,
      nextFontSize,
    );
  };

  return (
    <>
      <iframe
        ref={iframeRef}
        title="ADP chat embed test"
        srcDoc={iframeSrcDoc}
        allow="microphone; clipboard-read; clipboard-write"
        className={
          isFrameExpanded
            ? "fixed inset-0 z-[1001] h-[100dvh] w-screen max-h-none max-w-none border-0 bg-transparent"
            : "fixed bottom-0 right-0 z-[999] h-[620px] w-[430px] max-h-[100vh] max-w-[100vw] border-0 bg-transparent"
        }
      />
      <div className="fixed right-4 top-4 z-[1000] flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-end gap-2">
        {languageOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={controlClass}
            style={
              language === option.value ? activeControlStyle : controlStyle
            }
            disabled={!isReady}
            onClick={() => updateLanguage(option.value)}
          >
            {option.label}
          </button>
        ))}

        <button
          type="button"
          className={controlClass}
          style={voiceInputEnabled ? activeControlStyle : controlStyle}
          disabled={!isReady}
          onClick={() => updateVoiceInput(!voiceInputEnabled)}
        >
          Voice {voiceInputEnabled ? "On" : "Off"}
        </button>

        <button
          type="button"
          className={controlClass}
          style={fileUploadEnabled ? activeControlStyle : controlStyle}
          disabled={!isReady}
          onClick={() => updateFileUpload(!fileUploadEnabled)}
        >
          Upload {fileUploadEnabled ? "On" : "Off"}
        </button>

        {fontSizeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={controlClass}
            style={
              fontSize === option.value ? activeControlStyle : controlStyle
            }
            disabled={!isReady}
            onClick={() => updateFontSize(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default AdpChatEmbedControls;
