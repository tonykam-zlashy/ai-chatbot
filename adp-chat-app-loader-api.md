# ADP Chat App Loader API

This document covers the iframe app loader served from:

```html
<script src="https://your-chat-host.example.com/adp-chat-loader.js" defer></script>
```

It is different from the legacy component UMD loader at
`/static/adp-chat-component/umd/embed.js`.

## Quick Start

```html
<script>
  window.ADPChatEmbedConfig = {
    theme: 'light',
    language: 'en',
    mode: 'standard',
    isOpen: false,
    launcherPosition: 'bottom-right',
    apiConfig: {
      baseURL: 'https://e7fd-45-144-227-44.ngrok-free.app',
      withCredentials: true
    }
  };
</script>
<script
  src="https://e7fd-45-144-227-44.ngrok-free.app/adp-chat-loader.js"
  defer
></script>
```

The loader creates `window.ADPChatEmbed` after the script initializes.

## Global Config

Set `window.ADPChatEmbedConfig` before loading `adp-chat-loader.js`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `appUrl` | string | Script origin + `/index#/` | Full iframe URL for the hosted chat app. Use this when the app host differs from the API host. |
| `theme` | `'light' \| 'dark'` | `'light'` | Initial app theme. |
| `language` | string | `'zh'` | Initial language. Values starting with `en` map to English; values starting with `zh` map to Chinese. |
| `mode` | `'standard' \| 'claw'` | `'standard'` | Chat mode passed to the app. |
| `isOpen` | boolean | `false` | Whether the outer iframe panel opens immediately. |
| `launcherPosition` | string | `'bottom-right'` | Outer launcher position: `bottom-right`, `bottom-left`, `top-right`, or `top-left`. |
| `width` | string or number | `'380px'` | Outer iframe panel width. Numbers are treated as pixels. |
| `height` | string or number | `'600px'` | Outer iframe panel height. Numbers are treated as pixels. |
| `launcherText` | string | `'Chat'` | Text shown in the outer launcher button. |
| `apiConfig` | object | `{ withCredentials: true }` | Axios-style API config sent into the iframe app. |
| `apiConfig.baseURL` | string | App default | Backend API base URL. |
| `apiConfig.withCredentials` | boolean | `true` | Whether API requests include credentials. |
| `apiConfig.apiDetailConfig` | object | App defaults | Optional endpoint path overrides. |
| `chatbotConfig` | object | unset | Optional public chatbot fixture/config passed into the app. |
| `autoLoad` | boolean | `true` | Whether the app should auto-load backend data. |

Example with separate app and API hosts:

```html
<script>
  window.ADPChatEmbedConfig = {
    appUrl: 'https://chat-ui.example.com/index#/',
    language: 'en-US',
    isOpen: true,
    apiConfig: {
      baseURL: 'https://chat-api.example.com',
      withCredentials: true
    }
  };
</script>
<script src="https://chat-ui.example.com/adp-chat-loader.js" defer></script>
```

## Script Attributes

You can also configure common fields with `data-*` attributes. The global
`window.ADPChatEmbedConfig` object overrides these attributes.

| Attribute | Maps to | Example |
| --- | --- | --- |
| `data-app-url` | `appUrl` | `https://chat-ui.example.com/index#/` |
| `data-theme` | `theme` | `light` |
| `data-language` | `language` | `en` |
| `data-mode` | `mode` | `standard` |
| `data-open` | `isOpen` | `true` |
| `data-launcher-position` | `launcherPosition` | `bottom-left` |
| `data-width` | `width` | `420px` |
| `data-height` | `height` | `80vh` |
| `data-api-base` | `apiConfig.baseURL` | `https://chat-api.example.com` |

Example:

```html
<script
  src="https://chat-ui.example.com/adp-chat-loader.js"
  data-language="en"
  data-open="true"
  data-launcher-position="bottom-left"
  data-api-base="https://chat-api.example.com"
  defer
></script>
```

## Exposed Functions

All functions are available on `window.ADPChatEmbed`.

### `open()`

Opens the outer chat panel. If the iframe has not been created yet, this also
sets the iframe `src` and loads the app.

```js
window.ADPChatEmbed.open();
```

Typical use:

```html
<button type="button" onclick="ADPChatEmbed.open()">
  Contact support
</button>
```

### `close()`

Closes the outer chat panel and shows the outer launcher again.

```js
window.ADPChatEmbed.close();
```

Typical use:

```js
document.querySelector('#hide-chat').addEventListener('click', () => {
  ADPChatEmbed.close();
});
```

### `toggle()`

Opens the panel when closed, or closes it when open.

```js
window.ADPChatEmbed.toggle();
```

Typical use:

```html
<button type="button" onclick="ADPChatEmbed.toggle()">
  Toggle chat
</button>
```

### `update(config)`

Merges new config into the current loader config.

If the iframe is already loaded, the loader sends the updated config into the
iframe app with `postMessage`.

```js
window.ADPChatEmbed.update({
  language: 'zh-HK',
  theme: 'dark',
  isOpen: true
});
```

Update API host at runtime:

```js
window.ADPChatEmbed.update({
  apiConfig: {
    baseURL: 'https://new-api.example.com',
    withCredentials: true
  }
});
```

Resize the outer iframe panel:

```js
window.ADPChatEmbed.update({
  width: '420px',
  height: '80vh'
});
```

Move the outer launcher:

```js
window.ADPChatEmbed.update({
  launcherPosition: 'bottom-left'
});
```

Open or close with update:

```js
window.ADPChatEmbed.update({ isOpen: true });
window.ADPChatEmbed.update({ isOpen: false });
```

### `setLanguage(language, config)`

Changes the iframe app language at runtime. The optional `config` object is
merged into the same update payload, so callers can send related i18n or app
config overrides with the language change.

`changeLanguage()` is an alias for `setLanguage()`.

```js
window.ADPChatEmbed.setLanguage('en');
window.ADPChatEmbed.changeLanguage('zh-HK');
```

With related config overrides:

```js
window.ADPChatEmbed.changeLanguage('en', {
  chatbotConfig: {
    // optional public chatbot config for this language
  }
});
```

### `getConfig()`

Returns a shallow copy of the current merged loader config.

```js
const config = window.ADPChatEmbed.getConfig();
console.log(config.language, config.apiConfig.baseURL);
```

Use it before applying partial updates:

```js
const current = window.ADPChatEmbed.getConfig();

window.ADPChatEmbed.update({
  apiConfig: {
    ...current.apiConfig,
    withCredentials: false
  }
});
```

## Waiting For The Loader

With `defer`, the API is usually available after DOM parsing. For defensive
integration code, wait until it exists:

```js
function onADPChatReady(callback) {
  if (window.ADPChatEmbed) {
    callback(window.ADPChatEmbed);
    return;
  }

  const timer = window.setInterval(() => {
    if (!window.ADPChatEmbed) return;
    window.clearInterval(timer);
    callback(window.ADPChatEmbed);
  }, 50);
}

onADPChatReady((chat) => {
  chat.changeLanguage('en');
});
```

## Runtime Message Flow

The loader and iframe use `postMessage`.

1. The loader creates the outer launcher and panel.
2. `open()` sets the iframe `src`.
3. The iframe app posts `{ type: 'adp-chat-embed-ready' }` to the parent.
4. The loader posts `{ type: 'adp-chat-embed-config', config }` to the iframe.
5. The iframe app applies `apiConfig`, `theme`, `language`, and embed mode.

The loader also retries config delivery after iframe load to avoid timing races.

## Complete Example

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Third-party Site</title>
  </head>
  <body>
    <button type="button" id="support-button">Open support</button>
    <button type="button" id="switch-lang">中文</button>

    <script>
      window.ADPChatEmbedConfig = {
        theme: 'light',
        language: 'en',
        mode: 'standard',
        isOpen: false,
        launcherPosition: 'bottom-right',
        width: '380px',
        height: '600px',
        apiConfig: {
          baseURL: 'https://e7fd-45-144-227-44.ngrok-free.app',
          withCredentials: true
        }
      };
    </script>
    <script
      src="https://e7fd-45-144-227-44.ngrok-free.app/adp-chat-loader.js"
      defer
    ></script>
    <script>
      document.querySelector('#support-button').addEventListener('click', () => {
        ADPChatEmbed.open();
      });

      document.querySelector('#switch-lang').addEventListener('click', () => {
        ADPChatEmbed.changeLanguage('zh-HK');
      });
    </script>
  </body>
</html>
```
