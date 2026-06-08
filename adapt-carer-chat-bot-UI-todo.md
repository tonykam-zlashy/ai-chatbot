# Carers.hk Chatbot UI Adaptation Checklist

## Goal

Make the ADP chat frontend behave like the carers.hk chatbot:

- Bottom-right animated character launcher.
- Compact floating chat panel.
- Orange header with panel controls.
- T&C gate shown as the first assistant message.
- Disabled composer until T&C is accepted.
- Public/no-login guest chat flow.
- Production-ready third-party embed path.

## Current State

Already implemented in the reusable chat component:

- Carers-style GIF launcher assets.
- Overlay panel support.
- Orange header skin.
- Carers-style assistant/user bubbles.
- Hotline footer strip.
- T&C synthetic assistant message.
- Accept/Decline buttons.
- Disabled composer until acceptance.
- LocalStorage-backed T&C acceptance.
- Synthetic user "接受"/"Accept" record and assistant greeting after acceptance.
- Direct DOM embed loader at `client/packages/adp-chat-component/public/embed.js`.
- Embed API for `init`, `update`, `open`, `close`, `toggle`, language/theme changes, launcher config, and accessibility options.

Known gaps from local UI check:

- `http://localhost:5174/#/` currently renders as a full-page chat, not the carers.hk bottom-right panel.
- The local UI shows app/conversation load failure toasts.
- The launcher needs the carers.hk speech-bubble prompt, not only the animated avatar.
- The panel dimensions and density are still too wide for desktop parity.
- The production embed architecture is not settled: existing direct DOM embed versus new iframe-isolated embed.

## Phase 1: Confirm Delivery Mode

Choose one delivery mode before more implementation.

- [ ] Decide whether production embed must be iframe-isolated.
- [ ] If iframe is required, keep `embed.js` only as legacy/direct mode and create a separate iframe loader.
- [ ] If iframe is not required, rename/document the existing `ADPChatEmbed` direct DOM loader as the production embed path.
- [ ] Document the final public API name: `ADPChatEmbed` or `Chatbot`.
- [ ] Document the required backend public/guest API assumptions.

Recommended default:

- Use the existing direct DOM embed for the next UI parity pass.
- Add iframe only if host-page CSS isolation, cookie isolation, or third-party deployment policy requires it.

## Phase 2: Match Carers.hk Launcher

Reference behavior:

- Closed state shows a small animated character at bottom-right.
- A small speech bubble says "想搵資訊?" near the character.
- Launcher sits above other bottom/right page utilities without blocking them.

Checklist:

- [ ] Add configurable launcher prompt text.
- [ ] Render prompt bubble beside/above the GIF launcher.
- [ ] Support Traditional Chinese and English launcher prompt copy.
- [ ] Verify bottom-right positioning at desktop width.
- [ ] Verify mobile positioning does not overlap browser chrome or page controls.
- [ ] Add config for `launcherOffsetX` and `launcherOffsetY` defaults that match carers.hk more closely.
- [ ] Ensure launcher remains visible when the chat panel is closed.
- [ ] Ensure launcher is hidden or replaced cleanly when the chat panel is open.

Files likely involved:

- `client/packages/adp-chat-component/src/App.vue`
- `client/packages/adp-chat-component/public/embed.js`
- `client/packages/adp-chat-component/src/model/type.ts`

## Phase 3: Match Floating Panel Layout

Reference behavior:

- Panel is anchored bottom-right.
- Desktop panel is narrow, roughly 380px wide and 600px tall.
- Header is compact orange with title on the left.
- Header has minimize, expand, and close controls on the right.
- Chat content scrolls inside the panel.
- Footer composer and hotline strip stay fixed at the bottom of the panel.

Checklist:

- [ ] Make overlay mode the default for public/widget use.
- [ ] Tune default overlay width and height to carers.hk proportions.
- [ ] Keep full-page mode available for hosted app/debug use.
- [ ] Add or verify minimize control.
- [ ] Add or verify expand/fullscreen control.
- [ ] Add or verify close control.
- [ ] Make the footer composer width match the panel instead of page width.
- [ ] Keep hotline strip inside the panel footer in overlay mode.
- [ ] Remove excess empty space above/below T&C card in overlay mode.
- [ ] Verify desktop screenshot against carers.hk open-panel state.
- [ ] Verify mobile screenshot uses a sensible near-fullscreen panel.

Files likely involved:

- `client/packages/adp-chat-component/src/App.vue`
- `client/packages/adp-chat-component/src/components/layout/MainLayout.vue`
- `client/packages/adp-chat-component/src/components/Chat/Index.vue`
- `client/packages/adp-chat-component/src/components/Chat/Sender.vue`

## Phase 4: Finalize T&C Gate Behavior

Reference behavior:

- T&C appears as the first assistant message.
- Composer is disabled until acceptance.
- Accept appends a user "接受"/"Accept" bubble.
- Assistant then sends the greeting.
- Decline keeps the composer disabled and keeps or re-shows the T&C prompt.
- Refresh preserves acceptance.

Already mostly implemented. Use this phase for hardening, not rebuilding.

Checklist:

- [ ] Confirm T&C is never blocked by app/conversation loading failures.
- [ ] Confirm Accept appends the user acceptance record in local UI.
- [ ] Confirm assistant greeting appears after acceptance.
- [ ] Confirm composer placeholder changes from disabled copy to normal input copy.
- [ ] Confirm Decline keeps input disabled.
- [ ] Confirm Decline re-prompts or keeps the T&C message visible.
- [ ] Confirm localStorage acceptance persists across refresh.
- [ ] Decide acceptance scope: per app, per conversation, or global widget.
- [ ] Remove duplicate or stale T&C implementation notes after scope is decided.

Files likely involved:

- `client/packages/adp-chat-component/src/components/layout/Index.vue`
- `client/packages/adp-chat-component/src/components/Chat/Index.vue`
- `client/packages/adp-chat-component/src/components/Chat/Sender.vue`

## Phase 5: Public No-login Guest Flow

Current issue:

- Local UI shows app/conversation list load failure toasts.
- The public chatbot should render usable T&C and guest chat without requiring a logged-in hosted app session.

Checklist:

- [ ] Add an explicit public/widget mode flag, for example `publicMode` or `guestMode`.
- [ ] In public/widget mode, do not redirect unauthenticated users to `/login`.
- [ ] In public/widget mode, do not show app list failure toasts before the chat can be used.
- [ ] Provide a default application ID/name/avatar for guest mode.
- [ ] Generate and persist a browser `visitorId`.
- [ ] Persist current `conversationId` after the backend creates one.
- [ ] Restore `conversationId` on refresh when valid.
- [ ] Handle missing/expired conversation ID by starting a new guest conversation.
- [ ] Show a user-readable error only when message sending fails.
- [ ] Verify SSE streaming still works in guest mode.

Files likely involved:

- `client/packages/app/src/router/index.ts`
- `client/packages/app/src/pages/Home.vue`
- `client/packages/adp-chat-component/src/components/layout/Index.vue`
- `client/packages/adp-chat-component/src/service/api.ts`
- `client/packages/adp-chat-component/public/embed.js`

## Phase 6: Embed Package

If keeping direct DOM embed:

- [ ] Document `ADPChatEmbed.init(config)`.
- [ ] Document script-tag `data-*` options.
- [ ] Add `destroy()` if production integrators need teardown.
- [ ] Add `setFontScale("normal" | "large" | "x-large")` convenience API, or document current numeric accessibility API.
- [ ] Add a static example page that simulates a third-party host.
- [ ] Verify host CSS does not visibly break the widget.

If adding iframe embed:

- [ ] Create `chatbot-loader.js`.
- [ ] Loader creates bottom-right launcher in host page.
- [ ] Loader creates iframe panel only when opened, or keeps it mounted if persistence requires it.
- [ ] Loader passes config to iframe by query string or `postMessage`.
- [ ] Iframe validates accepted message origins.
- [ ] Loader exposes `init`, `open`, `close`, `toggle`, `destroy`, and `setFontScale`.
- [ ] Iframe applies font scale via CSS variable.
- [ ] Add a minimal hosted `widget.html` entry.
- [ ] Add a static third-party integration example.

Do not implement both paths fully unless there is a concrete deployment need.

## Phase 7: Visual QA

Desktop checks:

- [ ] Closed launcher matches carers.hk placement and prompt.
- [ ] Open panel width/height matches carers.hk closely.
- [ ] Header controls are visible and usable.
- [ ] T&C card fits without awkward horizontal overflow.
- [ ] Composer and hotline strip remain pinned at bottom.
- [ ] Accept flow matches carers.hk.
- [ ] User and assistant bubbles match color, border, and spacing closely.

Mobile checks:

- [ ] Launcher does not block important page controls.
- [ ] Open panel uses safe viewport height.
- [ ] Composer remains usable with virtual keyboard.
- [ ] T&C buttons remain tappable.
- [ ] Header controls remain tappable.

Browser checks:

- [ ] Chrome desktop.
- [ ] Safari desktop.
- [ ] Edge desktop.
- [ ] iOS Safari.
- [ ] Android Chrome.

## Phase 8: Functional QA

- [ ] Fresh visitor sees T&C first.
- [ ] Accept persists after refresh.
- [ ] Decline does not enable input.
- [ ] Message send creates or reuses a guest conversation.
- [ ] Streaming response renders incrementally.
- [ ] Network/API errors show a helpful message without breaking layout.
- [ ] File upload button behavior is correct for public mode.
- [ ] Voice button behavior is correct for public mode.
- [ ] A/A/A font-size control works through the chosen embed API.
- [ ] Widget can be mounted on a plain static HTML host page.

## Suggested Next Implementation Order

1. Make local `http://localhost:5174` run in the same overlay/widget mode as carers.hk.
2. Fix or suppress public-mode app/conversation loading failures.
3. Tighten launcher visual parity, including prompt bubble.
4. Tighten overlay panel dimensions and footer/composer layout.
5. Verify T&C accept/decline/refresh behavior.
6. Finalize direct DOM versus iframe embed.
7. Add integration docs and static host example.
