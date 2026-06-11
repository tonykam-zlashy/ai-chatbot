(function (window, document) {
  "use strict";

  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  var state = {
    mounted: false,
    containerSelector: "",
    config: null,
    configUrl: "",
    accessibility: {},
    onOpenChange: null,
    onOverlayChange: null,
  };

  function getAttr(name, fallback) {
    if (!currentScript) return fallback;
    var value = currentScript.getAttribute("data-" + name);
    return value === null || value === "" ? fallback : value;
  }

  function toBool(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    return !/^(false|0|no|off)$/i.test(String(value));
  }

  function toSize(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    var numeric = Number(value);
    return Number.isFinite(numeric) && String(value).trim() === String(numeric)
      ? numeric
      : value;
  }

  function parseJson(value, fallback) {
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn("[ADPChatEmbed] Failed to parse JSON config:", error);
      return fallback;
    }
  }

  function mergeConfig(base, override) {
    var result = {};
    var key;
    base = base || {};
    override = override || {};

    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        result[key] = base[key];
      }
    }

    for (key in override) {
      if (Object.prototype.hasOwnProperty.call(override, key)) {
        result[key] = override[key];
      }
    }

    result.apiConfig = Object.assign(
      {},
      base.apiConfig || {},
      override.apiConfig || {},
    );
    result.apiConfig.apiDetailConfig = Object.assign(
      {},
      (base.apiConfig && base.apiConfig.apiDetailConfig) || {},
      (override.apiConfig && override.apiConfig.apiDetailConfig) || {},
    );

    return result;
  }

  function mapChatbotConfig(config) {
    if (!config || !config.chatbotConfig) return config;

    var chatbotConfig = config.chatbotConfig;
    var assistant = chatbotConfig.assistant || {};
    var launcher = chatbotConfig.launcher || {};
    var panel = chatbotConfig.panel || {};
    var features = chatbotConfig.features || {};

    return mergeConfig(config, {
      language: normalizeLanguage(chatbotConfig.language || config.language),
      width: panel.width || config.width,
      height: panel.height || config.height,
      launcherIconUrl: assistant.launcherAvatarUrl || config.launcherIconUrl,
      launcherPrompt:
        launcher.prompt !== undefined ? launcher.prompt : config.launcherPrompt,
      launcherPosition: launcher.position || config.launcherPosition,
      launcherOffsetX:
        launcher.offsetX !== undefined
          ? launcher.offsetX
          : config.launcherOffsetX,
      launcherOffsetY:
        launcher.offsetY !== undefined
          ? launcher.offsetY
          : config.launcherOffsetY,
      showToggleButton:
        launcher.enabled !== false && config.showToggleButton !== false,
      enableVoiceInput:
        config.enableVoiceInput !== undefined
          ? config.enableVoiceInput
          : features.voiceInput !== false,
      enableFileUpload:
        config.enableFileUpload !== undefined
          ? config.enableFileUpload
          : features.fileUpload !== false,
      currentApplication: {
        ApplicationId: chatbotConfig.appId || "",
        Name: assistant.headerTitle || assistant.name || "",
        Avatar: assistant.messageAvatarUrl || "",
        Greeting: assistant.greeting || "",
        OpeningQuestions: [],
        Pattern: "standard",
      },
    });
  }

  function emitEmbedEvent(type, detail) {
    var payload = Object.assign(
      {
        source: "ADPChatEmbed",
        type: type,
      },
      detail || {},
    );

    try {
      window.dispatchEvent(new CustomEvent(type, { detail: payload }));
    } catch (error) {
      // CustomEvent may be unavailable in very old browsers; postMessage below
      // still provides the host-page integration path.
    }

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, "*");
    }
  }

  function handleOpenChange(isOpen) {
    state.config = mergeConfig(state.config || {}, { isOpen: !!isOpen });
    emitEmbedEvent("ADP_CHAT_OPEN_CHANGE", { isOpen: !!isOpen });

    if (typeof state.onOpenChange === "function") {
      state.onOpenChange(isOpen);
    }
  }

  function handleOverlayChange(isOverlay) {
    state.config = mergeConfig(state.config || {}, { isOverlay: !!isOverlay });
    emitEmbedEvent("ADP_CHAT_OVERLAY_CHANGE", {
      isOverlay: !!isOverlay,
      isExpanded: !isOverlay,
    });

    if (typeof state.onOverlayChange === "function") {
      state.onOverlayChange(isOverlay);
    }
  }

  function withEmbedCallbacks(config) {
    if (!config) return config;

    if (
      typeof config.onOpenChange === "function" &&
      config.onOpenChange !== handleOpenChange
    ) {
      state.onOpenChange = config.onOpenChange;
    }

    if (
      typeof config.onOverlayChange === "function" &&
      config.onOverlayChange !== handleOverlayChange
    ) {
      state.onOverlayChange = config.onOverlayChange;
    }

    return mergeConfig(config, {
      onOpenChange: handleOpenChange,
      onOverlayChange: handleOverlayChange,
    });
  }

  function fetchJson(url) {
    if (!url) return Promise.resolve(null);
    return fetch(url, { cache: "no-store" }).then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load chatbot config: " + response.status);
      }
      return response.json();
    });
  }

  function loadStylesheet(href) {
    var selector = 'link[data-adp-chat-embed-css="' + href + '"]';
    if (document.querySelector(selector)) return;

    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-adp-chat-embed-css", href);
    document.head.appendChild(link);
  }

  function loadScript(src) {
    if (window.ADPChatComponent) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      var existing = document.querySelector(
        'script[data-adp-chat-embed-umd="' + src + '"]',
      );
      if (existing) {
        existing.addEventListener("load", resolve);
        existing.addEventListener("error", reject);
        return;
      }

      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.setAttribute("data-adp-chat-embed-umd", src);
      script.onload = resolve;
      script.onerror = function () {
        reject(new Error("Failed to load " + src));
      };
      document.head.appendChild(script);
    });
  }

  function ensureContainer(selector) {
    if (selector && document.querySelector(selector)) {
      return selector;
    }

    var id =
      selector && selector.charAt(0) === "#"
        ? selector.slice(1)
        : "adp-chat-embed-root";
    var root = document.getElementById(id);

    if (!root) {
      root = document.createElement("div");
      root.id = id;
      document.body.appendChild(root);
    }

    return "#" + id;
  }

  function getContainerElement() {
    return state.containerSelector
      ? document.querySelector(state.containerSelector)
      : null;
  }

  function normalizeLanguage(language) {
    var value = String(language || "").trim();
    if (!value) return "";
    var lower = value.toLowerCase().replace(/_/g, "-");
    if (lower === "en" || lower === "en-us" || lower === "english") return "en";
    if (
      lower === "zh-hk" ||
      lower === "zh-hant" ||
      lower === "hongkong" ||
      lower === "hong-kong"
    )
      return "zh-HK";
    if (
      lower === "zh" ||
      lower === "zh-cn" ||
      lower === "zh-hans" ||
      lower === "chinese"
    )
      return "zh_CN";
    return value;
  }

  function languageDirection(language) {
    return /^(ar|fa|he|ur)(-|$)/i.test(language || "") ? "rtl" : "ltr";
  }

  function configFileLanguage(language) {
    var normalized = normalizeLanguage(language);
    if (normalized === "zh-HK") return "zh-HK";
    if (normalized === "zh_CN") return "zh_CN";
    return "en";
  }

  function resolveLanguageConfigUrl(configUrl, language) {
    if (!configUrl) return "";

    var fileLanguage = configFileLanguage(language);
    var tokenPattern = /\{lang\}/g;
    if (tokenPattern.test(configUrl)) {
      return configUrl.replace(tokenPattern, encodeURIComponent(fileLanguage));
    }

    try {
      var url = new URL(configUrl, document.baseURI);
      var path = url.pathname;
      var nextPath = path.replace(
        /(chatbot-config\.)(en|en-US|zh-HK|zh_CN|zh-CN)(\.json)$/i,
        "$1" + fileLanguage + "$3",
      );

      if (nextPath !== path) {
        url.pathname = nextPath;
        return url.href;
      }

      url.searchParams.set("lang", normalizeLanguage(language));
      return url.href;
    } catch (error) {
      var nextConfigUrl = configUrl.replace(
        /(chatbot-config\.)(en|en-US|zh-HK|zh_CN|zh-CN)(\.json)(\?.*)?$/i,
        "$1" + fileLanguage + "$3$4",
      );

      if (nextConfigUrl !== configUrl) {
        return nextConfigUrl;
      }

      var separator = configUrl.indexOf("?") >= 0 ? "&" : "?";
      return (
        configUrl +
        separator +
        "lang=" +
        encodeURIComponent(normalizeLanguage(language))
      );
    }
  }

  function ensureAccessibilityStyle() {
    if (document.getElementById("adp-chat-embed-accessibility-style")) return;

    var style = document.createElement("style");
    style.id = "adp-chat-embed-accessibility-style";
    style.textContent = [
      [
        "[data-adp-chat-embed-root] {",
        "  --adp-chat-font-scale: 1;",
        "  --td-font-size-link-small: calc(12px * var(--adp-chat-font-scale));",
        "  --td-font-size-link-medium: calc(14px * var(--adp-chat-font-scale));",
        "  --td-font-size-link-large: calc(16px * var(--adp-chat-font-scale));",
        "  --td-font-size-mark-small: calc(12px * var(--adp-chat-font-scale));",
        "  --td-font-size-mark-medium: calc(14px * var(--adp-chat-font-scale));",
        "  --td-font-size-body-small: calc(12px * var(--adp-chat-font-scale));",
        "  --td-font-size-body-medium: calc(14px * var(--adp-chat-font-scale));",
        "  --td-font-size-body-large: calc(16px * var(--adp-chat-font-scale));",
        "  --td-font-size-title-small: calc(14px * var(--adp-chat-font-scale));",
        "  --td-font-size-title-medium: calc(16px * var(--adp-chat-font-scale));",
        "  --td-font-size-title-large: calc(20px * var(--adp-chat-font-scale));",
        "  --td-line-height-link-small: calc(20px * var(--adp-chat-font-scale));",
        "  --td-line-height-link-medium: calc(22px * var(--adp-chat-font-scale));",
        "  --td-line-height-link-large: calc(24px * var(--adp-chat-font-scale));",
        "  --td-line-height-mark-small: calc(20px * var(--adp-chat-font-scale));",
        "  --td-line-height-mark-medium: calc(22px * var(--adp-chat-font-scale));",
        "  --td-line-height-body-small: calc(20px * var(--adp-chat-font-scale));",
        "  --td-line-height-body-medium: calc(22px * var(--adp-chat-font-scale));",
        "  --td-line-height-body-large: calc(24px * var(--adp-chat-font-scale));",
        "  --td-line-height-title-small: calc(22px * var(--adp-chat-font-scale));",
        "  --td-line-height-title-medium: calc(24px * var(--adp-chat-font-scale));",
        "  --td-line-height-title-large: calc(28px * var(--adp-chat-font-scale));",
        "}",
      ].join("\n"),
      "[data-adp-chat-embed-root] .panel-park--overlay,",
      "[data-adp-chat-embed-root] .panel-park--full,",
      "[data-adp-chat-embed-root] .main-layout { font-size: calc(16px * var(--adp-chat-font-scale)); }",
      "[data-adp-chat-embed-root] .layout-header .header-app__title,",
      "[data-adp-chat-embed-root] .t-chat__text,",
      "[data-adp-chat-embed-root] .t-chat__detail,",
      "[data-adp-chat-embed-root] .markdown-body,",
      "[data-adp-chat-embed-root] .markdown-body p,",
      "[data-adp-chat-embed-root] .user-message,",
      "[data-adp-chat-embed-root] .terms-message-card,",
      "[data-adp-chat-embed-root] .terms-btn,",
      "[data-adp-chat-embed-root] .carers-hotline-number,",
      "[data-adp-chat-embed-root] .carers-hotline-detail { font-size: calc(16px * var(--adp-chat-font-scale)) !important; }",
      "[data-adp-chat-embed-root] .carers-hotline-label { font-size: calc(12px * var(--adp-chat-font-scale)) !important; }",
      "[data-adp-chat-embed-root] .chat-message-row--assistant .markdown-body,",
      "[data-adp-chat-embed-root] .chat-message-row--assistant .markdown-body p,",
      "[data-adp-chat-embed-root] .terms-message-title,",
      "[data-adp-chat-embed-root] .terms-message-card li,",
      "[data-adp-chat-embed-root] .terms-message-card a { font-size: calc(13px * var(--adp-chat-font-scale)) !important; }",
      "[data-adp-chat-embed-root] .recording-label { font-size: calc(18px * var(--adp-chat-font-scale)) !important; }",
      "[data-adp-chat-embed-root] .recording-timer { font-size: calc(14px * var(--adp-chat-font-scale)) !important; }",
      "[data-adp-chat-embed-root] .recording-tap-hint { font-size: calc(13px * var(--adp-chat-font-scale)) !important; }",
      '[data-adp-chat-embed-root][data-adp-high-contrast="true"] .panel-park--overlay,',
      '[data-adp-chat-embed-root][data-adp-high-contrast="true"] .panel-park--full { filter: contrast(1.18); }',
      '[data-adp-chat-embed-root][data-adp-reduced-motion="true"] *,',
      '[data-adp-chat-embed-root][data-adp-reduced-motion="true"] *::before,',
      '[data-adp-chat-embed-root][data-adp-reduced-motion="true"] *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 0.001ms !important; }',
    ].join("\n");
    document.head.appendChild(style);
  }

  function applyAccessibility(options) {
    var root = getContainerElement();
    var language = normalizeLanguage(
      (state.config && state.config.language) || "",
    );
    var theme = state.config && state.config.theme;

    if (!root) return;

    ensureAccessibilityStyle();
    root.setAttribute("data-adp-chat-embed-root", "true");

    if (language) {
      root.setAttribute("lang", language);
      root.setAttribute("dir", languageDirection(language));
    }

    if (theme) {
      root.setAttribute("theme-mode", String(theme));
    }

    if (!options) return;

    if (options.label) {
      root.setAttribute("aria-label", String(options.label));
    }

    if (options.role) {
      root.setAttribute("role", String(options.role));
    } else if (!root.getAttribute("role")) {
      root.setAttribute("role", "region");
    }

    if (options.fontScale !== undefined) {
      var fontScale = Number(options.fontScale);
      if (Number.isFinite(fontScale)) {
        root.style.setProperty(
          "--adp-chat-font-scale",
          String(Math.min(Math.max(fontScale, 0.8), 1.6)),
        );
      }
    }

    if (options.highContrast !== undefined) {
      root.setAttribute(
        "data-adp-high-contrast",
        toBool(options.highContrast, false) ? "true" : "false",
      );
    }

    if (options.reducedMotion !== undefined) {
      root.setAttribute(
        "data-adp-reduced-motion",
        toBool(options.reducedMotion, false) ? "true" : "false",
      );
    }
  }

  function buildConfig() {
    var scriptUrl = new URL(
      currentScript && currentScript.src ? currentScript.src : ".",
      document.baseURI,
    );
    var defaultAssetBase = /\/umd\/[^/]*$/.test(scriptUrl.pathname)
      ? new URL("./", scriptUrl).href
      : new URL("./umd/", scriptUrl).href;
    var assetBase = getAttr("asset-base", defaultAssetBase);
    var apiBase = getAttr("api-base", scriptUrl.origin);
    var inlineConfig = parseJson(getAttr("config", ""), {});
    var globalConfig = window.ADPChatEmbedConfig || {};

    var defaults = {
      width: toSize(getAttr("width", ""), 400),
      height: toSize(getAttr("height", ""), "80vh"),
      logoTitle: getAttr("logo-title", "ADP Chat"),
      launcherIconUrl: getAttr("launcher-icon-url", getAttr("avatar-url", "")),
      launcherPosition: getAttr("launcher-position", "bottom-right"),
      launcherOffsetX: toSize(getAttr("launcher-offset-x", ""), 18),
      launcherOffsetY: toSize(getAttr("launcher-offset-y", ""), 18),
      theme: getAttr("theme", "light"),
      language: normalizeLanguage(getAttr("language", "zh-HK")),
      mode: getAttr("mode", "standard"),
      isOverlay: toBool(getAttr("overlay", ""), true),
      isOpen: toBool(getAttr("open", ""), false),
      showCloseButton: toBool(getAttr("show-close-button", ""), true),
      showOverlayButton: toBool(getAttr("show-overlay-button", ""), true),
      showToggleButton: toBool(getAttr("show-toggle-button", ""), true),
      enableVoiceInput: toBool(getAttr("enable-voice-input", ""), false),
      enableFileUpload: toBool(getAttr("enable-file-upload", ""), false),
      apiConfig: {
        baseURL: apiBase,
        withCredentials: true,
      },
    };

    return {
      assetBase: assetBase,
      containerSelector: ensureContainer(getAttr("container", "")),
      config: mergeConfig(mergeConfig(defaults, globalConfig), inlineConfig),
      configUrl: getAttr("config-url", ""),
    };
  }

  function init(overrideConfig) {
    var built = buildConfig();
    var assetBase = built.assetBase.replace(/\/?$/, "/");
    var cssUrl = assetBase + "adp-chat-component.css";
    var jsUrl = assetBase + "adp-chat-component.umd.js";
    var config = mergeConfig(built.config, overrideConfig || {});

    state.containerSelector = built.containerSelector;
    state.configUrl = built.configUrl;
    loadStylesheet(cssUrl);

    return fetchJson(resolveLanguageConfigUrl(built.configUrl, config.language))
      .then(function (chatbotConfig) {
        if (chatbotConfig) {
          config = mergeConfig(config, {
            frontendPocMode: false,
            autoLoad: false,
            chatbotConfig: chatbotConfig,
          });
        }
        config = withEmbedCallbacks(mapChatbotConfig(config));
        state.config = config;
        applyAccessibility(state.accessibility);
        return loadScript(jsUrl);
      })
      .then(function () {
        if (
          !window.ADPChatComponent ||
          typeof window.ADPChatComponent.init !== "function"
        ) {
          throw new Error("ADPChatComponent.init is not available");
        }

        if (
          state.mounted &&
          typeof window.ADPChatComponent.update === "function"
        ) {
          window.ADPChatComponent.update(state.containerSelector, config);
        } else {
          window.ADPChatComponent.init(state.containerSelector, config);
          state.mounted = true;
        }

        return window.ADPChatEmbed;
      })
      .catch(function (error) {
        console.error("[ADPChatEmbed] init failed:", error);
        throw error;
      });
  }

  window.ADPChatEmbed = {
    init: init,
    update: function (config) {
      var nextConfig = config || {};
      if (nextConfig.language) {
        nextConfig = Object.assign({}, nextConfig, {
          language: normalizeLanguage(nextConfig.language),
        });
        if (
          state.config &&
          state.config.chatbotConfig &&
          !nextConfig.chatbotConfig
        ) {
          nextConfig.chatbotConfig = Object.assign(
            {},
            state.config.chatbotConfig,
            {
              language: nextConfig.language,
            },
          );
        }
      }
      state.config = withEmbedCallbacks(
        mapChatbotConfig(mergeConfig(state.config || {}, nextConfig)),
      );
      applyAccessibility(state.accessibility);
      if (window.ADPChatComponent && state.mounted) {
        return window.ADPChatComponent.update(
          state.containerSelector,
          state.config,
        );
      }
      return false;
    },
    open: function () {
      return this.update({ isOpen: true });
    },
    close: function () {
      return this.update({ isOpen: false });
    },
    toggle: function () {
      var isOpen = !(state.config && state.config.isOpen);
      return this.update({ isOpen: isOpen });
    },
    setLanguage: function (language, i18nConfig) {
      var self = this;
      var normalized = normalizeLanguage(language);
      var config = mergeConfig({ language: normalized }, i18nConfig || {});
      var langUrl = resolveLanguageConfigUrl(state.configUrl, normalized);

      return fetchJson(langUrl).then(function (chatbotConfig) {
        if (chatbotConfig) {
          config.chatbotConfig = chatbotConfig;
        } else if (state.config && state.config.chatbotConfig) {
          config.chatbotConfig = Object.assign({}, state.config.chatbotConfig, {
            language: normalized,
          });
        }
        return self.update(config);
      });
    },
    changeLanguage: function (language, i18nConfig) {
      return this.setLanguage(language, i18nConfig);
    },
    setTheme: function (theme) {
      return this.update({ theme: theme });
    },
    setVoiceInput: function (enabled) {
      return this.update({ enableVoiceInput: !!enabled });
    },
    setFileUpload: function (enabled) {
      return this.update({ enableFileUpload: !!enabled });
    },
    setLauncherIcon: function (url) {
      return this.update({ launcherIconUrl: url });
    },
    setLauncherPosition: function (position, offsetX, offsetY) {
      var config = { launcherPosition: position };
      if (offsetX !== undefined) config.launcherOffsetX = offsetX;
      if (offsetY !== undefined) config.launcherOffsetY = offsetY;
      return this.update(config);
    },
    setAccessibility: function (options) {
      state.accessibility = Object.assign(
        {},
        state.accessibility || {},
        options || {},
      );
      if (state.accessibility.language) {
        state.config = mergeConfig(state.config || {}, {
          language: normalizeLanguage(state.accessibility.language),
        });
        if (state.config.chatbotConfig) {
          state.config.chatbotConfig = Object.assign(
            {},
            state.config.chatbotConfig,
            {
              language: state.config.language,
            },
          );
        }
      }
      if (state.accessibility.theme) {
        state.config = mergeConfig(state.config || {}, {
          theme: state.accessibility.theme,
        });
      }
      applyAccessibility(state.accessibility);
      if (window.ADPChatComponent && state.mounted) {
        return window.ADPChatComponent.update(
          state.containerSelector,
          state.config,
        );
      }
      return false;
    },
    getConfig: function () {
      return state.config;
    },
    getAccessibility: function () {
      return Object.assign({}, state.accessibility || {});
    },
  };

  if (toBool(getAttr("auto-init", ""), true)) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        init();
      });
    } else {
      init();
    }
  }
})(window, document);
