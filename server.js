import {createServer} from 'node:http';
import {mkdir, readFile, readdir, rename, stat, unlink, writeFile} from 'node:fs/promises';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createHash, timingSafeEqual} from 'node:crypto';
import {extname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createVoiceProvider} from './voice-providers.js';
import {importStoryFromUrl} from './url-import.js';

const root = fileURLToPath(new URL('.', import.meta.url));

function loadEnv() {
  try {
    for (const line of readFileSync(resolve(root, '.env'), 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || match[1] in process.env) continue;
      const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
      process.env[match[1]] = value;
    }
  } catch {}
}
loadEnv();
const maxTextLength = Math.max(5000, Number(process.env.API_MAX_TEXT_LENGTH) || 40000);
const rateWindowMs = Math.max(1000, Number(process.env.API_RATE_WINDOW_MS) || 60000);
const rateLimitCount = Math.max(1, Number(process.env.API_RATE_LIMIT) || 30);
const dailyCharacterLimit = Math.max(1, Number(process.env.API_DAILY_CHAR_QUOTA) || 100000);
const upstreamTimeoutMs = Math.max(1000, Number(process.env.UPSTREAM_TIMEOUT_MS) || 15000);
const cacheDirectory = resolve(root, '.cache', 'speech');
const maxCacheBytes = Math.max(1024 * 1024, Number(process.env.TTS_CACHE_MAX_BYTES) || 100 * 1024 * 1024);
const requestBuckets = new Map();
const activationAttempts = new Map();
const activationFile = resolve(root, '.cache', 'used-activation-codes.json');
let usedActivationCodes = new Set();
try { usedActivationCodes = new Set(JSON.parse(readFileSync(activationFile, 'utf8'))); } catch {}
const usageFile = resolve(root, '.cache', 'api-usage.json');
let dailyUsage = {day: new Date().toISOString().slice(0, 10), used: 0};
try {
  const savedUsage = JSON.parse(readFileSync(usageFile, 'utf8'));
  if (savedUsage.day === dailyUsage.day && Number.isInteger(savedUsage.used) && savedUsage.used >= 0) dailyUsage = savedUsage;
} catch {}
const voices = JSON.parse(readFileSync(resolve(root, 'voices.json'), 'utf8'));
const voiceProvider = createVoiceProvider({voices, root, fetchImpl: (url, options = {}) => fetch(url, {...options, signal: AbortSignal.timeout(upstreamTimeoutMs)})});

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.cognitive.microsofttranslator.com https://*.tts.speech.microsoft.com https://api.elevenlabs.io; img-src 'self' data: blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  };
}

function consumeRequest(req) {
  const key = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (requestBuckets.get(key) || []).filter(time => now - time < rateWindowMs);
  if (recent.length >= rateLimitCount) throw Object.assign(new Error('rate_limit_exceeded'), {status: 429});
  recent.push(now);
  if (!requestBuckets.has(key) && requestBuckets.size >= 10000) {
    for (const [client, timestamps] of requestBuckets) {
      if (!timestamps.some(time => now - time < rateWindowMs)) requestBuckets.delete(client);
    }
    if (requestBuckets.size >= 10000) requestBuckets.delete(requestBuckets.keys().next().value);
  }
  requestBuckets.set(key, recent);
  return key;
}

function consumeCharacters(text) {
  const day = new Date().toISOString().slice(0, 10);
  if (dailyUsage.day !== day) dailyUsage = {day, used: 0};
  if (dailyUsage.used + text.length > dailyCharacterLimit) throw Object.assign(new Error('daily_character_quota_exceeded'), {status: 429});
  dailyUsage.used += text.length;
  mkdirSync(resolve(root, '.cache'), {recursive: true});
  writeFileSync(usageFile, JSON.stringify(dailyUsage));
}

function safeEqual(first, second) {
  const left = Buffer.from(first);
  const right = Buffer.from(second);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function activate(req, res) {
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const attempts = (activationAttempts.get(ip) || []).filter(time => now - time < 15 * 60 * 1000);
  if (attempts.length >= 5) return send(res, 429, {error: 'activation_attempt_limit', message: 'Too many attempts. Try again in 15 minutes.'});
  attempts.push(now);
  activationAttempts.set(ip, attempts);
  const body = await readJson(req);
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  const isDemoCode = process.env.ENABLE_DEMO_ACTIVATION !== 'false' && safeEqual(code, 'HK-DEMO-0001');
  if (!isDemoCode && !/^HK(-[A-Z0-9]{4}){3}$/.test(code)) return send(res, 400, {error: 'invalid_activation_code', message: 'The activation code format is invalid.'});
  const configuredCodes = (process.env.ACTIVATION_CODES || '').split(',').map(value => value.trim().toUpperCase()).filter(Boolean);
  const validConfigured = configuredCodes.some(candidate => safeEqual(code, candidate));
  const demoAllowed = isDemoCode;
  if ((!validConfigured && !demoAllowed) || usedActivationCodes.has(code)) {
    return send(res, 403, {error: 'activation_code_rejected', message: 'This activation code is invalid, expired, or already used.'});
  }
  if (validConfigured) {
    usedActivationCodes.add(code);
    mkdirSync(resolve(root, '.cache'), {recursive: true});
    writeFileSync(activationFile, JSON.stringify([...usedActivationCodes]));
  }
  activationAttempts.delete(ip);
  return send(res, 200, {activated: true, demo: demoAllowed && !validConfigured});
}

function assertSameOrigin(req) {
  const origin = req.headers.origin;
  const expectedProtocol = process.env.TRUST_PROXY_TLS === 'true' ? 'https:' : 'http:';
  if (!origin || new URL(origin).origin !== `${expectedProtocol}//${req.headers.host}`) throw Object.assign(new Error('same_origin_required'), {status: 403});
}

async function readCachedSpeech(key) {
  try { return await readFile(resolve(cacheDirectory, `${key}.mp3`)); } catch { return null; }
}

async function writeCachedSpeech(key, audio) {
  if (audio.length > maxCacheBytes) return;
  await mkdir(cacheDirectory, {recursive: true});
  const entries = await Promise.all((await readdir(cacheDirectory)).map(async name => {
    const path = resolve(cacheDirectory, name);
    const info = await stat(path).catch(() => null);
    return info?.isFile() ? {path, size: info.size, mtime: info.mtimeMs} : null;
  }));
  let total = entries.filter(Boolean).reduce((sum, entry) => sum + entry.size, 0);
  for (const entry of entries.filter(Boolean).sort((a, b) => a.mtime - b.mtime)) {
    if (total + audio.length <= maxCacheBytes) break;
    await unlink(entry.path).catch(() => {});
    total -= entry.size;
  }
  const path = resolve(cacheDirectory, `${key}.mp3`);
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, audio);
  await rename(temporary, path);
}

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    ...securityHeaders()
  });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
};

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > Math.min(256_000, maxTextLength * 4 + 2048)) throw Object.assign(new Error('request_too_large'), {status: 413});
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('invalid_json'), {status: 400});
  }
}

function validateText(value) {
  if (typeof value !== 'string' || !value.trim()) throw Object.assign(new Error('text_required'), {status: 400});
  if (value.length > maxTextLength) throw Object.assign(new Error('text_too_long'), {status: 413});
  return value.trim();
}

function validateLanguage(value) {
  if (value !== 'ar' && value !== 'en') throw Object.assign(new Error('unsupported_language'), {status: 400});
  return value;
}

function normalizeIsbn(value) {
  const isbn = typeof value === 'string' ? value.replace(/[\s-]/g, '').toUpperCase() : '';
  const sum13 = [...isbn].slice(0, 12).reduce((sum, digit, index) => sum + Number(digit) * (index % 2 ? 3 : 1), 0);
  const valid13 = /^97[89]\d{10}$/.test(isbn) && (10 - sum13 % 10) % 10 === Number(isbn[12]);
  const valid10 = /^\d{9}[\dX]$/.test(isbn) && [...isbn].reduce((sum, digit, index) => sum + (digit === 'X' ? 10 : Number(digit)) * (10 - index), 0) % 11 === 0;
  if (!valid13 && !valid10) throw Object.assign(new Error('Enter a valid ISBN-10 or ISBN-13.'), {status: 400});
  return isbn;
}

function splitText(text, limit = 4500) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > limit) {
    const window = remaining.slice(0, limit);
    const punctuation = Math.max(...['.', '!', '?', '؟', '۔', '\n'].map(mark => window.lastIndexOf(mark)));
    const boundary = punctuation >= limit * 0.5 ? punctuation + 1 : window.lastIndexOf(' ');
    const end = boundary > 0 ? boundary : limit;
    chunks.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function escapeXml(text) {
  return text.replace(/[<>&"']/g, character => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'}[character]));
}

async function translate(req, res) {
  const body = await readJson(req);
  const text = validateText(body.text);
  const from = validateLanguage(body.from);
  const to = validateLanguage(body.to);
  if (from === to) return send(res, 200, {text, from, to});
  const key = process.env.AZURE_TRANSLATOR_KEY;
  if (!key) return send(res, 503, {error: 'translation_not_configured', message: 'Add Azure Translator settings to .env.'});
  consumeCharacters(text);

  const endpoint = (process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com').replace(/\/+$/, '');
  const target = new URL(`${endpoint}/translate`);
  target.searchParams.set('api-version', '3.0');
  target.searchParams.set('from', from);
  target.searchParams.set('to', to);
  const headers = {'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/json'};
  if (process.env.AZURE_TRANSLATOR_REGION) headers['Ocp-Apim-Subscription-Region'] = process.env.AZURE_TRANSLATOR_REGION;

  const translatedParts = [];
  for (const chunk of splitText(text)) {
    const upstream = await fetch(target, {method: 'POST', headers, body: JSON.stringify([{text: chunk}]), signal: AbortSignal.timeout(upstreamTimeoutMs)});
    if (!upstream.ok) return send(res, upstream.status === 429 ? 429 : 502, {error: 'translation_failed', message: 'Azure Translator could not translate this text.'});
    const result = await upstream.json();
    const translated = result?.[0]?.translations?.[0]?.text;
    if (!translated) return send(res, 502, {error: 'translation_failed', message: 'The translation service returned no text.'});
    translatedParts.push(translated);
  }
  send(res, 200, {text: translatedParts.join(''), from, to});
}

async function synthesize(req, res) {
  const body = await readJson(req);
  const text = validateText(body.text);
  const language = validateLanguage(body.lang);
  const pitch = Number.isFinite(Number(body.pitch)) ? Math.max(-6, Math.min(6, Number(body.pitch))) : 0;
  const voiceId = typeof body.voiceId === 'string' ? body.voiceId.slice(0, 100) : '';
  if (voiceId) await voiceProvider.validateVoice(voiceId, language);
  else if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) return send(res, 503, {error: 'speech_not_configured', message: 'Add Azure Speech settings to .env.'});
  const voiceKey = voiceId || (language === 'ar' ? process.env.AZURE_SPEECH_AR_VOICE || 'ar-EG-SalmaNeural' : process.env.AZURE_SPEECH_EN_VOICE || 'en-US-AvaMultilingualNeural');
  const cacheKey = createHash('sha256').update(JSON.stringify({engine: voiceId ? 'elevenlabs' : 'azure', voiceKey, language, text, pitch})).digest('hex');
  let audio = await readCachedSpeech(cacheKey);
  let provider = voiceId ? 'elevenlabs' : 'azure';
  let fallback = false;
  if (!audio) {
    consumeCharacters(text);
    const result = await voiceProvider.synthesize({text, voiceId, lang: language, pitch});
    audio = result.audio;
    provider = result.provider;
    fallback = result.fallback;
    if (!fallback) await writeCachedSpeech(cacheKey, audio).catch(error => console.error(JSON.stringify({level: 'warn', event: 'speech_cache_write_failed', message: error.message})));
  }
  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Content-Length': audio.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'X-Hikma-Voice-Provider': provider,
    'X-Hikma-Voice-Fallback': String(fallback)
  });
  res.end(audio);
}

async function importUrl(req, res) {
  const body = await readJson(req);
  if (typeof body.url !== 'string' || body.url.length > 2048) return send(res, 400, {error: 'invalid_url', message: 'Enter a valid story URL.'});
  const story = await importStoryFromUrl(body.url);
  return send(res, 200, story);
}

async function lookupIsbn(req, res, url) {
  const isbn = normalizeIsbn(url.searchParams.get('isbn'));
  const upstream = await fetch(`https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`, {signal: AbortSignal.timeout(upstreamTimeoutMs)});
  if (upstream.status === 404) return send(res, 404, {error: 'isbn_not_found', message: 'No book metadata was found for this ISBN.'});
  if (!upstream.ok) return send(res, 502, {error: 'isbn_lookup_failed', message: 'The book catalog is temporarily unavailable.'});
  const metadata = await upstream.json();
  if (!metadata.title) return send(res, 404, {error: 'isbn_not_found', message: 'No book title was found for this ISBN.'});
  return send(res, 200, {isbn, title: String(metadata.title).slice(0, 90), authors: Array.isArray(metadata.authors) ? metadata.authors.length : 0});
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const isApi = url.pathname.startsWith('/api/');
  if (isApi) {
    consumeRequest(req);
    if (req.method === 'POST') assertSameOrigin(req);
  }
  if (req.method === 'POST' && url.pathname === '/api/activate') return activate(req, res);
  if (req.method === 'POST' && url.pathname === '/api/import-url') return importUrl(req, res);
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, {status: 'ok', node: process.versions.node, services: {translation: Boolean(process.env.AZURE_TRANSLATOR_KEY), azureSpeech: Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION), friendSpeech: Boolean(process.env.ELEVENLABS_API_KEY)}});
  }
  if (req.method === 'GET' && url.pathname === '/api/isbn') return lookupIsbn(req, res, url);
  if (req.method === 'GET' && url.pathname === '/api/config') {
    return send(res, 200, {
      translation: Boolean(process.env.AZURE_TRANSLATOR_KEY),
      speech: Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION)
    });
  }
  if (req.method === 'GET' && url.pathname === '/api/voices') return send(res, 200, await voiceProvider.listVoices());
  if (req.method === 'POST' && url.pathname === '/api/translate') return translate(req, res);
  if (req.method === 'POST' && url.pathname === '/api/speech') return synthesize(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, {error: 'method_not_allowed'});

  let requested;
  try { requested = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1)); }
  catch { return send(res, 400, {error: 'invalid_path'}); }
  if (!['index.html', 'restored-features.js', 'settings.js'].includes(requested)) return send(res, 404, {error: 'not_found'});
  const filePath = resolve(root, requested);
  if (!filePath.startsWith(`${resolve(root)}${sep}`)) return send(res, 404, {error: 'not_found'});
  try {
    const data = await readFile(filePath);
    const contentType = extname(requested) === '.js' ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8';
    res.writeHead(200, {'Content-Type': contentType, ...securityHeaders()});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    send(res, 404, {error: 'not_found'});
  }
}

const server = createServer((req, res) => {
  const started = Date.now();
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  res.on('finish', () => console.log(JSON.stringify({level: 'info', event: 'http_request', method: req.method, path: pathname, status: res.statusCode, durationMs: Date.now() - started})));
  handle(req, res).catch(error => {
    if (res.headersSent) return res.destroy();
    const status = error.status || (['TimeoutError', 'AbortError'].includes(error.name) ? 504 : 502);
    send(res, status, {error: error.message || 'service_unavailable'});
  });
});

const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
if (process.env.AZURE_SPEECH_KEY && !process.env.AZURE_SPEECH_REGION) console.warn(JSON.stringify({level: 'warn', event: 'incomplete_azure_speech_configuration'}));
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({level: 'info', event: 'server_started', url: `http://127.0.0.1:${port}`, node: process.versions.node})));
