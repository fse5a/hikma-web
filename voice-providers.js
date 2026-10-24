import {readFile} from 'node:fs/promises';
import {resolve, sep} from 'node:path';

function serviceError(message, status = 503) {
  return Object.assign(new Error(message), {status});
}

function escapeXml(text) {
  return text.replace(/[<>&"']/g, character => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'}[character]));
}

function prepareSpeechText(text) {
  const normalized = text.normalize('NFC')
    .replace(/\p{Extended_Pictographic}\uFE0F?/gu, '')
    .replace(/[ \t]+([,،;؛.!؟?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ');
  return escapeXml(normalized
    .replace(/([,،;؛])\s*/g, '$1__HIKMA_COMMA_BREAK__')
    .replace(/([.!؟?])\s*/g, '$1__HIKMA_SENTENCE_BREAK__')
    .replace(/\r?\n/g, '__HIKMA_PARAGRAPH_BREAK__'))
    .replaceAll('__HIKMA_COMMA_BREAK__', '<break time="180ms"/>')
    .replaceAll('__HIKMA_SENTENCE_BREAK__', '<break time="320ms"/>')
    .replaceAll('__HIKMA_PARAGRAPH_BREAK__', '<break time="450ms"/>');
}

function splitSpeechText(text, limit = 4500) {
  const chunks = [];
  let remaining = text.trim();
  while (remaining.length > limit) {
    const window = remaining.slice(0, limit);
    const punctuation = Math.max(...['.', '!', '?', '؟', '۔', '\n'].map(mark => window.lastIndexOf(mark)));
    const boundary = punctuation >= limit * 0.5 ? punctuation + 1 : Math.max(window.lastIndexOf(' '), window.lastIndexOf('\n'));
    const end = boundary > 0 ? boundary : limit;
    chunks.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

async function assertConsent(voice, root) {
  if (!voice || voice.consent !== true || typeof voice.consentFile !== 'string') {
    throw serviceError('This friend voice is unavailable until explicit consent is recorded.', 403);
  }
  const consentPath = resolve(root, voice.consentFile);
  if (!consentPath.startsWith(`${resolve(root, 'voices')}${sep}`)) {
    throw serviceError('The voice consent record path is invalid.', 403);
  }
  try {
    const record = JSON.parse(await readFile(consentPath, 'utf8'));
    if (record.consent !== true || typeof record.grantedAt !== 'string') throw new Error('invalid_consent');
  } catch {
    throw serviceError('The required friend voice consent record is missing or invalid.', 403);
  }
}

export function createVoiceProvider({voices, root, env = process.env, fetchImpl = fetch}) {
  async function validateVoice(voiceId, lang) {
    const voice = voices.find(item => item.id === voiceId && item.language === lang);
    await assertConsent(voice, root);
    if (!voice.engineVoiceId) throw serviceError('This friend voice has no configured engine voice ID.');
    return voice;
  }

  async function azure({text, lang, pitch}) {
    const key = env.AZURE_SPEECH_KEY;
    const region = env.AZURE_SPEECH_REGION;
    if (!key || !region) throw serviceError('Azure Speech is not configured.');
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    const voice = lang === 'ar'
      ? (env.AZURE_SPEECH_AR_VOICE || 'ar-EG-SalmaNeural')
      : (env.AZURE_SPEECH_EN_VOICE || 'en-US-AvaMultilingualNeural');
    const pitchValue = `${pitch >= 0 ? '+' : ''}${pitch}st`;
    const ssml = `<speak version="1.0" xml:lang="${locale}"><voice name="${voice}"><prosody pitch="${pitchValue}">${prepareSpeechText(text)}</prosody></voice></speak>`;
    const response = await fetchImpl(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'HikmaReadingApp'
      },
      body: ssml
    });
    if (!response.ok) throw serviceError('Azure Speech could not generate audio.', response.status === 429 ? 429 : 502);
    return {audio: Buffer.from(await response.arrayBuffer()), provider: 'azure', fallback: false};
  }

  async function cloned({text, voiceId, lang, pitch}) {
    const voice = voices.find(item => item.id === voiceId && item.language === lang);
    await assertConsent(voice, root);
    if (!voice.engineVoiceId) throw serviceError('This friend voice has no configured engine voice ID.');
    if (!env.ELEVENLABS_API_KEY) throw serviceError('The friend voice provider is not configured.');
    if (pitch !== 0) throw serviceError('This cloned voice engine does not support semitone pitch control. Use an Azure voice for pitch changes.', 422);
    const response = await fetchImpl(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.engineVoiceId)}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {'xi-api-key': env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg'},
      body: JSON.stringify({text, model_id: 'eleven_multilingual_v2'})
    });
    if (!response.ok) throw serviceError('The friend voice provider could not generate audio.', response.status === 429 ? 429 : 502);
    return {audio: Buffer.from(await response.arrayBuffer()), provider: 'elevenlabs', fallback: false};
  }

  return Object.freeze({
    async listVoices() {
      const available = [];
      for (const voice of voices) {
        try {
          await assertConsent(voice, root);
          if (voice.engineVoiceId && env.ELEVENLABS_API_KEY) {
            available.push({id: voice.id, language: voice.language, displayName: voice.displayName});
          }
        } catch {}
      }
      return available;
    },
    validateVoice,
    async synthesize({text, voiceId, lang, pitch = 0}) {
      const chunks = splitSpeechText(text);
      const results = [];
      let fallback = false;
      for (const chunk of chunks) {
        if (!voiceId) {
          results.push(await azure({text: chunk, lang, pitch}));
          continue;
        }
        try {
          results.push(await cloned({text: chunk, voiceId, lang, pitch}));
        } catch (error) {
          if (error.status === 403 || error.status === 422 || !env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) throw error;
          fallback = true;
          results.push(await azure({text: chunk, lang, pitch}));
        }
      }
      return {audio: Buffer.concat(results.map(result => result.audio)), provider: fallback ? 'azure' : results[0].provider, fallback};
    }
  });
}