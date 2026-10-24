# Hikma Reading App

## Run locally

Requires Node.js 20 or newer.

```powershell
npm start
```

Open http://127.0.0.1:4173. The local server serves the app and securely proxies translation and speech requests.

## Optional natural translation and voice

Copy `.env.example` to `.env`, then fill in Azure Translator and Azure Speech resource values. Keys stay in `.env` and are never sent to the browser. Restart the server after changing configuration. The app checks configuration at `/api/config`.

- Azure Translator uses `AZURE_TRANSLATOR_KEY`, optional `AZURE_TRANSLATOR_REGION`, and `AZURE_TRANSLATOR_ENDPOINT`.
- Azure Neural Speech uses `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`. Default voices are `ar-EG-SalmaNeural` and `en-US-AvaMultilingualNeural`.

Cloud translation and speech are requested only when the user chooses those actions. Story text is sent to Azure for the selected action. Without credentials, device speech and manually supplied translations remain available.

## Additional configuration

Copy `.env.example` to `.env` to set API rate limits, daily character quota, upstream timeout, cache size, activation codes, and optional ElevenLabs API credentials. The server listens on `127.0.0.1`; do not expose it directly to the public internet without adding authenticated accounts and a production-grade proxy/rate limiter. API limits and activation attempts are process-local; daily character usage and redeemed codes are stored in the ignored `.cache/` directory.

Friend voice entries live in `voices.json`. Both example entries are disabled (`consent: false`) because no consent documents, audio samples, or provider voice IDs were supplied. A valid record must also exist at the configured consent path. The selected ElevenLabs multilingual provider supports Arabic and English; the current public documentation restricts Professional Voice Cloning to verified clones of the speaker's own voice. Friend samples are ignored by git under `voices/` and are never accepted through an unauthenticated upload route. See [ASSUMPTIONS.md](ASSUMPTIONS.md) before configuring voice data.

The server-side URL importer only fetches public HTTP(S) HTML pages, blocks private/reserved IPs and unsafe redirects, and returns a preview. ISBN lookup validates checksums and queries Open Library. Camera barcode scanning and page OCR require browser support for `BarcodeDetector` and `TextDetector`; otherwise the app asks for manual entry. There is no LLM provider configured, so natural-tone translation and Arabic diacritization are not claimed.

## Tests and quality review

```powershell
npm test
npm start
```

`test-sentences.json` contains 20 Arabic and 20 English speech checks. Once Azure Speech is configured, `npm run test:voice-quality` writes MP3 files to the ignored `quality-review-output/` folder. Listening and scoring those files is a manual human-review step; the repository does not claim an 18/20 quality score until a reviewer records that result. See [ACCESSIBILITY-TESTING.md](ACCESSIBILITY-TESTING.md) for TalkBack, VoiceOver, NVDA, and planned axe-core checks.

## Current limitations

- The application still uses the original inline script plus `restored-features.js`; it has not yet been decomposed into the requested settings/reader/cloud/library/UI ES modules.
- Translation is Azure-only. There is no LLM natural-tone fallback or validated Arabic tashkeel service.
- Server-side user accounts, library sync, secure parent PIN, and authenticated administrator workflows need a database and identity provider. Current browser storage remains local to one device.
- QR activation, automatic ISBN-to-page OCR, and activation-code provisioning are not complete. Typed activation codes are checked server-side, with the explicitly enabled demo code intended only for local trials.
- Browser/device accessibility audits and human audio-quality scoring remain required; see the manual checklist.
