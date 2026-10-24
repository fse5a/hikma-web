# Accessibility Manual Verification

Automated browser checks do not replace testing with assistive technology. Record browser/OS versions, skin, Kids mode, accessibility settings, and pass/fail for each run.

## TalkBack (Android Chrome)

- Start with cleared site data. Confirm the floating accessibility button is visible before activation and at least 64 px high; tap once and confirm the Arabic discovery prompt is audible.
- Complete activation, age, and help choices using TalkBack swipe navigation and double-tap. Confirm the spoken labels identify each choice.
- Open the library, search/filter, add a story, open the reader, change reading language, start, pause, resume, seek, and close using TalkBack only.
- Confirm selected language, right-to-left Arabic text, sentence position, and play state are announced without overlapping story playback.
- Open every dialog and verify focus/announcement on entry, Escape/back closes where supported, and focus returns to the invoking control.
- Repeat with each skin, Kids mode, high contrast, 200% text, and reduced motion.

## VoiceOver (iOS Safari)

- Repeat the first-run discovery and keyboard/rotor-independent workflows using VoiceOver gestures.
- Verify sliders announce values in times/semitones, language selection announces the current language, and controls remain operable at 200% text.
- Verify recording permissions, audio playback controls, background/lock-screen behavior, and return to the current sentence after interruption.
- Repeat all skins, Kids mode, high contrast, reduced motion, and accessibility mode on/off.

## NVDA (Windows Firefox and Chrome)

- Complete activation, library, story add, reader, language switch, translation failure/manual edit, and settings workflows with keyboard only.
- Confirm skip link visibility on focus, landmarks, logical tab order, visible focus, dialog focus containment/return, and no keyboard traps.
- Confirm range values, status messages, active sentence/word highlighting, and cloud configuration errors are announced.
- Repeat all skins, Kids mode, accessibility mode on/off, 200% text, and reduced motion.

## Automated audit

- Run `npm test` for settings, provider, URL address filtering, and quality-set checks.
- Run axe-core with Playwright after adding the test dependency and test harness. Cover the library, onboarding, reader, add-story form, voice settings, and app settings for standard/Kids modes, each skin, and accessibility on/off.
- Current automated accessibility coverage is incomplete. This checklist is not a claim that axe reports zero serious or critical violations.
