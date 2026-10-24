import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {request as httpRequest} from 'node:http';
import {request as httpsRequest} from 'node:https';
import {Readability} from '@mozilla/readability';
import {JSDOM, VirtualConsole} from 'jsdom';

const maxBytes = 2 * 1024 * 1024;
const maxRedirects = 3;

function ipv4IsPublic(address) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  const [first, second, third] = octets;
  return !(
    first === 0 || first === 10 || first === 127 || first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 168 || (second === 0 && third === 0) || (second === 0 && third === 2))) ||
    (first === 198 && (second === 18 || second === 19 || (second === 51 && third === 100))) ||
    (first === 203 && second === 0 && third === 113)
  );
}

function ipv6IsPublic(address) {
  const value = address.toLowerCase().split('%')[0];
  if (value.startsWith('::ffff:')) {
    const mapped = value.slice(7);
    if (mapped.includes('.')) return ipv4IsPublic(mapped);
    const halves = mapped.split(':');
    if (halves.length === 2) {
      const combined = Number.parseInt(halves[0], 16) * 65536 + Number.parseInt(halves[1], 16);
      const ipv4 = [combined >>> 24, (combined >>> 16) & 255, (combined >>> 8) & 255, combined & 255].join('.');
      return ipv4IsPublic(ipv4);
    }
    return false;
  }
  const first = Number.parseInt(value.split(':')[0], 16);
  if (!Number.isFinite(first) || first < 0x2000 || first > 0x3fff) return false;
  const second = value.startsWith('2001:') ? Number.parseInt(value.split(':')[1] || '0', 16) : -1;
  if (value.startsWith('2001:') && second <= 1) return false;
  if (value.startsWith('2001:db8:') || value.startsWith('2002:')) return false;
  return true;
}

export function isPublicAddress(address) {
  const family = isIP(address);
  return family === 4 ? ipv4IsPublic(address) : family === 6 ? ipv6IsPublic(address) : false;
}

async function resolvePublicAddress(hostname) {
  const results = await lookup(hostname, {all: true, verbatim: true});
  if (!results.length || results.some(result => !isPublicAddress(result.address))) {
    throw Object.assign(new Error('URL resolves to a private or reserved network address.'), {status: 403});
  }
  return results[0];
}

function requestBuffer(url, address) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const request = transport(url, {
      method: 'GET',
      headers: {'User-Agent': 'HikmaStoryImporter/1.0', Accept: 'text/html,application/xhtml+xml'},
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
      servername: url.hostname,
      signal: AbortSignal.timeout(10000)
    }, response => {
      const status = response.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status)) {
        response.resume();
        resolve({redirect: response.headers.location});
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        reject(Object.assign(new Error(`The source page returned HTTP ${status}.`), {status: 502}));
        return;
      }
      const type = String(response.headers['content-type'] || '').toLowerCase();
      if (!type.includes('text/html') && !type.includes('application/xhtml+xml')) {
        response.resume();
        reject(Object.assign(new Error('The URL must point to an HTML page.'), {status: 415}));
        return;
      }
      const declaredLength = Number(response.headers['content-length']);
      if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
        response.destroy();
        reject(Object.assign(new Error('The source page is larger than 2 MB.'), {status: 413}));
        return;
      }
      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > maxBytes) {
          response.destroy(Object.assign(new Error('The source page is larger than 2 MB.'), {status: 413}));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => resolve({buffer: Buffer.concat(chunks), type}));
      response.on('error', reject);
    });
    request.on('error', reject);
    request.end();
  });
}

async function fetchHtml(url, redirects = 0) {
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw Object.assign(new Error('Only public HTTP and HTTPS pages can be imported.'), {status: 400});
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const address = isIP(hostname) ? {address: hostname, family: isIP(hostname)} : await resolvePublicAddress(hostname);
  if (!isPublicAddress(address.address)) throw Object.assign(new Error('Private network addresses cannot be imported.'), {status: 403});
  const result = await requestBuffer(url, address);
  if (!result.redirect) return {html: result.buffer.toString('utf8'), finalUrl: url.href};
  if (redirects >= maxRedirects || !result.redirect) throw Object.assign(new Error('Too many redirects from the source page.'), {status: 400});
  const next = new URL(result.redirect, url);
  return fetchHtml(next, redirects + 1);
}

export async function importStoryFromUrl(value) {
  let url;
  try { url = new URL(value); }
  catch { throw Object.assign(new Error('Enter a valid story URL.'), {status: 400}); }
  const {html, finalUrl} = await fetchHtml(url);
  const dom = new JSDOM(html, {url: finalUrl, virtualConsole: new VirtualConsole()});
  try {
    const article = new Readability(dom.window.document, {charThreshold: 120}).parse();
    const text = (article?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40000);
    if (text.length < 120) throw Object.assign(new Error('No readable story text was found on this page.'), {status: 422});
    return {title: (article.title || dom.window.document.title || 'Imported story').trim().slice(0, 90), text, sourceUrl: finalUrl};
  } finally {
    dom.window.close();
  }
}