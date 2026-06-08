# Carers.hk Chatbot UI Frontend POC Checklist

## Important

- Chatbot core settings should be API-driven and should not be hardcoded in components.
- For now, use sample JSON fixture files to mock API responses.
- The frontend POC should validate the UI and config contract, not bake carers.hk values directly into Vue components.

## Approach

Build the POC as if the backend already provides a public chatbot configuration endpoint.

During the POC:

- Read chatbot settings from local JSON fixtures.
- Map fixture data into component props/state.
- Keep UI components generic and configurable.
- Use hardcoded values only as defensive fallback defaults.
- Keep bottom-right launcher/panel positioning in the embed loader layer, not in the inner chat app.
- Use the local app page to preview the inner chat surface and fixture-driven behavior.
- Use a separate static host/embed demo to preview bottom-right launcher behavior.

## Target Architecture

```text
Host page
  -> chatbot-loader.js
      -> loads chatbot config JSON/API
      -> renders bottom-right launcher
      -> opens iframe/panel
          -> inner chat app
              -> reads config from loader/query/postMessage or fixture during POC
              -> renders header, T&C, bubbles, composer, hotline
```

Ownership:

- Loader owns launcher GIF, bottom-right placement, panel iframe/container size, z-index, open/close.
- Inner chat app owns chat surface styling and behavior inside its container.
- Config/API owns names, avatars, copy, links, hotline, theme tokens, feature flags, and mock messages.

## POC Goal

Build a frontend-only proof of concept that visually behaves like the carers.hk chatbot using JSON fixture data instead of real backend APIs.

The POC should prove:

- Config-driven assistant identity.
- Config-driven avatars and launcher assets.
- Config-driven T&C copy, links, buttons, and persistence scope.
- Config-driven composer placeholders.
- Config-driven hotline strip.
- Config-driven feature flags for file upload, voice input, mock chat, and T&C gate.
- Carers.hk-style AI/user bubble styling.
- Inner chat app renders correctly at `100%` width/height inside a panel/container.
- A static embed demo can place launcher/panel at bottom-right using the same fixture config.

Backend integration is out of scope for this POC.

## Sample Fixture Contract

Create one or more JSON files under a clear fixture folder, for example:

- `client/packages/app/public/mock/chatbot-config.zh-HK.json`
- `client/packages/app/public/mock/chatbot-config.en-US.json`

Suggested shape:

```json
{
  "appId": "carers-poc",
  "language": "zh-HK",
  "assistant": {
    "name": "阿尖",
    "headerTitle": "阿尖",
    "launcherAvatarUrl": "https://carers-webchat.aienchat.com/avatar-zh-hk-v5.gif",
    "messageAvatarUrl": "https://carers-webchat.aienchat.com/message-zh-hk-v5.gif",
    "greeting": "您好👋🏻 我係阿尖！請問您想搵咩資訊？"
  },
  "launcher": {
    "enabled": true,
    "prompt": "想搵資訊?",
    "position": "bottom-right",
    "offsetX": 22,
    "offsetY": 16
  },
  "panel": {
    "width": 380,
    "height": 600,
    "mobileMode": "fullscreen"
  },
  "theme": {
    "mode": "carers",
    "headerBackground": "#f7943d",
    "surfaceBackground": "#fff8e8",
    "primaryAction": "#b84222",
    "bubbleBorder": "#b95a25"
  },
  "terms": {
    "enabled": true,
    "storageScope": "global",
    "titleTemplate": "你好，我是{{assistantName}}",
    "intro": "使用人工智能聊天機械人對話系統前，請先細閱並接受下列條款及細則。",
    "links": [
      { "label": "免責聲明", "url": "https://www.carers.hk/disclaimers" },
      { "label": "版權聲明", "url": "https://www.carers.hk/copyright-statement" },
      { "label": "私隱政策及個人資料收集聲明", "url": "https://www.carers.hk/personal-information-collection-statement" }
    ],
    "acceptInstruction": "如同意使用條款及細則，請點擊「接受」按鈕，點擊接受按鈕後，即表示您已閱讀、理解和同意使用條款及細則。",
    "scamNoticeBefore": "請注意，人工智能聊天機械人對話系統是不會向用戶索取任何個人資料。如有懷疑，請致電反詐騙諮詢熱線",
    "scamHotlineLabel": "「防騙易18222」",
    "scamHotlineUrl": "tel:18222",
    "scamNoticeAfter": "向警方求助。此外，用戶必須點擊「接受」按鈕，才能使用人工智能聊天機械人對話系統。",
    "acceptButton": "接受",
    "declineButton": "拒絕",
    "acceptedUserText": "接受"
  },
  "composer": {
    "disabledPlaceholder": "請先接受條款與細則後繼續",
    "enabledPlaceholder": "請輸入 (唔好俾個人資料呀!)"
  },
  "hotline": {
    "number": "182 183",
    "label": "24小時照顧者支援專線",
    "description": "如需要社工協助，請致電182183。",
    "url": "tel:182183"
  },
  "features": {
    "termsGate": true,
    "fileUpload": true,
    "voiceInput": true,
    "mockChat": true
  },
  "mockChat": {
    "reply": "呢個係前端 POC 回覆，正式聊天功能會喺後端整合階段接入。"
  }
}
```

## Current State

Already implemented:

- Carers-style GIF assets are used in component defaults.
- Orange header skin exists.
- T&C synthetic message exists.
- Accept/Decline flow exists.
- Disabled composer until T&C acceptance exists.
- Hotline strip exists.
- Local frontend POC/no-backend mode exists.
- Normal assistant bubbles have been styled closer to carers.hk.

Needs adjustment after the Important section:

- Replace hardcoded carers.hk copy/assets in components with config-driven values.
- Replace fixed local mock values in `Home.vue` with JSON fixture loading.
- Keep `Home.vue` as an inner app preview, not the final bottom-right embed shell.
- Move launcher and bottom-right panel behavior into loader/static embed demo scope.
- Avoid adding more carers.hk literals directly inside reusable components.

## Phase 1: Define Config Types And Fixture Loader

Goal: establish the frontend contract that later maps directly to real backend APIs.

Checklist:

- [x] Add a `ChatbotConfig` TypeScript type.
- [x] Include nested sections: `assistant`, `launcher`, `panel`, `theme`, `terms`, `composer`, `hotline`, `features`, `mockChat`.
- [x] Add sample JSON fixtures for Traditional Chinese and English.
- [x] Add a small fixture loader for POC mode.
- [x] Validate fixture defaults defensively when fields are missing.
- [x] Do not call real app/conversation APIs while fixture POC mode is active.
- [x] Document which fixture fields are expected to become backend API fields later.

Files likely involved:

- `client/packages/adp-chat-component/src/model/type.ts`
- `client/packages/app/src/pages/Home.vue`
- `client/packages/app/public/mock/*.json`
- `client/packages/app/src/config/` or `client/packages/app/src/utils/`

## Phase 2: Make Inner Chat App Config-driven

Goal: the inner chat surface should render from `ChatbotConfig`, not from hardcoded carers.hk constants.

Checklist:

- [x] Add a prop such as `chatbotConfig`.
- [x] Map `chatbotConfig.assistant.name` to header title and assistant name.
- [x] Map `chatbotConfig.assistant.messageAvatarUrl` to assistant message avatar.
- [x] Map `chatbotConfig.assistant.greeting` to post-accept greeting.
- [x] Map `chatbotConfig.terms` to the T&C synthetic message.
- [x] Map `chatbotConfig.composer.disabledPlaceholder`.
- [x] Map `chatbotConfig.composer.enabledPlaceholder`.
- [x] Map `chatbotConfig.hotline` to the footer strip.
- [x] Map `chatbotConfig.features.fileUpload` and `voiceInput`.
- [x] Keep existing defaults only as fallback behavior.

Files likely involved:

- `client/packages/adp-chat-component/src/App.vue`
- `client/packages/adp-chat-component/src/components/layout/Index.vue`
- `client/packages/adp-chat-component/src/components/layout/MainLayout.vue`
- `client/packages/adp-chat-component/src/components/Chat/Index.vue`
- `client/packages/adp-chat-component/src/components/Chat/ChatItem.vue`
- `client/packages/adp-chat-component/src/components/Chat/Sender.vue`

## Phase 3: Fixture-driven POC Mode

Goal: local POC should simulate API-driven settings without real backend integration.

Checklist:

- [x] `Home.vue` loads config fixture based on current language.
- [x] POC mode passes `chatbotConfig` into the chat component.
- [x] POC mode suppresses app/conversation/user/system API calls.
- [x] POC mode uses `features.mockChat` to decide whether local mock replies are enabled.
- [x] POC mock reply comes from `mockChat.reply`.
- [x] POC mode does not hardcode assistant identity in `Home.vue`.
- [x] POC mode does not hardcode T&C copy in component internals.
- [x] Add loading/fallback handling for missing fixture file.

Files likely involved:

- `client/packages/app/src/pages/Home.vue`
- `client/packages/adp-chat-component/src/components/layout/Index.vue`

## Phase 4: Loader-owned Launcher And Panel

Goal: bottom-right launcher behavior should be proven in a loader demo, not baked into the inner app page.

Checklist:

- [x] Keep inner app rendering full-size in its container.
- [x] Build or update a static embed demo page.
- [x] Demo loader reads the same config fixture.
- [x] Loader renders the launcher from `config.launcher`.
- [x] Loader owns bottom-right placement and offsets.
- [x] Loader opens a fixed-size panel from `config.panel`.
- [x] Loader passes config into the inner app.
- [x] Loader close/minimize returns to launcher.
- [x] Loader expand/fullscreen is controlled outside the inner app or passed as a container-size change.

Files likely involved:

- `client/packages/adp-chat-component/public/embed.js`
- `client/packages/app/public/mock/*.json`
- A new static host page, for example `client/packages/app/public/mock/embed-demo.html`

## Phase 5: Visual Styling From Config

Goal: carers.hk style remains reproducible, but not hardcoded as the only possible theme.

Checklist:

- [x] Apply theme tokens from `chatbotConfig.theme`.
- [x] Keep carers.hk defaults in the fixture JSON.
- [x] Use CSS variables for header background, surface background, primary action, and bubble border.
- [x] Keep AI response bubble style compact and bordered.
- [x] Keep user bubble style configurable but default to carers.hk red.
- [x] Keep T&C card style compact enough for 380px panel.
- [x] Keep composer/footer layout container-relative.
- [x] Avoid viewport-positioning CSS inside inner chat components.

Files likely involved:

- `client/packages/adp-chat-component/src/styles/theme.css`
- `client/packages/adp-chat-component/src/components/layout/MainLayout.vue`
- `client/packages/adp-chat-component/src/components/Chat/ChatItem.vue`
- `client/packages/adp-chat-component/src/components/Chat/Index.vue`
- `client/packages/adp-chat-component/src/components/Chat/Sender.vue`

## Phase 6: Frontend-only Mock Chat

Goal: make the UI reviewable after T&C acceptance without needing the AI backend.

Checklist:

- [x] Enable local typed user messages only when `features.mockChat` is true.
- [x] Append mock assistant replies from `mockChat.reply`.
- [x] Do not call real send-message APIs in fixture POC mode.
- [x] Do not show backend errors in fixture POC mode.
- [x] Keep mock behavior isolated so backend integration can replace it.

Files likely involved:

- `client/packages/adp-chat-component/src/components/layout/Index.vue`
- `client/packages/adp-chat-component/src/components/Chat/Index.vue`

## Phase 7: QA

Inner app preview:

- [x] Loads Traditional Chinese fixture.
- [x] Loads English fixture.
- [x] T&C copy comes from fixture.
- [x] Assistant name/avatar/greeting come from fixture.
- [x] Composer placeholders come from fixture.
- [x] Hotline text comes from fixture.
- [x] Mock reply comes from fixture.
- [x] No backend failure toasts appear in fixture POC mode.

Embed demo:

- [x] Launcher closed state matches fixture.
- [x] Launcher opens panel.
- [x] Panel size comes from fixture.
- [x] Close/minimize returns to launcher.
- [x] Inner chat fills the panel.
- [x] Mobile panel behavior is acceptable.

Visual checks:

- [x] Open T&C panel at `1280x720`.
- [x] Post-accept greeting at `1280x720`.
- [x] Mock message/reply state at `1280x720`.
- [x] Mobile open panel.
- [x] Mobile post-accept composer.

## Parked Backend/Integration Work

Do later, after fixture-driven frontend POC is accepted:

- [ ] Real chatbot config API.
- [ ] Real public/no-login guest API mode.
- [ ] Backend-supported visitor/session ID.
- [ ] Backend conversation creation.
- [ ] Backend conversation ID persistence and restore.
- [ ] Real message send endpoint.
- [ ] SSE streaming validation.
- [ ] File upload API behavior.
- [ ] Voice/ASR API behavior.
- [ ] Production iframe loader if required.
- [ ] Third-party integration docs.
- [ ] Cross-browser production QA.

## Suggested Next Implementation Order

1. Add `ChatbotConfig` type and JSON fixtures.
2. Replace hardcoded POC values in `Home.vue` with fixture loading.
3. Pass `chatbotConfig` through to the chat component.
4. Make T&C, assistant identity, composer, hotline, and mock reply read from config.
5. Move launcher/bottom-right behavior into a static embed-loader demo.
6. Apply theme values through CSS variables.
7. Capture inner app and embed demo screenshots against carers.hk.
