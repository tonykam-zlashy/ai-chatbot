# Chatbot Embed Loader Guide

This guide explains how a third-party website can embed and control the ADP chatbot through the hosted JavaScript loader.

Current loader URL:

```html
<script
  src="https://e7fd-45-144-227-44.ngrok-free.app/static/adp-chat-component/umd/embed.js"
  defer
></script>
```

The loader creates `window.ADPChatEmbed`.

## Quick Start

```html
<script
  src="https://e7fd-45-144-227-44.ngrok-free.app/static/adp-chat-component/umd/embed.js"
  data-logo-title="Support"
  data-language="en"
  data-theme="light"
  data-launcher-icon-url="https://example.com/bot.gif"
  data-launcher-position="bottom-right"
  data-launcher-offset-x="24"
  data-launcher-offset-y="24"
  defer
></script>
```

After the script loads, call:

```js
ADPChatEmbed.open();
ADPChatEmbed.close();
ADPChatEmbed.changeLanguage('zh-HK');
```

## Initial Data Attributes

Use these attributes on the embed `<script>` tag.

| Attribute | Example | Description |
| --- | --- | --- |
| `data-logo-title` | `Support` | Header/title text inside the chatbot. |
| `data-language` | `en` | Initial language. Supported public keys are `en`, `zh-HK`, and `zh_CN`. |
| `data-theme` | `light` | Initial theme: `light` or `dark`. |
| `data-width` | `420` | Chat panel width. Number values are treated as pixels. |
| `data-height` | `80vh` | Chat panel height. |
| `data-open` | `true` | Whether the chat is open on page load. |
| `data-overlay` | `true` | Whether the chat panel floats as an overlay. |
| `data-show-toggle-button` | `true` | Whether to show the launcher button. |
| `data-show-close-button` | `true` | Whether to show the panel close button. |
| `data-show-overlay-button` | `true` | Whether to show the overlay mode button. |
| `data-enable-voice-input` | `true` | Enable or disable voice input. |
| `data-enable-file-upload` | `true` | Enable or disable file upload. |
| `data-launcher-icon-url` | `https://example.com/bot.gif` | Custom launcher GIF/image URL. |
| `data-launcher-position` | `bottom-right` | Launcher position. |
| `data-launcher-offset-x` | `24` | Horizontal offset. Number values are treated as pixels. |
| `data-launcher-offset-y` | `24` | Vertical offset. Number values are treated as pixels. |
| `data-api-base` | `https://your-host.example.com` | API origin. Defaults to the script origin. |
| `data-asset-base` | `https://your-host.example.com/static/adp-chat-component/umd/` | Asset directory for UMD JS/CSS. Usually not needed. |
| `data-container` | `#my-chat-root` | Existing container selector. If omitted, the loader creates one. |
| `data-auto-init` | `false` | Set to `false` if you want to call `ADPChatEmbed.init()` manually. |
| `data-config` | `{"theme":"dark"}` | JSON config override for advanced cases. |

Supported launcher positions:

```text
bottom-right
bottom-left
top-right
top-left
```

Offsets can be numbers or CSS values:

```html
data-launcher-offset-x="2rem"
data-launcher-offset-y="calc(env(safe-area-inset-bottom) + 20px)"
```

## Callable API

All functions are available on `window.ADPChatEmbed`.

### Basic Control

```js
ADPChatEmbed.open();
ADPChatEmbed.close();
ADPChatEmbed.toggle();
```

### General Update

Use `update()` to pass any supported chatbot config.

```js
ADPChatEmbed.update({
  logoTitle: 'Support',
  width: 420,
  height: '80vh',
  isOpen: true,
  theme: 'dark'
});
```

### Language

```js
ADPChatEmbed.setLanguage('en');
ADPChatEmbed.changeLanguage('zh-HK');
ADPChatEmbed.changeLanguage('zh_CN');
```

With custom i18n overrides:

```js
ADPChatEmbed.changeLanguage('en', {
  chatI18n: {
    sendError: 'Unable to send message'
  },
  senderI18n: {
    placeholder: 'Type your message'
  }
});
```

Language aliases are normalized:

```text
en, en-US, english -> en
zh-HK, zh_HK, zh-Hant -> zh-HK
zh, zh-CN, zh_CN, zh-Hans, chinese -> zh_CN
```

### Theme

```js
ADPChatEmbed.setTheme('light');
ADPChatEmbed.setTheme('dark');
```

### Launcher Icon

Set the launcher GIF/image at load time:

```html
<script
  src="https://e7fd-45-144-227-44.ngrok-free.app/static/adp-chat-component/umd/embed.js"
  data-launcher-icon-url="https://example.com/custom-chatbot.gif"
  defer
></script>
```

Or change it after load:

```js
ADPChatEmbed.setLauncherIcon('https://example.com/custom-chatbot.gif');
```

The image should be a public HTTPS URL. If no custom image is passed, the embed has no built-in launcher image unless a chatbot config provides `assistant.launcherAvatarUrl`.

Put campaign-specific or third-party-site-specific GIFs on the third-party site or a shared CDN, then pass the public URL with `data-launcher-icon-url` or `ADPChatEmbed.setLauncherIcon(url)`. Put a GIF in this chatbot project only when it should become a built-in default for every embed.

### Launcher Position

Set launcher position at load time:

```html
<script
  src="https://e7fd-45-144-227-44.ngrok-free.app/static/adp-chat-component/umd/embed.js"
  data-launcher-position="bottom-left"
  data-launcher-offset-x="24"
  data-launcher-offset-y="32"
  defer
></script>
```

Or change it after load:

```js
ADPChatEmbed.setLauncherPosition('bottom-left', 24, 32);
```

The second argument is horizontal offset. The third argument is vertical offset.

For normal embeds, control launcher position from the third-party site using `data-launcher-position` or `ADPChatEmbed.setLauncherPosition(...)`. Change the chatbot project defaults only when every website should inherit the same position.

### Feature Toggles

```js
ADPChatEmbed.setVoiceInput(true);
ADPChatEmbed.setVoiceInput(false);

ADPChatEmbed.setFileUpload(true);
ADPChatEmbed.setFileUpload(false);
```

### Accessibility

```js
ADPChatEmbed.setAccessibility({
  language: 'en',
  label: 'Customer support chatbot',
  role: 'region',
  fontScale: 1.2,
  highContrast: true,
  reducedMotion: true,
  theme: 'dark'
});
```

Supported accessibility fields:

| Field | Type | Description |
| --- | --- | --- |
| `language` | string | Updates chatbot language and root `lang`/`dir` attributes. |
| `label` | string | Sets `aria-label` on the embed root. |
| `role` | string | Sets ARIA role on the embed root. Defaults to `region`. |
| `fontScale` | number | Scales chatbot text. Values are clamped between `0.8` and `1.6`. |
| `highContrast` | boolean | Applies higher contrast styling to the chatbot panel. |
| `reducedMotion` | boolean | Minimizes animations and transitions inside the embed root. |
| `theme` | string | Updates theme, usually `light` or `dark`. |

### State Inspection

```js
const config = ADPChatEmbed.getConfig();
const accessibility = ADPChatEmbed.getAccessibility();
```

## Manual Initialization

Disable auto-init:

```html
<script
  src="https://e7fd-45-144-227-44.ngrok-free.app/static/adp-chat-component/umd/embed.js"
  data-auto-init="false"
  defer
></script>
```

Then initialize manually:

```js
ADPChatEmbed.init({
  logoTitle: 'Support',
  launcherPosition: 'bottom-right',
  launcherIconUrl: 'https://example.com/bot.gif',
  apiConfig: {
    baseURL: 'https://e7fd-45-144-227-44.ngrok-free.app',
    withCredentials: true
  }
});
```

## Advanced Global Config

Set `window.ADPChatEmbedConfig` before loading the script:

```html
<script>
  window.ADPChatEmbedConfig = {
    theme: 'light',
    language: 'en',
    isOpen: false,
    launcherPosition: 'bottom-right',
    launcherOffsetX: 24,
    launcherOffsetY: 24,
    apiConfig: {
      baseURL: 'https://e7fd-45-144-227-44.ngrok-free.app',
      withCredentials: true
    }
  };
</script>
<script
  src="https://e7fd-45-144-227-44.ngrok-free.app/static/adp-chat-component/umd/embed.js"
  defer
></script>
```

`data-config` and `ADPChatEmbed.init({...})` can also pass the same config fields.

## CORS Requirement

For real third-party domains, configure the server to allow that exact origin:

```env
CORS_ORIGINS=https://third-party-site.com
```

If the whole app is embedded in an iframe or cross-site cookies are required, also configure:

```env
IFRAME_ORIGINS=https://third-party-site.com
```

Then restart or redeploy the server.

Without the correct `CORS_ORIGINS`, the loader can still load, but browser API calls from the third-party site will be blocked.
