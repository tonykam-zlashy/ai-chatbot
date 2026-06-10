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
  init?: (config?: Record<string, unknown>) => void;
  update?: (config: Record<string, unknown>) => void;
  open?: () => void;
  close?: () => void;
  toggle?: () => void;
  setLanguage?: (language: string) => void;
  changeLanguage?: (
    language: string,
    overrides?: Record<string, unknown>,
  ) => void;
  setTheme?: (theme: string) => void;
  setLauncherIcon?: (url: string) => void;
  setLauncherPosition?: (
    position: string,
    offsetX?: string | number,
    offsetY?: string | number,
  ) => void;
  setVoiceInput?: (enabled: boolean) => void;
  setFileUpload?: (enabled: boolean) => void;
  setAccessibility: (options: {
    language?: string;
    label?: string;
    role?: string;
    fontScale?: number;
    highContrast?: boolean;
    reducedMotion?: boolean;
    theme?: string;
  }) => void;
  getConfig?: () => unknown;
  getAccessibility?: () => unknown;
};

declare global {
  interface Window {
    ADPChatEmbed?: ADPChatEmbedApi;
  }
}

const buttonClass =
  "rounded px-3 py-2 text-xs font-medium shadow-md transition disabled:cursor-not-allowed disabled:opacity-50";

const buttonStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #d1d5db",
  color: "#111827",
};

const statusStyle: CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
};

const embedOrigin = "https://e7fd-45-144-227-44.ngrok-free.app";
const launcherIconUrl = "https://example.com/custom-chatbot.gif";
const publicApiMethods = [
  "init",
  "open",
  "close",
  "toggle",
  "update",
  "setLanguage",
  "changeLanguage",
  "setTheme",
  "setLauncherIcon",
  "setLauncherPosition",
  "setVoiceInput",
  "setFileUpload",
  "setAccessibility",
  "getConfig",
  "getAccessibility",
] as const;

type AdpChatEmbedControlsProps = {
  locale: string;
};

const mapLocaleToAdpLanguage = (locale: string) => {
  if (locale === "zh") {
    return "zh-HK";
  }
  return "en";
};

const getAccessibilityLabel = (locale: string) => {
  if (locale === "zh") {
    return "客戶支援聊天機械人";
  }
  return "Customer support chatbot";
};

const AdpChatEmbedControls = ({ locale }: AdpChatEmbedControlsProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const openedFrameRef = useRef(false);
  const syncedSettingsKeyRef = useRef("");
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("closed");
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [featureTogglesEnabled, setFeatureTogglesEnabled] = useState(true);
  const [darkThemeEnabled, setDarkThemeEnabled] = useState(false);
  const adpLanguage = mapLocaleToAdpLanguage(locale);
  const embedConfig = useMemo(
    () => ({
      theme: "light",
      language: adpLanguage,
      mode: "standard",
      isOpen: false,
      launcherPosition: "bottom-right",
      apiConfig: {
        baseURL: embedOrigin,
        withCredentials: true,
      },
    }),
    [adpLanguage],
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
			data-config-url="${embedOrigin}/mock/carer/chatbot-config.zh-HK.json"
			data-language="${adpLanguage}"
			data-launcher-offset-x="84"
			data-launcher-offset-y="32"
			data-theme="light"
			defer
		></script>
	</body>
</html>`,
    [adpLanguage, embedConfig],
  );

  const getEmbedApi = useCallback(() => {
    try {
      return iframeRef.current?.contentWindow?.ADPChatEmbed;
    } catch {
      return undefined;
    }
  }, []);

  const syncEmbedSettings = useCallback(
    (nextAccessibilityEnabled = accessibilityEnabled) => {
      const api = getEmbedApi();

      if (!api) {
        return false;
      }

      const settingsKey = [
        adpLanguage,
        getAccessibilityLabel(locale),
        nextAccessibilityEnabled ? "a11y-on" : "a11y-off",
      ].join("|");

      if (syncedSettingsKeyRef.current === settingsKey) {
        return true;
      }

      api.changeLanguage?.(adpLanguage);
      api.setLanguage?.(adpLanguage);
      api.setAccessibility({
        language: adpLanguage,
        label: getAccessibilityLabel(locale),
        role: "region",
        fontScale: nextAccessibilityEnabled ? 1.25 : 1,
        highContrast: nextAccessibilityEnabled,
        reducedMotion: nextAccessibilityEnabled,
        theme: nextAccessibilityEnabled ? "dark" : "light",
      });
      syncedSettingsKeyRef.current = settingsKey;

      return true;
    },
    [accessibilityEnabled, adpLanguage, getEmbedApi, locale],
  );

  useEffect(() => {
    const updateReadyState = () => {
      const api = getEmbedApi();
      const ready = Boolean(api);
      setIsReady(ready);

      if (ready) {
        syncEmbedSettings();

        if (isOpen && !openedFrameRef.current) {
          api?.open();
          openedFrameRef.current = true;
          setStatus("open");
        } else {
          setStatus((current) =>
            current === "opening" || current === "closed" ? "ready" : current,
          );
        }
      } else {
        syncedSettingsKeyRef.current = "";
        openedFrameRef.current = false;
        setIsReady(false);
      }
    };

    updateReadyState();

    const intervalId = window.setInterval(updateReadyState, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [getEmbedApi, isOpen, syncEmbedSettings]);

  useEffect(() => {
    if (syncEmbedSettings()) {
      setStatus(adpLanguage);
    }
  }, [adpLanguage, syncEmbedSettings]);

  const runAction = useCallback(
    (label: string, action: (api: ADPChatEmbedApi) => void) => {
      const api = getEmbedApi();

      if (!api) {
        setStatus("not ready");
        return;
      }

      try {
        action(api);
        setStatus(label);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "failed");
      }
    },
    [getEmbedApi],
  );

  const runApiSmokeTest = useCallback(() => {
    runAction("api smoke", (api) => {
      const missingMethods = publicApiMethods.filter(
        (method) => typeof api[method] !== "function",
      );

      if (missingMethods.length > 0) {
        throw new Error(`missing: ${missingMethods.join(", ")}`);
      }

      api.init?.(embedConfig);
      api.update?.({
        logoTitle: "Support",
        width: 420,
        height: "80vh",
        isOpen: true,
        theme: "dark",
      });
      api.setLanguage?.("en");
      api.changeLanguage?.("zh-HK", {
        chatI18n: {
          sendError: "Unable to send message",
        },
        senderI18n: {
          placeholder: "Type your message",
        },
      });
      api.changeLanguage?.("zh_CN");
      api.setTheme?.("light");
      api.setLauncherIcon?.(launcherIconUrl);
      api.setLauncherPosition?.("bottom-left", 24, 32);
      api.setVoiceInput?.(true);
      api.setFileUpload?.(true);
      api.setAccessibility({
        language: adpLanguage,
        label: getAccessibilityLabel(locale),
        role: "region",
        fontScale: 1.2,
        highContrast: true,
        reducedMotion: true,
        theme: "dark",
      });
      api.getConfig?.();
      api.getAccessibility?.();
      api.open?.();
      api.toggle?.();
      api.close?.();
    });
  }, [adpLanguage, embedConfig, locale, runAction]);

  return (
    <>
      <iframe
        ref={iframeRef}
        title="ADP chat embed test"
        srcDoc={iframeSrcDoc}
        className="fixed bottom-0 right-0 z-[999] h-[620px] w-[430px] max-h-[100vh] max-w-[100vw] border-0 bg-transparent"
      />
      <div className="fixed right-4 top-4 z-[1000] flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          onClick={() => {
            openedFrameRef.current = false;
            setIsOpen(true);
            setStatus("opening");
          }}
        >
          Open
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("init", (api) => {
              api.init?.(embedConfig);
              openedFrameRef.current = false;
              setIsOpen(false);
            })
          }
        >
          Init
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("close", (api) => {
              api.close?.();
              openedFrameRef.current = false;
              setIsOpen(false);
              setIsReady(false);
              setStatus("closed");
            })
          }
        >
          Close
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("toggle", (api) => {
              api.toggle?.();
              setIsOpen((current) => !current);
            })
          }
        >
          Toggle
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("update", (api) => {
              api.update?.({
                logoTitle: "Support",
                width: 420,
                height: "80vh",
                isOpen: true,
                theme: darkThemeEnabled ? "light" : "dark",
              });
              setDarkThemeEnabled((current) => !current);
            })
          }
        >
          Update
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("en", (api) => {
              api.changeLanguage?.("en");
              api.setLanguage?.("en");
              api.setAccessibility({
                language: "en",
                label: "Customer support chatbot",
                role: "region",
                fontScale: accessibilityEnabled ? 1.25 : 1,
                highContrast: accessibilityEnabled,
                reducedMotion: accessibilityEnabled,
                theme: accessibilityEnabled ? "dark" : "light",
              });
            })
          }
        >
          EN
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("zh-HK", (api) => {
              api.changeLanguage?.("zh-HK");
              api.setLanguage?.("zh-HK");
              api.setAccessibility({
                language: "zh-HK",
                label: "客戶支援聊天機械人",
                role: "region",
                fontScale: accessibilityEnabled ? 1.25 : 1,
                highContrast: accessibilityEnabled,
                reducedMotion: accessibilityEnabled,
                theme: accessibilityEnabled ? "dark" : "light",
              });
            })
          }
        >
          ZH-HK
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("zh_CN", (api) => {
              api.changeLanguage?.("zh_CN");
              api.setLanguage?.("zh_CN");
            })
          }
        >
          ZH_CN
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction(darkThemeEnabled ? "light" : "dark", (api) => {
              const theme = darkThemeEnabled ? "light" : "dark";
              api.setTheme?.(theme);
              setDarkThemeEnabled((current) => !current);
            })
          }
        >
          Theme
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("icon", (api) => {
              api.setLauncherIcon?.(launcherIconUrl);
            })
          }
        >
          Icon
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("position", (api) => {
              api.setLauncherPosition?.("bottom-left", 24, 32);
            })
          }
        >
          Position
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction(
              featureTogglesEnabled ? "features off" : "features on",
              (api) => {
                const enabled = !featureTogglesEnabled;
                api.setVoiceInput?.(enabled);
                api.setFileUpload?.(enabled);
                setFeatureTogglesEnabled(enabled);
              },
            )
          }
        >
          Features
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("a11y", () => {
              setAccessibilityEnabled(true);
              syncEmbedSettings(true);
            })
          }
        >
          A11y
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("inspect", (api) => {
              const config = api.getConfig?.();
              const accessibility = api.getAccessibility?.();
              setStatus(
                `config:${config ? "yes" : "no"} a11y:${
                  accessibility ? "yes" : "no"
                }`,
              );
            })
          }
        >
          Inspect
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={runApiSmokeTest}
        >
          Smoke
        </button>
        <button
          type="button"
          className={buttonClass}
          style={buttonStyle}
          disabled={!isReady}
          onClick={() =>
            runAction("reset", (api) => {
              setAccessibilityEnabled(false);
              setDarkThemeEnabled(false);
              setFeatureTogglesEnabled(true);
              api.setVoiceInput?.(true);
              api.setFileUpload?.(true);
              api.setTheme?.("light");
              api.setLauncherPosition?.("bottom-right", 84, 32);
              syncEmbedSettings(false);
            })
          }
        >
          Reset
        </button>
        <span
          className="rounded px-2 py-1 text-xs shadow-md"
          style={statusStyle}
          aria-live="polite"
        >
          {status}
        </span>
      </div>
    </>
  );
};

export default AdpChatEmbedControls;
