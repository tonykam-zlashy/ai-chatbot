# Chatbot Config Fixtures

These fixture files mirror the expected future public chatbot configuration API.
During the frontend POC, `Home.vue` and the static embed demo load these JSON
files instead of calling backend application/conversation APIs.

The app uses the carer fixtures under `carer/chatbot-config.*.json`. The
top-level `chatbot-config.*.json` files are kept as compatibility aliases for
older cached bundles or host pages.

Expected backend fields:

- `appId`, `language`
- `assistant.name`, `assistant.headerTitle`, `assistant.launcherAvatarUrl`, `assistant.messageAvatarUrl`, `assistant.greeting`
- `launcher.enabled`, `launcher.prompt`, `launcher.position`, `launcher.offsetX`, `launcher.offsetY`
- `panel.width`, `panel.height`, `panel.mobileMode`
- `theme.mode`, `theme.headerBackground`, `theme.surfaceBackground`, `theme.primaryAction`, `theme.bubbleBorder`, `theme.userBubbleBackground`, `theme.userBubbleText`, `theme.userBubbleBorder`, `theme.assistantBubbleBackground`, `theme.assistantText`, `theme.timestampText`, `theme.footerBackground`, `theme.footerIconColor`, `theme.hotlineBackground`, `theme.hotlineText`
- `terms.enabled`, `terms.storageScope`, `terms.titleTemplate`, `terms.intro`, `terms.links`, `terms.acceptInstruction`, `terms.scamNoticeBefore`, `terms.scamHotlineLabel`, `terms.scamHotlineUrl`, `terms.scamNoticeAfter`, `terms.acceptButton`, `terms.declineButton`, `terms.acceptedUserText`
- `composer.disabledPlaceholder`, `composer.enabledPlaceholder`
- `hotline.number`, `hotline.label`, `hotline.description`, `hotline.url`
- `features.termsGate`, `features.fileUpload`, `features.voiceInput`, `features.mockChat`
- `mockChat.reply`

`theme.headerBackground` is applied as a CSS `background` value, so it can be a
solid color such as `#f7943d` or a gradient such as
`linear-gradient(rgb(255, 194, 132) 0%, rgb(255, 126, 51) 100%)`.
