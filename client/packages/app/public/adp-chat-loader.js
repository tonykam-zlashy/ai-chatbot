(function (window, document) {
  "use strict";

  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  var state = {
    config: {},
    isOpen: false,
    iframeLoaded: false,
  };

  function getScriptAttr(name, fallback) {
    if (!currentScript) return fallback;
    var value = currentScript.getAttribute("data-" + name);
    return value === null || value === "" ? fallback : value;
  }

  function toBool(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    return !/^(false|0|no|off)$/i.test(String(value));
  }

  function normalizeBaseUrl(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function getDefaultAppUrl() {
    var scriptUrl = new URL(
      currentScript && currentScript.src ? currentScript.src : ".",
      document.baseURI,
    );
    return scriptUrl.origin + "/index#/";
  }

  function resolveAppUrl(config) {
    var explicitAppUrl = getScriptAttr("app-url", config.appUrl || "");
    if (explicitAppUrl) return explicitAppUrl;

    var apiBase = config.apiConfig && config.apiConfig.baseURL;
    if (apiBase) return normalizeBaseUrl(apiBase) + "/index#/";

    return getDefaultAppUrl();
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

  function buildConfig() {
    var globalConfig = window.ADPChatEmbedConfig || {};
    var defaults = {
      theme: getScriptAttr("theme", "light"),
      language: getScriptAttr("language", "zh"),
      mode: getScriptAttr("mode", "standard"),
      isOpen: toBool(getScriptAttr("open", ""), false),
      launcherPosition: getScriptAttr("launcher-position", "bottom-right"),
      width: getScriptAttr("width", "380px"),
      height: getScriptAttr("height", "600px"),
      apiConfig: {
        withCredentials: true,
      },
    };
    var apiBase = getScriptAttr("api-base", "");
    if (apiBase) {
      defaults.apiConfig.baseURL = apiBase;
    }

    return mergeConfig(defaults, globalConfig);
  }

  function injectStyle() {
    if (document.getElementById("adp-chat-loader-style")) return;

    var style = document.createElement("style");
    style.id = "adp-chat-loader-style";
    style.textContent = [
      "#adp-chat-embed-root{position:fixed;z-index:2147483647;font-family:Arial,sans-serif}",
      "#adp-chat-embed-root[data-position='bottom-right']{right:22px;bottom:16px}",
      "#adp-chat-embed-root[data-position='bottom-left']{left:22px;bottom:16px}",
      "#adp-chat-embed-root[data-position='top-right']{right:22px;top:16px}",
      "#adp-chat-embed-root[data-position='top-left']{left:22px;top:16px}",
      ".adp-chat-loader-launcher{width:64px;height:64px;border:0;border-radius:50%;background:#b84319;color:#fff;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.22)}",
      ".adp-chat-loader-panel{position:relative;display:none;width:380px;height:600px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:hidden;background:#fff;border:1px solid #b84319;border-radius:10px 10px 0 0;box-shadow:0 6px 28px rgba(0,0,0,.22)}",
      ".adp-chat-loader-panel iframe{display:block;width:100%;height:100%;border:0;background:#fff}",
      ".adp-chat-loader-close{position:absolute;top:8px;right:8px;z-index:1;width:28px;height:28px;border:0;border-radius:50%;background:rgba(0,0,0,.25);color:#fff;font-size:18px;line-height:28px;cursor:pointer}",
      "@media(max-width:520px){#adp-chat-embed-root{right:0!important;bottom:0!important;left:auto!important;top:auto!important}.adp-chat-loader-panel{width:100vw!important;height:100dvh!important;max-width:none;max-height:none;border-radius:0}.adp-chat-loader-launcher{margin:0 16px 16px 0}}",
    ].join("\n");
    document.head.appendChild(style);
  }

  function createElementTree() {
    var root = document.getElementById("adp-chat-embed-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "adp-chat-embed-root";
      document.body.appendChild(root);
    }

    root.innerHTML = "";

    var launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "adp-chat-loader-launcher";
    launcher.setAttribute("aria-label", "Open chat");
    launcher.textContent = state.config.launcherText || "Chat";

    var panel = document.createElement("section");
    panel.className = "adp-chat-loader-panel";
    panel.setAttribute("aria-label", "ADP Chat");

    var close = document.createElement("button");
    close.type = "button";
    close.className = "adp-chat-loader-close";
    close.setAttribute("aria-label", "Close chat");
    close.textContent = "x";

    var iframe = document.createElement("iframe");
    iframe.title = "ADP Chat";
    iframe.allow = "microphone; clipboard-read; clipboard-write";

    panel.appendChild(close);
    panel.appendChild(iframe);
    root.appendChild(launcher);
    root.appendChild(panel);

    return {
      root: root,
      launcher: launcher,
      panel: panel,
      close: close,
      iframe: iframe,
    };
  }

  function postConfig(iframe) {
    if (!iframe.contentWindow) return;

    var appUrl = new URL(iframe.src || resolveAppUrl(state.config), document.baseURI);
    iframe.contentWindow.postMessage(
      {
        type: "adp-chat-embed-config",
        config: state.config,
      },
      appUrl.origin,
    );
  }

  function postConfigWithRetries(iframe) {
    postConfig(iframe);
    [100, 500, 1500, 3000].forEach(function (delay) {
      setTimeout(function () {
        postConfig(iframe);
      }, delay);
    });
  }

  function applyShell(elements) {
    var config = state.config;
    elements.root.setAttribute(
      "data-position",
      config.launcherPosition || "bottom-right",
    );
    elements.panel.style.width =
      typeof config.width === "number" ? config.width + "px" : config.width || "380px";
    elements.panel.style.height =
      typeof config.height === "number" ? config.height + "px" : config.height || "600px";
    elements.launcher.textContent = config.launcherText || "Chat";
  }

  function init(initialConfig) {
    state.config = mergeConfig(buildConfig(), initialConfig || {});
    state.isOpen = state.config.isOpen === true;

    injectStyle();
    var elements = createElementTree();
    applyShell(elements);

    function open() {
      state.isOpen = true;
      state.config.isOpen = true;
      elements.launcher.style.display = "none";
      elements.panel.style.display = "block";
      if (!elements.iframe.src) {
        elements.iframe.src = resolveAppUrl(state.config);
      } else {
        postConfig(elements.iframe);
      }
    }

    function close() {
      state.isOpen = false;
      state.config.isOpen = false;
      elements.panel.style.display = "none";
      elements.launcher.style.display = "inline-block";
    }

    function update(nextConfig) {
      state.config = mergeConfig(state.config, nextConfig || {});
      applyShell(elements);
      if (elements.iframe.src) postConfig(elements.iframe);
      if (state.config.isOpen === true) open();
      if (state.config.isOpen === false) close();
      return window.ADPChatEmbed;
    }

    function setLanguage(language, config) {
      return update(mergeConfig(config || {}, { language: language }));
    }

    elements.launcher.addEventListener("click", open);
    elements.close.addEventListener("click", close);
    elements.iframe.addEventListener("load", function () {
      state.iframeLoaded = true;
      postConfigWithRetries(elements.iframe);
    });
    window.addEventListener("message", function (event) {
      if (
        event.source === elements.iframe.contentWindow &&
        event.data &&
        event.data.type === "adp-chat-embed-ready"
      ) {
        postConfig(elements.iframe);
      }
    });

    window.ADPChatEmbed = {
      open: open,
      close: close,
      toggle: function () {
        state.isOpen ? close() : open();
      },
      update: update,
      setLanguage: setLanguage,
      changeLanguage: function (language, config) {
        return setLanguage(language, config);
      },
      getConfig: function () {
        return mergeConfig(state.config, {});
      },
    };

    if (state.isOpen) {
      open();
    } else {
      close();
    }

    return window.ADPChatEmbed;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init();
    });
  } else {
    init();
  }
})(window, document);
