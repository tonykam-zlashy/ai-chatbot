# Chatbot Embed Loader Guide

This guide explains how to build, serve, and embed the ADP chat component on a
third-party website. It covers the component loader at
`/static/adp-chat-component/umd/embed.js`; it does not cover an iframe loader.

## 1. Build and Serve the Loader

The loader needs these files from the same UMD directory:

```text
embed.js
adp-chat-component.umd.js
adp-chat-component.css
```

From the repository root, install and build the frontend:

```bash
cd client
npm install
npm run build
cd ..
```

The build copies the component output to:

```text
server/static/adp-chat-component/umd/
```

It also builds the main app and copies its public chatbot configuration files
to `server/static/app/mock/`. Use `npm run build_component` only when the
deployment manages its chatbot configuration JSON separately.

The Sanic server exposes that directory under `/static`. Follow the main
[`README.md`](README.md) to configure `server/.env` and run or deploy the
server. A normal local deployment on port 8000 serves the loader at:

```text
http://localhost:8000/static/adp-chat-component/umd/embed.js
```

For a Docker deployment, `make pack` runs the frontend build before creating
the image. Rebuild the component or image after changing `embed.js` or the chat
component.

Verify all three files before integrating another site:

```bash
curl -fI http://localhost:8000/static/adp-chat-component/umd/embed.js
curl -fI http://localhost:8000/static/adp-chat-component/umd/adp-chat-component.umd.js
curl -fI http://localhost:8000/static/adp-chat-component/umd/adp-chat-component.css
```

In the examples below, replace `https://chat.example.com` with the public
origin of this server. Do not copy a developer-specific tunnel URL into a
permanent integration.

## 2. Provide Language Configuration

The repository contains example chatbot configurations for all public language
keys:

```text
client/packages/app/public/mock/carer/chatbot-config.en.json
client/packages/app/public/mock/carer/chatbot-config.zh-HK.json
client/packages/app/public/mock/carer/chatbot-config.zh_CN.json
```

The full client build from the previous section copies these files into the
server app bundle. The server then exposes them at:

```text
https://chat.example.com/mock/carer/chatbot-config.en.json
https://chat.example.com/mock/carer/chatbot-config.zh-HK.json
https://chat.example.com/mock/carer/chatbot-config.zh_CN.json
```

Use these as templates and replace the example application ID, assistant text,
branding, terms, and feature settings for the deployment. Keep all three files
when runtime language switching is required.

The loader accepts a `{lang}` placeholder:

```html
data-config-url="https://chat.example.com/mock/carer/chatbot-config.{lang}.json"
```

The URL should be absolute when the host page and chat server have different
origins. A relative URL is resolved against the host page, not the loader URL.

Supported public keys and normalized aliases are:

```text
en, en-US, english                          -> en
zh-HK, zh_HK, zh-Hant, hongkong, hong-kong -> zh-HK
zh, zh-CN, zh_CN, zh-Hans, chinese         -> zh_CN
```

## 3. Recommended Embed

This is the recommended setup when the page only needs the built-in launcher
and does not need to call the JavaScript API immediately:

```html
<script
  src="https://chat.example.com/static/adp-chat-component/umd/embed.js"
  data-config-url="https://chat.example.com/mock/carer/chatbot-config.{lang}.json"
  data-language="en"
  data-theme="light"
  data-api-base="https://chat.example.com"
  data-launcher-position="bottom-right"
  data-launcher-offset-x="24"
  data-launcher-offset-y="24"
  defer
></script>
```

The loader creates `window.ADPChatEmbed`, creates a container in `document.body`,
loads the UMD JavaScript and CSS, fetches the selected chatbot configuration,
and mounts the component.

The initial API origin defaults to the origin of `embed.js`, so
`data-api-base` can be omitted when the assets and API use the same origin.

## 4. Deterministic Initialization

Loading `embed.js` and mounting the component are separate asynchronous steps.
Do not assume the component is mounted merely because the loader script's
`load` event fired.

When page code must call the API during startup, disable auto-initialization and
await `init()` after the document is ready:

```html
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const chat = await window.ADPChatEmbed.init({
      logoTitle: 'Support'
    });

    chat.open();
  });
</script>

<script
  src="https://chat.example.com/static/adp-chat-component/umd/embed.js"
  data-auto-init="false"
  data-config-url="https://chat.example.com/mock/carer/chatbot-config.{lang}.json"
  data-language="en"
  data-api-base="https://chat.example.com"
  defer
></script>
```

`ADPChatEmbed.init()` returns a promise that resolves to `ADPChatEmbed` after
the component has mounted. Calls made before mounting can return `false` and
should not be used as a readiness check.

For controls triggered later by a user action, call the API after the awaited
initialization:

```js
document.querySelector('#open-support').addEventListener('click', () => {
  window.ADPChatEmbed.open();
});
```

## 5. Initial Data Attributes

Set these attributes on the `embed.js` script element.

| Attribute | Default | Description |
| --- | --- | --- |
| `data-logo-title` | `ADP Chat` | Header/title text. A chatbot config can supply its own assistant title. |
| `data-language` | `zh-HK` | Initial language. Use `en`, `zh-HK`, or `zh_CN`. |
| `data-theme` | `light` | Initial component theme: `light` or `dark`. |
| `data-mode` | `standard` | Chat mode: `standard` or `claw`. |
| `data-width` | `400` | Overlay panel width. Numeric values are pixels. |
| `data-height` | `80vh` | Overlay panel height. Numeric values are pixels. |
| `data-open` | `false` | Whether the panel is open initially. |
| `data-overlay` | `true` | Whether the panel uses floating overlay mode. |
| `data-show-toggle-button` | `true` | Whether to show the launcher. |
| `data-show-close-button` | `true` | Whether to show the panel close button. |
| `data-show-overlay-button` | `true` | Whether to show the overlay mode button. |
| `data-enable-voice-input` | `false` | Whether to expose voice input. Backend system settings must also allow it. |
| `data-enable-file-upload` | `false` | Whether to expose file upload. |
| `data-launcher-icon-url` | empty | Launcher image URL. The chatbot config can provide `assistant.launcherAvatarUrl`. |
| `data-launcher-position` | `bottom-right` | Launcher position. |
| `data-launcher-offset-x` | `18` | Horizontal launcher offset. Numeric values are pixels. |
| `data-launcher-offset-y` | `18` | Vertical launcher offset. Numeric values are pixels. |
| `data-api-base` | script origin | API origin used as Axios `baseURL`. |
| `data-asset-base` | derived from script URL | Directory containing the UMD JavaScript and CSS. |
| `data-config-url` | empty | Public chatbot config URL or `{lang}` URL template. Required by `setLanguage()` unless a chatbot config is passed directly. |
| `data-container` | generated container | Existing container selector. The loader creates one if the selector is absent or not found. |
| `data-auto-init` | `true` | Set to `false` and call `init()` manually for deterministic startup. |
| `data-config` | `{}` | JSON object merged into the component config. Attribute values must be valid HTML-escaped JSON. |

Supported launcher positions:

```text
bottom-right
bottom-left
top-right
top-left
```

Offsets accept numbers or CSS values:

```html
data-launcher-offset-x="2rem"
data-launcher-offset-y="calc(env(safe-area-inset-bottom) + 20px)"
```

## 6. JavaScript API

All functions are exposed on `window.ADPChatEmbed`.

### Panel Control

```js
ADPChatEmbed.open();
ADPChatEmbed.close();
ADPChatEmbed.toggle();
```

These functions return the component update result. A `false` result means the
component was not mounted.

### General Update

```js
ADPChatEmbed.update({
  logoTitle: 'Support',
  width: 420,
  height: '80vh',
  isOpen: true,
  theme: 'dark'
});
```

`update()` shallow-merges top-level component fields and separately merges
`apiConfig` and `apiConfig.apiDetailConfig`.

### Language

`changeLanguage()` delegates to `setLanguage()`. Both return a promise because
the loader may fetch a new chatbot configuration.

```js
await ADPChatEmbed.setLanguage('en');
await ADPChatEmbed.changeLanguage('zh-HK');
await ADPChatEmbed.changeLanguage('zh_CN');
```

These calls use `data-config-url` to load the matching file. For example,
changing to `en` with this template:

```html
data-config-url="https://chat.example.com/mock/carer/chatbot-config.{lang}.json"
```

requests `chatbot-config.en.json`.

Without `data-config-url`, `setLanguage()` and `changeLanguage()` return `false`
unless the second argument includes a complete `chatbotConfig`:

```js
await ADPChatEmbed.changeLanguage('en', {
  chatbotConfig: englishChatbotConfig,
  chatI18n: {
    sendError: 'Unable to send message'
  },
  senderI18n: {
    placeholder: 'Type your message'
  }
});
```

When a language-specific chatbot config is not being used, a direct
`ADPChatEmbed.update({ language: 'en' })` updates the component without fetching
a file.

### Theme and Features

```js
ADPChatEmbed.setTheme('dark');
ADPChatEmbed.setVoiceInput(true);
ADPChatEmbed.setFileUpload(true);
```

Enabling a UI feature does not configure its backend dependency. Voice input,
uploads, authentication, storage, and agent APIs must also be configured on the
server.

### Launcher

```js
ADPChatEmbed.setLauncherIcon('https://cdn.example.com/chat-launcher.gif');
ADPChatEmbed.setLauncherPosition('bottom-left', 24, 32);
```

The second position argument is the horizontal offset and the third is the
vertical offset. Use an HTTPS image when the host page is HTTPS; otherwise the
browser may block it as mixed content.

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

| Field | Type | Behavior |
| --- | --- | --- |
| `language` | string | Sets `lang` and `dir` on the embed root. It does not change the component language; use `setLanguage()` for that. |
| `label` | string | Sets `aria-label` on the embed root. |
| `role` | string | Sets the root ARIA role. The default is `region`. |
| `fontScale` | number | Scales chat text and is clamped to `0.8` through `1.6`. |
| `highContrast` | boolean | Applies higher-contrast panel styling. |
| `reducedMotion` | boolean | Minimizes animations and transitions inside the embed root. |
| `theme` | string | Updates the component theme. |

### State Inspection

```js
const config = ADPChatEmbed.getConfig();
const accessibility = ADPChatEmbed.getAccessibility();
```

`getConfig()` returns the loader's current config object. Treat it as read-only.
`getAccessibility()` returns a shallow copy.

## 7. Advanced Configuration

Set `window.ADPChatEmbedConfig` before `embed.js` executes:

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
      baseURL: 'https://chat.example.com',
      withCredentials: true
    }
  };
</script>
<script
  src="https://chat.example.com/static/adp-chat-component/umd/embed.js"
  data-config-url="https://chat.example.com/mock/carer/chatbot-config.{lang}.json"
  defer
></script>
```

Configuration precedence, from lowest to highest, is:

```text
loader defaults and individual data attributes
window.ADPChatEmbedConfig
data-config JSON
ADPChatEmbed.init({...}) overrides
```

Selected structured chatbot config fields, including language, panel size, and
launcher settings, are mapped onto component fields after the config file is
loaded and can therefore supply the final values.

## 8. Cross-Origin Deployment

If the host page and chat server have different origins, add the exact host-page
origin to `CORS_ORIGINS` in the server `.env`:

```env
CORS_ORIGINS=https://www.example.com
```

Origins include the scheme and port. Separate multiple origins with commas:

```env
CORS_ORIGINS=https://www.example.com,https://support.example.com
```

The server uses exact matching and the loader sends API requests with
credentials by default, so do not rely on a wildcard origin. Restart or
redeploy the server after changing `.env`.

This CORS permission covers API requests and cross-origin chatbot config
fetches. `data-config-url` must point to a public JSON response because the
loader's config fetch does not include credentials.

For authentication cookies sent from a cross-site host page, the current server
uses `IFRAME_ORIGINS` to enable `SameSite=None; Secure` cookies:

```env
IFRAME_ORIGINS=https://www.example.com
```

This requires HTTPS. Browser privacy settings may still block third-party
cookies. If the entire chat application is embedded in an iframe,
`IFRAME_ORIGINS` also adds that origin to the CSP `frame-ancestors` policy.
The component loader described in this guide does not itself create an iframe.

The third-party site's Content Security Policy may also need to allow:

```text
script-src  https://chat.example.com
style-src   https://chat.example.com
connect-src https://chat.example.com
img-src     https://chat.example.com and any launcher/avatar CDN
```

Use the site's existing CSP syntax and preserve its other sources.

## 9. Events

The loader dispatches these events on `window` when the user changes panel
state:

```js
window.addEventListener('ADP_CHAT_OPEN_CHANGE', (event) => {
  console.log(event.detail.isOpen);
});

window.addEventListener('ADP_CHAT_OVERLAY_CHANGE', (event) => {
  console.log(event.detail.isOverlay, event.detail.isExpanded);
});
```

If the host page containing the loader is itself inside an iframe, the same
payloads are also posted to its parent window. A receiving parent should verify
`event.source` and the payload before using the message.

## 10. Troubleshooting

### `ADPChatEmbed` is undefined

The loader has not executed yet, its URL failed, or page CSP blocked it. Use
`defer`, check the browser network panel, and use the deterministic initialization
example when calling the API during startup.

### `open()`, `close()`, or `update()` returns `false`

The component has not mounted. With manual initialization, await `init()` before
calling another method.

### Language switching returns `false`

Check that `data-config-url` is present, the requested JSON file returns HTTP
200, its response is valid JSON, and its server permits the host-page origin via
CORS. Alternatively pass `chatbotConfig` as the second argument.

### The loader loads but API requests fail

Check `data-api-base`, browser CORS errors, `CORS_ORIGINS`, HTTPS mixed-content
errors, authentication cookies, and the backend logs. The host-page origin must
match `CORS_ORIGINS` exactly.

### The launcher is present but has no image

Set `data-launcher-icon-url`, call `setLauncherIcon()`, or provide
`assistant.launcherAvatarUrl` in the chatbot config. An empty icon is the
built-in default.

### The panel size does not change

`width` and `height` apply to overlay mode. Also check whether the loaded
chatbot config supplies `panel.width` or `panel.height`, because those structured
config values are mapped after initial loader options.
