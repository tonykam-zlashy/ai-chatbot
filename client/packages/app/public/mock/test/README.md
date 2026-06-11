# Theme Test Fixtures — "Midnight Ocean"

Dark theme test data for the chatbot UI. To use:

**Option A — Swap into the app's load path:**
```bash
cp mock/test/chatbot-config.en.json mock/carer/chatbot-config.en.json
cp mock/test/chatbot-config.zh-HK.json mock/carer/chatbot-config.zh-HK.json
cp mock/test/chatbot-config.zh_CN.json mock/carer/chatbot-config.zh_CN.json
```

**Option B — Change the fixture path in code:**
Edit `client/packages/app/src/utils/chatbotConfig.ts`, line 214:
```
`mock/carer/chatbot-config.${fixtureLanguage}.json`
→ `mock/test/chatbot-config.${fixtureLanguage}.json`
```

**Option C — Load via embed-demo.html manually:**
Open the embed demo page and pass the test config URL as a parameter, or use the iframe/postMessage approach.

## What this tests

| Aspect | Carer (existing) | Midnight Ocean (test) |
|---|---|---|
| Mode | warm orange gradient | dark blue gradient |
| Background | `#fff8e8` warm | `#0f1a2e` dark navy |
| Primary action | `#b84222` rust | `#00d4aa` teal |
| User bubble | `#b84222` with white text | `#00d4aa` with dark text |
| User bubble border | `none` | `1px solid #00ffc8` |
| Assistant bubble | `#ffefd6` warm | `#162a45` dark blue |
| Footer | warm gradient | dark gradient |
| Panel | 380×600 fullscreen | 420×680 panel mode |
| Font/layout | unchanged (hardcoded) | unchanged (hardcoded) |

The hardcoded values (font, radii, shadows, header text color, sender bg, etc.)
will remain unchanged — this test makes those gaps visible.
