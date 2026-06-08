# Chatbot Config Fixtures

These fixture files mirror the expected future public chatbot configuration API.
During the frontend POC, `Home.vue` and the static embed demo load these JSON
files instead of calling backend application/conversation APIs.

Expected backend fields:

- `appId`, `language`
- `assistant.name`, `assistant.headerTitle`, `assistant.launcherAvatarUrl`, `assistant.messageAvatarUrl`, `assistant.greeting`
- `launcher.enabled`, `launcher.prompt`, `launcher.position`, `launcher.offsetX`, `launcher.offsetY`
- `panel.width`, `panel.height`, `panel.mobileMode`
- `theme.mode`, `theme.headerBackground`, `theme.surfaceBackground`, `theme.primaryAction`, `theme.bubbleBorder`
- `terms.enabled`, `terms.storageScope`, `terms.titleTemplate`, `terms.intro`, `terms.links`, `terms.acceptInstruction`, `terms.scamNoticeBefore`, `terms.scamHotlineLabel`, `terms.scamHotlineUrl`, `terms.scamNoticeAfter`, `terms.acceptButton`, `terms.declineButton`, `terms.acceptedUserText`
- `composer.disabledPlaceholder`, `composer.enabledPlaceholder`
- `hotline.number`, `hotline.label`, `hotline.description`, `hotline.url`
- `features.termsGate`, `features.fileUpload`, `features.voiceInput`, `features.mockChat`
- `mockChat.reply`
