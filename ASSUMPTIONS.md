# Assumptions and External Dependencies

- The local browser is the current source of truth. There is no user database, authentication system, account service, or sync backend in this repository, so server-side accounts, parental PIN security, and library sync cannot be represented as secure until an identity provider and database are selected.
- No `.env`, Azure credentials, LLM credentials, friend audio samples, or signed consent documents were supplied. Cloud translation/speech and friend voice cloning must remain explicitly unavailable until configured; app behavior must not imply a successful cloud operation.
- Voice cloning provider selected for evaluation: ElevenLabs Multilingual models, because its published language list includes Arabic and English. Its current pricing page lists Starter at $6/month with commercial licensing and Instant Voice Cloning (promotional prices may change); Creator is listed at $22/month and includes Professional Voice Cloning. Pricing is subject to change.
- ElevenLabs' current voice-cloning documentation says Professional Voice Clones must be created and verified by the speaker, and cannot be created by another person even with their consent. A friend must create/verify their own clone and share it privately. Until then, friend voice records remain `consent: false`, and synthesis must refuse them. Do not upload recordings to any provider without separate, explicit consent and legal review.
- The current repo has no admin authentication. Local configuration is not proof that a user is an admin; voice sample enrollment must remain an operator-only deployment task until authenticated admin accounts exist.
- Device speech is an explicitly lower-quality fallback. It is not equivalent to Azure neural speech or a cloned voice. Human-recorded story audio remains a separate per-story feature, not a cloned voice provider.
- Arabic tashkeel/LLM enrichment is not available without a configured and evaluated language service. Original display text must remain unchanged; do not generate or claim validated diacritics offline.
- Browser-only verification is available here, but physical TalkBack, VoiceOver, NVDA, Android Chrome audio timing, and human voice-quality review require real devices/listeners.

Provider references checked on 2026-10-24:

- https://elevenlabs.io/docs/overview/capabilities/voices
- https://elevenlabs.io/docs/creative-platform/voices/voice-cloning
- https://elevenlabs.io/pricing