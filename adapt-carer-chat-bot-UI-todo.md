# Carers.hk Chatbot UI Frontend POC Checklist

## POC Goal

Build a frontend-only proof of concept that visually behaves like the carers.hk chatbot, even if real AI chat, guest sessions, backend history, and SSE streaming are not working yet.

The POC should prove:

- Bottom-right animated character launcher.
- Launcher speech bubble prompt.
- Compact floating panel anchored bottom-right.
- Orange header with panel controls.
- T&C message as the first assistant message.
- Disabled composer until T&C is accepted.
- Accept/Decline visual flow.
- Hotline footer strip.
- Responsive desktop/mobile layout.

Backend integration is explicitly out of scope for this POC.

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

Known frontend gaps from UI comparison:

- `http://localhost:5174/#/` currently renders as a full-page chat, not the carers.hk bottom-right panel.
- Local UI shows app/conversation load failure toasts, which distract from the frontend POC.
- Launcher needs the carers.hk speech-bubble prompt, not only the animated avatar.
- Desktop panel is too wide and sparse compared with carers.hk.
- Composer/footer layout should be constrained to the floating panel.
- Need a static/mock mode so UI can be tested without backend availability.

## POC Non-goals

Do not spend this POC on:

- Real public/guest backend authentication.
- Conversation creation APIs.
- Conversation history persistence from backend.
- SSE streaming correctness.
- ASR/voice backend language handling.
- File upload backend behavior.
- Cross-device chat history.
- Production iframe isolation.
- Full third-party deployment hardening.

These belong in a later backend/integration phase.

## Phase 1: Create A Frontend POC Mode

Goal: let the UI be developed and reviewed without backend calls blocking the experience.

Checklist:

- [ ] Add a `frontendPocMode`, `mockMode`, or similar config flag.
- [ ] In POC mode, skip or suppress app list loading.
- [ ] In POC mode, skip or suppress conversation list loading.
- [ ] In POC mode, do not show app/conversation failure toasts.
- [ ] Provide fixed mock assistant identity:
  - Traditional Chinese: `阿尖`
  - English: `JimmyBuddy`
- [ ] Provide fixed mock avatar URLs from the carers-webchat assets already used in code.
- [ ] Provide fixed mock opening state with only the T&C prompt.
- [ ] After Accept, show the synthetic user acceptance bubble and assistant greeting.
- [ ] Keep message sending disabled, mocked, or visually inert until backend integration starts.
- [ ] Make `http://localhost:5174` easy to launch directly into this POC mode.

Files likely involved:

- `client/packages/app/src/pages/Home.vue`
- `client/packages/adp-chat-component/src/App.vue`
- `client/packages/adp-chat-component/src/components/layout/Index.vue`
- `client/packages/adp-chat-component/public/embed.js`
- `client/packages/adp-chat-component/src/model/type.ts`

## Phase 2: Match Closed Launcher

Reference behavior:

- Closed state shows the animated character near the bottom-right.
- A small speech bubble says `想搵資訊?`.
- Launcher sits above page utilities and does not block important controls.

Checklist:

- [ ] Add configurable launcher prompt text.
- [ ] Render a speech bubble beside/above the GIF launcher.
- [ ] Use Traditional Chinese default prompt: `想搵資訊?`
- [ ] Add English default prompt if language starts with `en`.
- [ ] Tune desktop bottom/right offsets to match carers.hk.
- [ ] Tune mobile bottom/right offsets separately if needed.
- [ ] Ensure click target is large enough and obvious.
- [ ] Ensure launcher disappears or changes cleanly when panel opens.
- [ ] Verify closed state screenshot against carers.hk.

Files likely involved:

- `client/packages/adp-chat-component/src/App.vue`
- `client/packages/adp-chat-component/public/embed.js`
- `client/packages/adp-chat-component/src/model/type.ts`

## Phase 3: Match Floating Panel Shell

Reference behavior:

- Panel opens bottom-right.
- Desktop panel is compact, roughly carers.hk sized.
- Header is orange and dense.
- Header title is `阿尖` / `JimmyBuddy`.
- Header controls include minimize, expand/fullscreen, and close.

Checklist:

- [ ] Make overlay mode the default for POC mode.
- [ ] Tune desktop overlay width to about `380px`.
- [ ] Tune desktop overlay height to about `600px`, or `min(600px, calc(100vh - safe margins))`.
- [ ] Use near-fullscreen layout on small mobile viewports.
- [ ] Keep panel anchored bottom-right on desktop.
- [ ] Verify close button closes to launcher.
- [ ] Verify minimize button closes to launcher or visually matches carers.hk behavior.
- [ ] Verify expand button toggles a larger/fullscreen panel.
- [ ] Keep full-page mode available for non-POC/debug use.
- [ ] Verify open panel screenshot against carers.hk.

Files likely involved:

- `client/packages/adp-chat-component/src/App.vue`
- `client/packages/adp-chat-component/src/components/layout/MainLayout.vue`

## Phase 4: Tighten T&C Visual Flow

Reference behavior:

- T&C appears inside the chat scroll area as the first assistant message.
- Composer is disabled until acceptance.
- Accept appends a user `接受` / `Accept` bubble.
- Assistant then sends the greeting.
- Decline keeps the composer disabled.

Checklist:

- [ ] Ensure POC mode always shows T&C first on fresh localStorage.
- [ ] Ensure T&C card width fits the compact panel.
- [ ] Reduce excess top/bottom whitespace around the T&C card.
- [ ] Match carers.hk T&C link styling and button spacing.
- [ ] Confirm Accept appends synthetic user acceptance bubble.
- [ ] Confirm assistant greeting appears after acceptance.
- [ ] Confirm Decline keeps input disabled and T&C visible.
- [ ] Add a simple way to reset local T&C state during POC QA.
- [ ] Decide whether POC acceptance should be global or per app; prefer global for POC simplicity.

Files likely involved:

- `client/packages/adp-chat-component/src/components/layout/Index.vue`
- `client/packages/adp-chat-component/src/components/Chat/Index.vue`
- `client/packages/adp-chat-component/src/components/Chat/Sender.vue`

## Phase 5: Composer And Footer Visuals

Reference behavior:

- Composer is fixed at the bottom of the panel.
- Disabled composer has disabled placeholder copy.
- After acceptance, composer is visually enabled.
- File and voice icons are visible if enabled.
- Hotline strip sits below/near composer inside the panel.

Checklist:

- [ ] Constrain composer width to the floating panel.
- [ ] Keep composer pinned while chat content scrolls.
- [ ] Match disabled placeholder:
  - Traditional Chinese: `請先接受條款與細則後繼續`
  - English: `Please accept T&C`
- [ ] Match enabled placeholder:
  - Traditional Chinese: `請輸入 (唔好俾個人資料呀!)`
  - English equivalent if needed.
- [ ] Show file upload icon visually in POC mode, even if action is disabled/mocked.
- [ ] Show voice icon visually in POC mode, even if action is disabled/mocked.
- [ ] Keep hotline strip inside the panel footer.
- [ ] Match hotline text and spacing.

Files likely involved:

- `client/packages/adp-chat-component/src/components/Chat/Sender.vue`
- `client/packages/adp-chat-component/src/components/layout/MainLayout.vue`
- `client/packages/adp-chat-component/src/components/Chat/Index.vue`

## Phase 6: Frontend-only Mock Chat Behavior

Goal: make the UI reviewable after T&C acceptance without needing the AI backend.

Checklist:

- [ ] Decide whether message input should be enabled in POC mode after Accept.
- [ ] If enabled, append typed user message locally.
- [ ] Add one mock assistant reply locally, for example `呢個係前端 POC 回覆，正式聊天功能會喺後端整合階段接入。`
- [ ] Do not call real send-message APIs in POC mode.
- [ ] Do not show backend errors in POC mode.
- [ ] Make mock behavior easy to remove or bypass for backend integration.

Files likely involved:

- `client/packages/adp-chat-component/src/components/layout/Index.vue`
- `client/packages/adp-chat-component/src/components/Chat/Index.vue`

## Phase 7: Frontend Visual QA

Desktop screenshots:

- [ ] Closed launcher at `1280x720`.
- [ ] Open T&C panel at `1280x720`.
- [ ] Post-accept greeting at `1280x720`.
- [ ] Mock message/reply state at `1280x720`.

Mobile screenshots:

- [ ] Closed launcher at mobile viewport.
- [ ] Open T&C panel at mobile viewport.
- [ ] Post-accept composer at mobile viewport.

Interaction checks:

- [ ] Launcher opens panel.
- [ ] Close returns to launcher.
- [ ] Minimize returns to launcher.
- [ ] Expand/fullscreen works or is intentionally hidden for POC.
- [ ] Accept enables composer.
- [ ] Decline keeps composer disabled.
- [ ] Refresh behavior is acceptable for POC.
- [ ] Resetting local T&C state works for repeated QA.

## Phase 8: Parked Backend/Integration Work

Do later, after frontend POC is accepted:

- [ ] Public/no-login guest API mode.
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

1. Add frontend POC/mock mode and stop backend load toasts in that mode.
2. Make `localhost:5174` show bottom-right overlay widget by default for POC.
3. Add launcher speech bubble.
4. Tighten floating panel dimensions/header/footer.
5. Tighten T&C card and accept/decline visual flow.
6. Add optional local mock send/reply behavior.
7. Capture desktop and mobile screenshots against carers.hk.
