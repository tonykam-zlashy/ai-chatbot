# Adapt Carers.hk-style Chatbot UI Todo

## Context

Goal: adapt the existing ADP chat frontend into a public, embeddable chatbot experience visually similar to the carers.hk chatbot.

Recommended delivery approach: a JavaScript embed loader that creates an isolated iframe chatbot panel.

```html
<script src="https://your-domain.com/chatbot-loader.js"></script>
<script>
  Chatbot.init({
    container: "body",
    appId: "xxx",
    language: "zh-HK",
    position: "bottom-right",
    theme: "carers",
    persistSession: true,
  });
</script>
```

## Feasibility Summary

- The plan is workable in this project.
- The repo already has a reusable chat component, overlay mode, internal chat state, SSE streaming, UMD build output, and a global JS mount API.
- The main missing frontend pieces are:
  - Carers.hk-style launcher and panel skin.
  - Terms and conditions disclaimer gate.
  - Public/no-login widget entry flow.
  - Browser session persistence.
  - Production `chatbot-loader.js`.
  - Iframe wrapper and postMessage config bridge.
  - Font-size compatibility API for host page A/A/A controls.

### Restyle Current Chat Widget To Carers.hk Style

- [ ] Animated avatar launcher.
- [ ] Orange header panel.
- [ ] Terms and conditions disclaimer/accept screen.
- [ ] Chat bubble styling.
- [ ] Input bar styling.
- [ ] Basic desktop/mobile layout.

### Make It Usable As A Public Widget Frontend

Assumption: backend API already supports public/guest chat.

- [ ] Public/no-login frontend flow.
- [ ] Existing conversation route support.
- [ ] Browser session identity.
- [ ] Persisted conversation ID/history pointer.
- [ ] Responsive behavior.
- [ ] Error/loading/empty states.
- [ ] Basic QA across major browsers/OS.
- [ ] A/A/A font-size compatibility via exposed JS API where iframe integration allows it.

### Third-party Embed Delivery Package

- [ ] `chatbot-loader.js`.
- [ ] Floating avatar launcher on third-party sites.
- [ ] Isolated iframe panel.
- [ ] Configurable language/app/theme.
- [ ] Minimal integration docs.
- [ ] Cross-site/mobile QA.

## Key Findings

### Existing Hosted App Auth Flow

The hosted Vue app currently assumes an authenticated session.

- `client/packages/app/src/router/index.ts`
  - Route guard checks `/account/info`.
  - Redirects to `/login` if no `token` cookie is present.
- `client/packages/app/src/service/login.ts`
  - `isLoggedIn()` checks only the `token` cookie.
- `client/packages/app/src/pages/Home.vue`
  - Mounts `ADPChat` after route guard.
  - Syncs selected conversation/application with the URL hash.

Implication: the chatbot must be public, so the hosted app auth wrapper must be removed or bypassed for the chatbot entry. The public chatbot route/widget must not redirect to `/login` when no `token` cookie exists.

Required frontend work:

- [ ] Remove or bypass the route guard for the public chatbot entry in `client/packages/app/src/router/index.ts`.
- [ ] Avoid calling `/account/info` as an auth gate before rendering the public chatbot.
- [ ] Avoid redirecting unauthenticated public-widget users to `/login`.
- [ ] Prefer mounting the reusable component directly for the public widget instead of using the hosted app login/router shell.

### Existing Reusable Widget Foundation

The reusable component already supports direct JS mounting.

- `client/packages/adp-chat-component/src/main.ts`
  - Exposes `init`, `update`, `getProps`, and `unmount`.
  - Publishes `window.ADPChatComponent`.
- `client/packages/adp-chat-component/public/example.html`
  - Already demonstrates loading `adp-chat-component.umd.js` and `adp-chat-component.css`.
- `client/packages/adp-chat-component/package.json`
  - Builds both ES and UMD bundles.

Implication: third-party embed is feasible, but current demo is direct DOM injection. The proposed production approach should add a loader that creates an iframe.

### Current Launcher And Overlay

Current UI already has a floating launcher and overlay panel.

- `client/packages/adp-chat-component/src/App.vue`
  - Props include `showToggleButton`, `isOverlay`, `width`, `height`, `isOpen`, `onOpenChange`, and `onOverlayChange`.
  - Current launcher is `.toggle-btn`.
  - Current panel is `.panel-park--overlay`.

Implication: carers.hk-style avatar launcher and orange panel can be built by replacing/restyling these areas rather than rebuilding the chat from scratch.

### Header, Chat Body, Input, And Bubbles

Relevant components for visual restyle:

- `client/packages/adp-chat-component/src/components/layout/MainLayout.vue`
  - Header layout and close/action slots.
- `client/packages/adp-chat-component/src/components/Chat/Index.vue`
  - Chat list, empty state, sharing mode, footer composer.
- `client/packages/adp-chat-component/src/components/Chat/ChatItem.vue`
  - User/assistant message rendering and action buttons.
- `client/packages/adp-chat-component/src/components/Chat/Sender.vue`
  - Input bar, upload menu, voice button, send/stop button.

Implication: the visual restyle is component-local and should not require changing the backend contract.

### Terms And Conditions Gate

No current T&C accept gate exists in the reusable component.

Required behavior:

- The T&C prompt should appear as the first AI chat response, not as a separate modal/full-screen disclaimer.
- The AI T&C response should include `Accept` and `Decline` buttons inside the chat message area.
- Until the user clicks `Accept`, the input box should be visually dimmed and disabled.
- If the user clicks `Decline`, the chatbot should prompt the same T&C AI response again and keep the input disabled.
- Only after `Accept` should the input box become active and normal chat begin.

Best insertion options:

- In `client/packages/adp-chat-component/src/components/layout/Index.vue`, inject a synthetic assistant record into `actualChatList` before normal conversation records when T&C is not accepted.
- In `client/packages/adp-chat-component/src/components/Chat/ChatItem.vue`, add a dedicated T&C action-message rendering path with `Accept` and `Decline` buttons.
- In `client/packages/adp-chat-component/src/components/Chat/Sender.vue`, add a disabled/dimmed mode controlled by T&C acceptance state.

Checklist:

- [ ] Store acceptance in localStorage.
- [ ] Add configurable T&C copy and button labels through widget config.
- [ ] Render T&C as the first assistant/AI chat response.
- [ ] Add `Accept` and `Decline` buttons to the T&C chat response.
- [ ] Disable and dim the input box until acceptance.
- [ ] On `Decline`, re-show the T&C AI response and keep input disabled.
- [ ] On `Accept`, persist acceptance and enable the input box.

### Browser Session Persistence

Current component runtime state is in memory only.

- `client/packages/adp-chat-component/src/components/layout/Index.vue`
  - `conversationRuntimeStates`
  - `currentConversationStateKey`
  - `createPendingConversationKey`

Needed additions:

- [ ] Generate `visitorId` or `sessionId` in browser.
- [ ] Store accepted T&C state.
- [ ] Store current app ID.
- [ ] Store current conversation ID.
- [ ] Optionally cache recent records until backend history is fetched.

Suggested localStorage keys:

```text
adp_chat_visitor_id
adp_chat_accepted_terms
adp_chat_app_id
adp_chat_conversation_id
adp_chat_font_scale
```

### SSE Streaming

Frontend SSE support already exists.

- `client/packages/adp-chat-component/src/service/api.ts`
  - `sendMessage()` uses fetch adapter and stream response.
- `client/packages/adp-chat-component/src/model/sseRequest-reasoning.ts`
  - Parses SSE `data:` lines.
- `client/packages/adp-chat-component/src/components/layout/Index.vue`
  - Applies streaming events to runtime records.

Note: deployment still needs backend/proxy support, such as nginx `proxy_buffering off`. That is not frontend implementation work, but frontend QA should verify streaming in the deployed environment.

### Voice Input

Voice input exists but language selection is not clearly configurable from the widget config today.

- `client/packages/adp-chat-component/src/components/Chat/Sender.vue`
  - Opens ASR WebSocket and records microphone audio.
- `client/packages/adp-chat-component/src/components/layout/Index.vue`
  - Reads `EnableVoiceInput` from system config.
- `client/packages/app/src/pages/Home.vue`
  - Passes `asrUrlApi`.

Needed if voice language is in scope:

- [ ] Add widget config for ASR language.
- [ ] Pass language into ASR URL request if backend supports it.
- [ ] Verify EN / Cantonese / Mandarin behavior with backend ASR support.

### A/A/A Font-size Compatibility

Iframe isolation means host page CSS will not automatically affect chatbot font size.

Recommended approach:

- [ ] Add `fontScale` config to loader.
- [ ] Add public API:

```js
Chatbot.setFontScale("normal");
Chatbot.setFontScale("large");
Chatbot.setFontScale("x-large");
```

- [ ] Loader sends font scale changes into iframe via `postMessage`.
- [ ] Iframe applies a class or CSS variable such as `--chatbot-font-scale`.

## Proposed Implementation Checklist

### Phase 1: Public Widget Entry

- [ ] Decide whether the public widget uses the reusable component directly or a dedicated `widget.html` entry.
- [ ] Add public widget config type.
- [ ] Add localStorage session helper.
- [ ] Restore `currentApplicationId` and `currentConversationId` from storage.
- [ ] Persist conversation ID after new conversation is created.
- [ ] Add no-login frontend mode that avoids hosted app `/login` routing.

### Phase 2: Carers.hk Skin

- [ ] Add `theme: "carers"` or equivalent style variant.
- [ ] Replace current launcher icon with configurable animated avatar GIF/image.
- [ ] Restyle overlay panel dimensions, border radius, shadow, and position.
- [ ] Restyle header to orange bar.
- [ ] Add hotline/info strip if required.
- [ ] Restyle message bubbles and bot avatar.
- [ ] Restyle input bar, upload button, mic button, and send button.
- [ ] Verify desktop and mobile layouts.

### Phase 3: Terms Gate

- [ ] Add T&C state and localStorage persistence.
- [ ] Add T&C copy/config props.
- [ ] Render T&C prompt as the first AI chat response on first open.
- [ ] Add `Accept` and `Decline` buttons inside the T&C chat response.
- [ ] Disable and visually dim the input box until accepted.
- [ ] On decline, prompt the T&C AI response again and keep input disabled.
- [ ] On accept, persist acceptance and enable normal chat.
- [ ] Add tests/manual QA for refresh persistence.

### Phase 4: Embed Loader

- [ ] Create `chatbot-loader.js`.
- [ ] Loader creates iframe with configured URL.
- [ ] Loader passes config by query params or `postMessage`.
- [ ] Loader exposes `Chatbot.init`.
- [ ] Loader exposes `Chatbot.open`, `Chatbot.close`, `Chatbot.destroy`.
- [ ] Loader exposes `Chatbot.setFontScale`.
- [ ] Add iframe resize/position handling.
- [ ] Add minimal third-party integration docs.

### Phase 5: QA

- [ ] Desktop Chrome/Safari/Edge.
- [ ] iOS Safari.
- [ ] Android Chrome.
- [ ] Refresh persistence.
- [ ] New tab behavior.
- [ ] Embedded iframe on a simple static host page.
- [ ] Host CSS conflict check.
- [ ] Streaming response behavior check.
- [ ] Error/loading/empty states.

## Risks And Assumptions

- Public/no-login chat requires backend API support. Frontend can hide login and persist browser state, but cannot bypass backend auth safely by itself.
- True chat history across devices requires backend persistence.
- Iframe is recommended for third-party delivery, but host A/A/A controls need explicit JS integration.
- Voice language verification depends on backend ASR support and browser microphone permissions.
