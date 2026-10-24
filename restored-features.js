(() => {
  const settings = state.settings;
  const firstRun = !Object.prototype.hasOwnProperty.call(settings, 'activated');
  Object.assign(settings, {
    activated: settings.activated === true,
    age: firstRun ? null : (settings.age || null),
    a11y: firstRun ? null : (settings.a11y ?? null),
    skin: settings.skin || 'hikma',
    voiceSource: settings.voiceSource || 'device',
    stars: Number(settings.stars || 0),
    theme: settings.theme === 'dark' || (!Object.prototype.hasOwnProperty.call(settings, 'theme') && (settings.skin === 'cat' || window.matchMedia?.('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light'
  });
  state.activity = {...{completed: 0, opened: 0, recent: [], days: []}, ...(state.activity || {})};
  state.stories = state.stories.map(item => {
    const translationLang = item.translationLang || (item.lang === 'ar' ? 'en' : 'ar');
    const translations = {...(item.translations || {})};
    if (item.translation && !translations[translationLang]) translations[translationLang] = item.translation;
    return {...item, favorite: !!item.favorite, translations};
  });

  const skins = {
    hikma: {name: 'حكمة', icon: '🦉', green: '#176b5c', dark: '#105447', mint: '#dcece1', paper: '#f5f3eb', surface: '#fffefa', ink: '#183b3b', muted: '#647675'},
    cat: {name: 'قطة الفضاء', icon: '🐱', green: '#7c5cfa', dark: '#4b34b8', mint: '#cfc4ff', paper: '#1b1446', surface: '#2a2063', ink: '#f3eeff', muted: '#cfc4ff'},
    bot: {name: 'الروبوت الودود', icon: '🤖', green: '#4f7c96', dark: '#2f5063', mint: '#bfd6e3', paper: '#dce9f0', surface: '#fff', ink: '#12343b', muted: '#46656b'}
  };
  const palettes = {
    hikma: {
      light: {paper: '#f5f3eb', surface: '#fffefa', ink: '#183b3b', muted: '#647675', line: '#dce3db', green: '#176b5c', dark: '#105447', mint: '#dcece1'},
      dark: {paper: '#101f20', surface: '#182c2d', ink: '#e8f4ef', muted: '#aec5bd', line: '#355150', green: '#63b9a1', dark: '#3d806e', mint: '#244443'}
    },
    cat: {
      light: {paper: '#f4f0ff', surface: '#fff', ink: '#28204b', muted: '#625b7e', line: '#ded8ef', green: '#7255c7', dark: '#5739a0', mint: '#e9e2fa'},
      dark: {paper: '#171226', surface: '#231d36', ink: '#f5f0ff', muted: '#c2b7dc', line: '#4a4063', green: '#b3a0ff', dark: '#9078e8', mint: '#38304f'}
    },
    bot: {
      light: {paper: '#eef4f7', surface: '#fff', ink: '#173442', muted: '#556d78', line: '#d3e0e6', green: '#426d83', dark: '#2f5063', mint: '#dce9f0'},
      dark: {paper: '#111f27', surface: '#1c303a', ink: '#e4f3f7', muted: '#aac2cd', line: '#39525d', green: '#93c0d5', dark: '#56839a', mint: '#263d49'}
    }
  };
  const catArt = `<svg class="owl" viewBox="0 0 260 260" role="img" aria-label="قطة الفضاء"><polygon points="52,90 62,20 112,62" style="fill:var(--green-dark)"/><polygon points="208,90 198,20 148,62" style="fill:var(--green-dark)"/><circle cx="130" cy="140" r="86" style="fill:var(--green)"/><circle cx="130" cy="140" r="98" fill="none" stroke="#fff" stroke-width="8" opacity=".85"/><ellipse cx="130" cy="170" rx="46" ry="34" style="fill:var(--mint)"/><circle cx="98" cy="128" r="16" fill="#fff"/><circle cx="162" cy="128" r="16" fill="#fff"/><circle cx="101" cy="130" r="8" fill="#12343b"/><circle cx="165" cy="130" r="8" fill="#12343b"/><path d="M120 158h20l-10 12z" fill="#ff7ab6"/><path d="M130 170c0 12-18 14-24 6m24-6c0 12 18 14 24 6" fill="none" stroke="#12343b" stroke-width="3"/><g stroke="#12343b" stroke-width="3"><path d="m40 160 42 6m-42 16 42-6m138-10 42-6m-42 22 42 6"/></g><path d="m224 32 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ff7ab6"/></svg>`;
  const botArt = `<svg class="owl" viewBox="0 0 260 260" role="img" aria-label="الروبوت الودود"><path d="M130 22v30" stroke="#12343b" stroke-width="8" stroke-linecap="round"/><circle cx="130" cy="20" r="12" fill="#9be15d"/><rect x="48" y="52" width="164" height="132" rx="34" style="fill:var(--green)"/><rect x="30" y="96" width="18" height="44" rx="8" style="fill:var(--green-dark)"/><rect x="212" y="96" width="18" height="44" rx="8" style="fill:var(--green-dark)"/><rect x="70" y="80" width="120" height="64" rx="22" fill="#12343b"/><rect x="88" y="98" width="30" height="28" rx="8" fill="#f2c85b"/><rect x="142" y="98" width="30" height="28" rx="8" fill="#f2c85b"/><rect x="104" y="158" width="52" height="10" rx="5" style="fill:var(--mint)"/><rect x="78" y="190" width="104" height="52" rx="18" style="fill:var(--green-dark)"/></svg>`;
  const patterns = {
    cat: 'radial-gradient(#ffffff66 1.5px,transparent 2px) 0 0/34px 34px',
    bot: 'linear-gradient(#2f506322 1px,transparent 1px) 0 0/28px 28px,linear-gradient(90deg,#2f506322 1px,transparent 1px) 0 0/28px 28px'
  };
  const shell = document.querySelector('.shell');
  const helperButton = document.querySelector('#a11yToggle');
  helperButton.innerHTML = '<span aria-hidden="true">♿</span> إمكانية الوصول';
  helperButton.setAttribute('aria-label', 'إمكانية الوصول');
  const originalMascot = document.querySelector('.welcome .owl').outerHTML;
  const skipLink = document.createElement('a');
  skipLink.className = 'skip-link';
  skipLink.href = '#mainContent';
  skipLink.textContent = 'انتقل إلى المحتوى الرئيسي';
  document.body.prepend(skipLink);
  const mainContent = document.querySelector('.shell main');
  if (mainContent) {
    mainContent.id = 'mainContent';
    mainContent.tabIndex = -1;
  }
  const gate = document.createElement('main');
  gate.id = 'onboarding';
  gate.className = 'onboarding';
  document.body.insertBefore(gate, shell);
  const dashboard = document.createElement('section');
  dashboard.id = 'readingDashboard';
  dashboard.className = 'reading-dashboard';
  document.querySelector('.welcome').insertAdjacentElement('afterend', dashboard);

  const styles = document.createElement('style');
  styles.textContent = `
    [hidden]{display:none!important}
    .onboarding{min-height:100vh;display:grid;place-items:center;padding:22px;background:var(--paper);color:var(--ink)}
    .gate-panel{width:min(520px,100%);padding:28px;background:var(--surface);border:1px solid var(--line);border-radius:20px;box-shadow:0 18px 50px #102c291c}
    .gate-brand{display:flex;align-items:center;gap:12px;margin-bottom:22px;color:var(--green);font-size:19px;font-weight:800}
    .gate-brand span{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:var(--mint);font-size:26px}
    .gate-panel h1{margin:0 0 8px;font-size:25px;line-height:1.5}.gate-panel p{margin:6px 0 16px;color:var(--muted);line-height:1.8}
    .gate-panel label{display:block;margin:12px 0 5px;font-weight:700}.gate-panel input{width:100%;height:50px;padding:8px 12px;border:2px solid var(--green);border-radius:11px;background:var(--surface);color:var(--ink);font:inherit}
    .gate-actions{display:grid;gap:9px;margin-top:16px}.gate-error{min-height:24px;color:#b3261e;font-weight:700}.gate-panel .button{width:100%;min-height:50px}
    .skin-choices{display:grid;gap:9px;margin:14px 0}.skin-choice{display:flex;align-items:center;gap:10px;min-height:56px;padding:8px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font:inherit;text-align:right}.skin-choice[aria-pressed=true]{box-shadow:inset 0 0 0 2px var(--green)}.skin-swatch{width:28px;height:28px;border-radius:50%;background:var(--swatch);box-shadow:inset 0 0 0 2px #ffffff80}
    .feature-settings{margin-top:10px}.feature-setting-block{padding:14px 0;border-bottom:1px solid var(--line)}.feature-setting-block:last-child{border:0}.feature-setting-block h3{margin:0 0 8px;font-size:15px}.feature-setting-row{display:flex;gap:10px}.feature-setting-row .button{flex:1}.profile-chip{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:99px;background:var(--mint);color:var(--ink);font-size:12px;font-weight:800;white-space:nowrap}.star-chip{background:#f6ebcf;color:#4a3a12}.welcome{background:var(--mint)!important}
    :root[data-mode=kids]{--paper:#fff3d1;--radius:24px;font-size:106%}:root[data-mode=kids] .button{min-height:60px}
    :root[data-a11y=on]{--paper:#000;--surface:#111;--ink:#fff;--muted:#f1f1f1;--green:#ffd23f;--green-dark:#ffd23f;--mint:#222;--line:#fff;--coral:#ffd23f;color-scheme:dark}
    :root[data-a11y=on] .button.primary{color:#000}:root[data-a11y=on] .story-tag{background:#ffd23f;color:#000}:root[data-a11y=on] .welcome{background:#111!important}
    @media(max-width:560px){.gate-panel{padding:22px 18px}.profile-chip{display:none}.feature-settings .profile-chip{display:inline-flex}}
  `;
  document.head.appendChild(styles);
  const themeStyles = document.createElement('style');
  themeStyles.textContent = `:root[data-theme=dark] .dialog-head{background:color-mix(in srgb,var(--paper) 92%,transparent)}:root[data-theme=dark] .field select,:root[data-theme=dark] .field input[type=text],:root[data-theme=dark] .field textarea,:root[data-theme=dark] .gate-panel input{background:var(--surface);color:var(--ink)}:root[data-theme=dark] .story-tag{background:#514323;color:#ffe8a2}:root[data-theme=dark] .star-chip{background:#514323;color:#ffe8a2}:root[data-theme=dark] .gate-panel{box-shadow:0 18px 50px #0005}:root[data-theme=dark] .welcome:after{border-color:#ffffff18;box-shadow:0 0 0 24px #ffffff05,0 0 0 48px #ffffff03}.theme-toggle{font-size:21px;line-height:1}`;
  themeStyles.textContent += `.reading-dashboard{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) minmax(210px,1.5fr);gap:1px;margin:-12px 0 28px;overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--line)}.dashboard-stat,.dashboard-continue{min-width:0;padding:13px 15px;background:var(--surface)}.dashboard-stat strong{display:block;font-size:20px;line-height:1.25}.dashboard-stat span,.dashboard-continue span{display:block;color:var(--muted);font-size:11px}.dashboard-continue{display:flex;align-items:center;justify-content:space-between;gap:8px}.dashboard-continue .button{min-height:38px;padding:0 11px;font-size:12px;white-space:nowrap}.favorite-toggle{width:38px;height:38px;border:1px solid var(--line);border-radius:11px;background:var(--surface);color:var(--muted);font-size:18px}.favorite-toggle[aria-pressed=true]{color:#be7b13;background:#fff4ce}.story-top{align-items:center}.reader-saved-tools{margin-top:12px;padding:10px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.reader-saved-tools summary{cursor:pointer;font-size:13px;font-weight:700}.reader-saved-tools .field{margin:10px 0}.reader-saved-tools textarea{min-height:75px}.reader-saved-tools .button{width:100%;margin-top:6px}.data-tools{display:grid;gap:9px}.data-tools input[type=file]{display:none}.data-note{margin:4px 0;color:var(--muted);font-size:11px;line-height:1.7}.data-tools .button{width:100%}@media(max-width:760px){.reading-dashboard{grid-template-columns:repeat(3,minmax(0,1fr))}.dashboard-continue{grid-column:1/-1}}@media(max-width:560px){.reading-dashboard{margin:-8px 0 22px}.dashboard-stat,.dashboard-continue{padding:10px}.dashboard-stat strong{font-size:17px}.dashboard-continue{grid-column:1/-1}}`;
  document.head.appendChild(themeStyles);
  themeStyles.textContent += '@media(max-width:560px){.topbar{gap:8px}.top-actions{gap:5px}.top-actions .button{width:42px;min-width:42px;height:42px;min-height:42px;padding:0;font-size:0}.top-actions #settingsOpen{font-size:20px}.top-actions #themeToggle{font-size:20px}.top-actions #addOpen span{font-size:23px}}';
  themeStyles.textContent += '.a11y{min-width:156px;width:auto;height:64px;padding:0 16px;border:3px solid #183b3b;border-radius:12px;background:#f2c85b;color:#102b26;font-size:18px;font-weight:800;z-index:15}.a11y span{margin-inline-end:6px}.skip-link{position:fixed;top:8px;left:8px;z-index:40;transform:translateY(-160%);padding:12px 16px;border-radius:6px;background:#000;color:#fff}.skip-link:focus{transform:translateY(0)}.feature-setting-block{display:grid;gap:10px;margin:16px 0;padding-bottom:14px;border-bottom:1px solid var(--line)}.feature-setting-block h3{margin:0;font-size:15px}.feature-setting-block label{display:grid;gap:5px;font-size:13px;font-weight:700}.feature-setting-block button,.feature-setting-block select{min-height:56px}.feature-setting-block input[type=range],.feature-setting-block select{width:100%}@media(max-width:560px){.a11y{left:11px;bottom:11px;min-width:146px}}:root[data-reduced-motion=true],:root[data-reduced-motion=true] *, :root[data-reduced-motion=true] *::before,:root[data-reduced-motion=true] *::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}';
  themeStyles.textContent += '#readingText{line-height:var(--reading-line-height,2.1)}:root[data-highlight-style=underline] #readingText .active{text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:5px}:root[data-highlight-style=outline] #readingText .active{outline:3px solid var(--green);outline-offset:3px}';

  const settingsOverlay = document.createElement('div');
  settingsOverlay.id = 'appSettingsOverlay';
  settingsOverlay.className = 'overlay';
  settingsOverlay.innerHTML = `<section class="dialog narrow" role="dialog" aria-modal="true" aria-labelledby="appSettingsTitle"><header class="dialog-head"><h2 id="appSettingsTitle">إعدادات حكمة</h2><button class="icon-button" data-close="appSettingsOverlay" aria-label="إغلاق">×</button></header><div class="dialog-body feature-settings"><div class="feature-setting-block"><h3>العمر والواجهة</h3><div class="feature-setting-row"><button class="button secondary" data-age-choice="u16">وضع الأطفال</button><button class="button secondary" data-age-choice="o16">16 سنة أو أكثر</button></div></div><div class="feature-setting-block"><h3>المساعدة وإمكانية الوصول</h3><button class="button secondary" id="settingsA11y"></button></div><div class="feature-setting-block"><h3>شخصية القلم</h3><div class="skin-choices" id="settingsSkins"></div></div><div class="feature-setting-block"><button class="button secondary" id="resetApp">إعادة ضبط التطبيق</button></div></div></section>`;
  settingsOverlay.querySelector('.feature-settings').insertAdjacentHTML('afterbegin', '<div class="feature-setting-block"><h3>المظهر</h3><div class="feature-setting-row theme-choices" role="group" aria-label="اختيار المظهر"><button class="button secondary" data-theme-choice="light">☼ فاتح</button><button class="button secondary" data-theme-choice="dark">☾ داكن</button></div></div>');
  settingsOverlay.querySelector('#settingsA11y').closest('.feature-setting-block').insertAdjacentHTML('afterend', '<div class="feature-setting-block" id="accessibilityOptions"><h3>خيارات إمكانية الوصول</h3><label for="a11yTextScale">حجم النص <output id="a11yTextScaleValue">100%</output></label><input id="a11yTextScale" type="range" min="100" max="200" step="10"><label for="a11yLineSpacing">تباعد الأسطر</label><select id="a11yLineSpacing"><option value="1.6">مضغوط</option><option value="2">مريح</option><option value="2.4">واسع</option></select><label><input id="a11yHighContrast" type="checkbox"> تباين عالٍ</label><label><input id="a11yDyslexiaFont" type="checkbox"> خط ميسّر للقراءة</label><label><input id="a11yReducedMotion" type="checkbox"> تقليل الحركة</label><label><input id="a11yVoiceGuidance" type="checkbox"> إرشاد صوتي</label><label for="a11yAnnouncementRate">سرعة الإعلانات الصوتية <output id="a11yAnnouncementRateValue">1x</output></label><input id="a11yAnnouncementRate" type="range" min="0.5" max="2" step="0.05"><label><input id="a11ySimpleMode" type="checkbox"> الوضع المبسّط</label><label><input id="a11yHaptics" type="checkbox"> اهتزاز عند التفاعل</label><label for="a11yHighlightStyle">نمط تمييز الجملة</label><select id="a11yHighlightStyle"><option value="yellow">أصفر</option><option value="underline">تسطير</option><option value="outline">إطار</option></select></div>');
  document.body.appendChild(settingsOverlay);
  const backupBlock = document.createElement('div');
  backupBlock.className = 'feature-setting-block data-tools';
  backupBlock.innerHTML = '<h3>نسخة احتياطية</h3><button class="button secondary" id="exportLibrary" type="button">تصدير المكتبة والإعدادات</button><label class="button secondary" for="importLibrary">استيراد نسخة احتياطية</label><input id="importLibrary" type="file" accept="application/json,.json"><p class="data-note">النسخة تشمل القصص والملاحظات والإعدادات. التسجيلات الصوتية تبقى على هذا الجهاز ولا تُصدّر.</p><p class="status" id="backupStatus" role="status"></p>';
  settingsOverlay.querySelector('#resetApp').closest('.feature-setting-block').before(backupBlock);
  const voiceSourceField = document.createElement('div');
  voiceSourceField.className = 'field';
  voiceSourceField.innerHTML = '<label for="voiceSource">مصدر الصوت</label><select id="voiceSource"><option value="device">صوت الجهاز (جودة أقل)</option><option value="azure">Azure طبيعي</option></select><p class="voice-note">تُعاد الأصوات البشرية بموافقة المتحدثين فقط.</p>';
  document.querySelector('#settingsOverlay .dialog-body').prepend(voiceSourceField);
  const clearSpeechCacheButton = document.createElement('button');
  clearSpeechCacheButton.className = 'button secondary';
  clearSpeechCacheButton.id = 'clearSpeechCache';
  clearSpeechCacheButton.type = 'button';
  clearSpeechCacheButton.textContent = 'مسح الصوت المحفوظ على هذا الجهاز';
  document.querySelector('#settingsOverlay .dialog-body').append(clearSpeechCacheButton);
  clearSpeechCacheButton.addEventListener('click', async () => {
    try {
      const database = await db();
      await new Promise((resolve, reject) => {
        const transaction = database.transaction('speechCache', 'readwrite');
        transaction.objectStore('speechCache').clear();
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      cloudCache.clear();
      $('#voiceStatus').textContent = 'تم مسح الصوت المحفوظ على هذا الجهاز.';
    } catch {
      $('#voiceStatus').textContent = 'تعذر مسح الصوت المحفوظ.';
    }
  });

  function say(text, language = 'ar-EG') {
    if (!('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = SPEECH_SETTINGS.clampRate(settings.announcementRate);
    utterance.pitch = Math.pow(2, SPEECH_SETTINGS.clampPitch(settings.pitch) / 12);
    const voices = speechSynthesis.getVoices();
    const preferred = language.startsWith('en') ? settings.enVoice : settings.arVoice;
    const voice = voices.find(item => item.name === preferred) || voices.find(item => item.lang.toLowerCase().startsWith(language.slice(0, 2)));
    if (voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
  }

  function playChime() {
    try {
      const notes = {hikma: [523, 659, 784], cat: [392, 587, 880], bot: [220, 330, 220]}[settings.skin];
      const context = new (window.AudioContext || window.webkitAudioContext)();
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = settings.skin === 'bot' ? 'square' : 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.value = 0.07;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(context.currentTime + index * 0.13);
        oscillator.stop(context.currentTime + index * 0.13 + 0.11);
      });
    } catch {}
  }

  function updateProfile() {
    const actions = document.querySelector('.top-actions');
    let chip = document.querySelector('#profileChip');
    if (!chip) {
      chip = document.createElement('span');
      chip.id = 'profileChip';
      chip.className = 'profile-chip';
      actions.appendChild(chip);
    }
    chip.classList.toggle('star-chip', settings.age === 'u16');
    chip.textContent = settings.age === 'u16' ? `⭐ ${settings.stars} نجوم` : `${skins[settings.skin].icon} ${skins[settings.skin].name}`;
    if (!document.querySelector('#settingsOpen')) {
      const button = document.createElement('button');
      button.id = 'settingsOpen';
      button.className = 'button secondary';
      button.type = 'button';
      button.textContent = '⚙ الإعدادات';
        button.setAttribute('aria-label', 'إعدادات حكمة');
        button.title = 'إعدادات حكمة';
      button.addEventListener('click', openAppSettings);
      actions.insertBefore(button, actions.firstChild);
    }
    const addButton = document.querySelector('#addOpen');
    if (addButton) {
      addButton.setAttribute('aria-label', 'إضافة قصة جديدة');
      addButton.title = 'إضافة قصة جديدة';
    }
    let themeButton = document.querySelector('#themeToggle');
    if (!themeButton) {
      themeButton = document.createElement('button');
      themeButton.id = 'themeToggle';
      themeButton.className = 'icon-button theme-toggle';
      themeButton.type = 'button';
      themeButton.addEventListener('click', () => setTheme(settings.theme === 'dark' ? 'light' : 'dark'));
      actions.insertBefore(themeButton, document.querySelector('#settingsOpen').nextSibling);
    }
    themeButton.textContent = settings.theme === 'dark' ? '☼' : '☾';
    themeButton.title = settings.theme === 'dark' ? 'التبديل إلى المظهر الفاتح' : 'التبديل إلى المظهر الداكن';
    themeButton.setAttribute('aria-label', themeButton.title);
  }

  function renderDashboard() {
    const activity = state.activity;
    const favoriteCount = state.stories.filter(item => item.favorite).length;
    const completed = Number(activity.completed || 0);
    const days = new Set(activity.days || []);
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    const latest = (activity.recent || []).map(id => state.stories.find(item => item.id === id)).find(Boolean);
    dashboard.innerHTML = `<div class="dashboard-stat"><strong>${completed}</strong><span>قصص مكتملة</span></div><div class="dashboard-stat"><strong>${streak}</strong><span>أيام متتالية</span></div><div class="dashboard-stat"><strong>${favoriteCount}</strong><span>قصص مفضلة</span></div><div class="dashboard-continue"><span>${latest ? `آخر قراءة: ${esc(latest.title)}` : 'ابدأ أول حكاية لك'}</span>${latest ? `<button class="button secondary" data-open="${esc(latest.id)}">متابعة القراءة</button>` : '<span>اختر حكاية من مكتبتك</span>'}</div>`;
  }

  function markReadingDay() {
    const days = new Set(state.activity.days || []);
    days.add(new Date().toISOString().slice(0, 10));
    state.activity.days = [...days].sort().slice(-90);
  }

  function recordStoryOpened(id) {
    if (!state.stories.some(item => item.id === id)) return;
    state.activity.opened = Number(state.activity.opened || 0) + 1;
    state.activity.recent = [id, ...(state.activity.recent || []).filter(previous => previous !== id)].slice(0, 10);
    state.activity.lastOpened = new Date().toISOString();
    markReadingDay();
    save();
    renderDashboard();
  }

  function enhanceLibrary() {
    const library = document.querySelector('#library');
    const filter = document.querySelector('#filter');
    if (!filter.querySelector('[value="favorites"]')) filter.add(new Option('المفضلة', 'favorites'));
    const favoriteFilter = filter.value === 'favorites';
    const cards = [...library.querySelectorAll('.story-card')];
    for (const card of cards) {
      const openButton = card.querySelector('[data-open]');
      const item = state.stories.find(candidate => candidate.id === openButton?.dataset.open);
      if (!item) continue;
      let button = card.querySelector('[data-favorite]');
      if (!button) {
        button = document.createElement('button');
        button.className = 'favorite-toggle';
        button.type = 'button';
        button.dataset.favorite = item.id;
        card.querySelector('.story-top').insertBefore(button, card.querySelector('.story-tag'));
      }
      button.textContent = item.favorite ? '★' : '☆';
      button.setAttribute('aria-pressed', String(item.favorite));
      button.setAttribute('aria-label', item.favorite ? `إزالة ${item.title} من المفضلة` : `إضافة ${item.title} للمفضلة`);
      button.title = button.getAttribute('aria-label');
      card.hidden = favoriteFilter && !item.favorite;
    }
    let empty = library.querySelector('#favoriteEmpty');
    const visibleCards = cards.filter(card => !card.hidden).length;
    if (favoriteFilter && visibleCards === 0) {
      if (!empty) {
        empty = document.createElement('div');
        empty.id = 'favoriteEmpty';
        empty.className = 'empty';
        empty.innerHTML = '<strong>قائمة المفضلة فارغة</strong>اضغط على النجمة في أي قصة لإضافتها هنا.';
        library.appendChild(empty);
      }
      empty.hidden = false;
    } else if (empty) {
      empty.remove();
    }
    if (favoriteFilter) $('#libraryCount').textContent = `${visibleCards} قصة مفضلة`;
  }

  const baseRenderLibrary = window.renderLibrary;
  window.renderLibrary = function renderEnhancedLibrary() {
    const filter = document.querySelector('#filter');
    const favoritesOnly = filter.value === 'favorites';
    if (favoritesOnly) filter.value = 'all';
    baseRenderLibrary();
    if (favoritesOnly) filter.value = 'favorites';
    enhanceLibrary();
    renderDashboard();
  };
  document.querySelector('#filter').addEventListener('change', () => window.renderLibrary());
  document.addEventListener('click', event => {
    const favorite = event.target.closest('[data-favorite]');
    if (favorite) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const item = state.stories.find(candidate => candidate.id === favorite.dataset.favorite);
      if (!item) return;
      item.favorite = !item.favorite;
      save();
      window.renderLibrary();
      return;
    }
    const open = event.target.closest('[data-open]');
    if (open && open.closest('#library, .dashboard-continue')) recordStoryOpened(open.dataset.open);
  }, true);

      function applySkin() {
    const skin = skins[settings.skin] || skins.hikma;
    const palette = palettes[settings.skin]?.[settings.theme] || palettes.hikma.light;
    const root = document.documentElement;
    root.dataset.mode = settings.age === 'u16' ? 'kids' : 'standard';
    root.dataset.a11y = settings.a11y ? 'on' : 'off';
    root.dataset.theme = settings.theme;
    const paper = settings.age === 'u16' && settings.theme === 'light' ? '#fff3d1' : palette.paper;
    for (const [name, value] of Object.entries({'--green': palette.green, '--green-dark': palette.dark, '--mint': palette.mint, '--paper': paper, '--surface': palette.surface, '--ink': palette.ink, '--muted': palette.muted, '--line': palette.line})) root.style.setProperty(name, value);
    const systemContrast = window.matchMedia?.('(prefers-contrast: more)').matches;
    const highContrast = settings.highContrast ?? systemContrast;
    if (settings.a11y || highContrast) {
      for (const [name, value] of Object.entries({'--paper': '#000', '--surface': '#111', '--ink': '#fff', '--muted': '#f1f1f1', '--green': '#ffd23f', '--green-dark': '#ffd23f', '--mint': '#222', '--line': '#fff'})) root.style.setProperty(name, value);
      root.style.colorScheme = 'dark';
    } else {
      root.style.colorScheme = settings.theme;
    }
    root.style.fontSize = `${Math.max(100, Math.min(200, Number(settings.textScale || (settings.a11y ? 150 : 100))))}%`;
    root.style.setProperty('--reading-line-height', String(settings.lineSpacing || 2.1));
    root.style.fontFamily = settings.dyslexiaFont ? 'OpenDyslexic, Verdana, sans-serif' : '';
    root.dataset.reducedMotion = String(settings.reducedMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    root.dataset.simpleMode = String(!!settings.simpleMode);
    root.dataset.highlightStyle = settings.highlightStyle || 'yellow';
    document.body.style.background = settings.a11y ? 'var(--paper)' : patterns[settings.skin] ? `${patterns[settings.skin]},var(--paper)` : 'var(--paper)';
    const mascot = document.querySelector('.welcome .owl');
    if (mascot) mascot.outerHTML = settings.skin === 'hikma' ? originalMascot : settings.skin === 'cat' ? catArt : botArt;
    const welcome = document.querySelector('.welcome h1');
    if (welcome) welcome.textContent = settings.age === 'u16' ? `أهلاً يا بطل! ${skin.icon}` : 'كل قصة، عالم جديد.';
    const subtitle = document.querySelector('.brand-sub');
    if (subtitle) subtitle.textContent = skin.name;
    helperButton.hidden = false;
    helperButton.setAttribute('aria-pressed', String(!!settings.a11y));
    helperButton.setAttribute('aria-label', settings.a11y ? 'إيقاف وضع المساعدة' : 'تشغيل وضع المساعدة');
    updateProfile();
  }

  function renderSettings() {
    settingsOverlay.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(settings.theme === button.dataset.themeChoice));
      button.classList.toggle('primary', settings.theme === button.dataset.themeChoice);
    });
    settingsOverlay.querySelectorAll('[data-age-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(settings.age === button.dataset.ageChoice));
      button.classList.toggle('primary', settings.age === button.dataset.ageChoice);
    });
    $('#settingsSkins').innerHTML = Object.entries(skins).map(([key, skin]) => `<button class="skin-choice" type="button" data-skin="${key}" aria-pressed="${settings.skin === key}"><span class="skin-swatch" style="--swatch:${skin.green}"></span><span>${skin.icon} ${skin.name}</span></button>`).join('');
    $('#settingsA11y').textContent = settings.a11y ? 'المساعدة مفعّلة، اضغط للإيقاف' : 'المساعدة متوقفة، اضغط للتفعيل';
    $('#settingsA11y').setAttribute('aria-pressed', String(!!settings.a11y));
    $('#a11yTextScale').value = Math.max(100, Math.min(200, Number(settings.textScale || 100)));
    $('#a11yTextScaleValue').value = `${$('#a11yTextScale').value}%`;
    $('#a11yLineSpacing').value = String(settings.lineSpacing || 2.1);
    $('#a11yHighContrast').checked = !!settings.highContrast;
    $('#a11yDyslexiaFont').checked = !!settings.dyslexiaFont;
    $('#a11yReducedMotion').checked = !!settings.reducedMotion;
    $('#a11yVoiceGuidance').checked = settings.voiceGuidance !== false;
    $('#a11yAnnouncementRate').value = SPEECH_SETTINGS.clampRate(settings.announcementRate);
    $('#a11yAnnouncementRateValue').value = `${settings.announcementRate || 1}x`;
    $('#a11ySimpleMode').checked = !!settings.simpleMode;
    $('#a11yHaptics').checked = !!settings.haptics;
    $('#a11yHighlightStyle').value = settings.highlightStyle || 'yellow';
  }

  function openAppSettings() {
    renderSettings();
    openModal('appSettingsOverlay');
  }

  function setTheme(theme) {
    settings.theme = theme === 'dark' ? 'dark' : 'light';
    save();
    applySkin();
    renderSettings();
  }

  function downloadBackup() {
    const backup = {
      format: 'hikma-reading-library',
      version: 1,
      exportedAt: new Date().toISOString(),
      stories: state.stories.map(({audio, ...item}) => ({...item})),
      settings: {...settings},
      activity: state.activity
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = `hikma-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('#backupStatus').textContent = 'تم تنزيل نسخة المكتبة والإعدادات.';
  }

  async function importBackup(file) {
    const status = $('#backupStatus');
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      status.textContent = 'حجم النسخة أكبر من 8 ميجابايت.';
      return;
    }
    try {
      const backup = JSON.parse(await file.text());
      if (backup.format !== 'hikma-reading-library' || backup.version !== 1 || !Array.isArray(backup.stories) || backup.stories.length > 300) throw new Error('ملف النسخة الاحتياطية غير صالح.');
      const imported = backup.stories.map((item, index) => {
        const title = typeof item.title === 'string' ? item.title.trim().slice(0, 120) : '';
        const text = typeof item.text === 'string' ? item.text.trim() : '';
        if (!title || !text || text.length > 20000 || !['ar', 'en'].includes(item.lang)) throw new Error(`بيانات القصة رقم ${index + 1} غير صالحة.`);
        const id = typeof item.id === 'string' && /^[\w-]{1,100}$/.test(item.id) ? item.id : `story-import-${Date.now()}-${index}`;
        const bookmarkIndex = Number.isInteger(item.bookmark?.index) && item.bookmark.index >= 0 ? item.bookmark.index : null;
        return {
          id,
          title,
          text,
          lang: item.lang,
          translation: typeof item.translation === 'string' ? item.translation.slice(0, 20000) : '',
          icon: typeof item.icon === 'string' ? item.icon.slice(0, 8) : '📖',
          progress: Number.isInteger(item.progress) ? Math.max(0, Math.min(item.progress, 5000)) : 0,
          favorite: !!item.favorite,
          note: typeof item.note === 'string' ? item.note.slice(0, 2000) : '',
          bookmark: bookmarkIndex === null ? null : {index: bookmarkIndex, lang: item.bookmark.lang === 'en' ? 'en' : 'ar'},
          audio: false
        };
      });
      if (!confirm('سيتم استبدال قصصك الشخصية بالنسخة المستوردة. القصص المدمجة ستبقى. هل تريد المتابعة؟')) return;
      const importedBuiltins = new Map(imported.filter(item => item.id.startsWith('seed-')).map(item => [item.id, item]));
      const builtins = state.stories.filter(item => item.id.startsWith('seed-')).map(item => {
        const importedItem = importedBuiltins.get(item.id);
        return importedItem ? {...item, progress: importedItem.progress, favorite: importedItem.favorite, note: importedItem.note, bookmark: importedItem.bookmark} : item;
      });
      const custom = imported.filter(item => !item.id.startsWith('seed-'));
      state.stories = [...builtins, ...custom];
      if (backup.settings && typeof backup.settings === 'object') {
        const restored = backup.settings;
        Object.assign(settings, {
          activated: true,
          age: ['u16', 'o16'].includes(restored.age) ? restored.age : settings.age,
          a11y: typeof restored.a11y === 'boolean' ? restored.a11y : settings.a11y,
          skin: Object.hasOwn(skins, restored.skin) ? restored.skin : settings.skin,
          theme: restored.theme === 'dark' ? 'dark' : 'light',
          stars: Number.isInteger(restored.stars) ? Math.max(0, restored.stars) : settings.stars,
          rate: SPEECH_SETTINGS.clampRate(restored.rate),
          pitch: Number.isFinite(restored.pitch) ? (backup.settings.schemaVersion === 1 ? SPEECH_SETTINGS.clampPitch(restored.pitch) : SPEECH_SETTINGS.clampPitch(12 * Math.log2(Math.max(.01, restored.pitch)))) : settings.pitch,
          arVoice: typeof restored.arVoice === 'string' ? restored.arVoice.slice(0, 200) : settings.arVoice,
          enVoice: typeof restored.enVoice === 'string' ? restored.enVoice.slice(0, 200) : settings.enVoice
        });
      }
      if (backup.activity && typeof backup.activity === 'object') {
        state.activity = {
          completed: Number.isInteger(backup.activity.completed) ? Math.max(0, backup.activity.completed) : 0,
          opened: Number.isInteger(backup.activity.opened) ? Math.max(0, backup.activity.opened) : 0,
          recent: Array.isArray(backup.activity.recent) ? backup.activity.recent.filter(id => state.stories.some(item => item.id === id)).slice(0, 10) : [],
          days: Array.isArray(backup.activity.days) ? backup.activity.days.filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day)).slice(-90) : []
        };
      }
      save();
      applySkin();
      renderSettings();
      window.renderLibrary();
      status.textContent = `تم استيراد ${custom.length} قصة شخصية. التسجيلات الصوتية لا تنتقل بين الأجهزة.`;
    } catch (error) {
      status.textContent = error.message || 'تعذر قراءة ملف النسخة الاحتياطية.';
    } finally {
      document.querySelector('#importLibrary').value = '';
    }
  }

  function renderGate() {
    const step = !settings.activated ? 'activate' : !settings.age ? 'age' : settings.a11y === null ? 'access' : null;
    const ready = !step;
    gate.hidden = ready;
    shell.hidden = !ready;
    helperButton.hidden = false;
    if (ready) {
      applySkin();
      return;
    }
    const heading = step === 'activate' ? 'أهلاً بيك في حكمة' : step === 'age' ? 'هل عمرك 16 سنة أو أكثر؟' : 'تحب نفعّل وضع المساعدة؟';
    let content;
    if (step === 'activate') {
      content = `<p>اكتب كود القلم الموجود على العلبة لتفعيل التطبيق.</p><label for="penCode">كود القلم</label><input id="penCode" dir="ltr" autocomplete="off" autocapitalize="characters" placeholder="HK-XXXX-XXXX-XXXX"><div class="gate-actions"><button class="button secondary" type="button" data-gate-qr>مسح رمز QR</button></div><video id="activationCamera" playsinline hidden style="width:100%;max-height:240px"></video><p class="gate-error" id="gateError" role="alert"></p><div class="gate-actions"><button class="button primary" data-gate="verify">تفعيل القلم</button><button class="button secondary" data-gate="demo">استخدم الكود التجريبي</button></div><p class="voice-note">للتجربة اكتب HK-DEMO-0001. التحقق من الأكواد الحقيقية يحتاج خادمًا.</p>`;
    } else if (step === 'age') {
      content = `<p>نضبط شكل القراءة والمكافآت على حسب العمر.</p><div class="gate-actions"><button class="button primary" data-age="u16">أقل من 16 سنة</button><button class="button secondary" data-age="o16">16 سنة أو أكثر</button></div>`;
    } else {
      content = `<p>خط أكبر وتباين أوضح وقراءة صوتية لعناصر التطبيق.</p><div class="gate-actions"><button class="button primary" data-a11y="on"><span aria-hidden="true">♿</span> أحتاج مساعدة</button><button class="button secondary" data-a11y="off"><span aria-hidden="true">▶</span> ابدأ بشكل عادي</button></div>`;
    }
    gate.innerHTML = `<section class="gate-panel"><div class="gate-brand"><span>${skins[settings.skin]?.icon || '🦉'}</span>حِكمة</div><h1>${heading}</h1>${content}</section>`;
  }

  gate.addEventListener('click', async event => {
    const action = event.target.closest('[data-gate]');
    const qrAction = event.target.closest('[data-gate-qr]');
    const ageChoice = event.target.closest('[data-age]');
    const accessChoice = event.target.closest('[data-a11y]');
    if (qrAction) {
      if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
        $('#gateError').textContent = 'مسح QR غير مدعوم في هذا المتصفح. أدخل كود التفعيل يدويًا.';
        return;
      }
      let stream;
      try {
        const detector = new BarcodeDetector({formats: ['qr_code']});
        stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
        const video = $('#activationCamera');
        video.srcObject = stream;
        video.hidden = false;
        await video.play();
        const scan = async () => {
          const results = await detector.detect(video);
          if (results.length) {
            $('#penCode').value = results[0].rawValue.trim().toUpperCase();
            video.pause();
            video.srcObject = null;
            video.hidden = true;
            stream.getTracks().forEach(track => track.stop());
            gate.querySelector('[data-gate="verify"]').click();
            return;
          }
          if (!video.hidden) requestAnimationFrame(scan);
        };
        scan();
      } catch {
        stream?.getTracks().forEach(track => track.stop());
        $('#gateError').textContent = 'تعذر فتح الكاميرا أو قراءة الرمز. أدخل كود التفعيل يدويًا.';
      }
      return;
    }
    if (action) {
      const code = $('#penCode').value.trim().toUpperCase();
      const value = action.dataset.gate === 'demo' ? 'HK-DEMO-0001' : code;
      const button = action;
      button.disabled = true;
      try {
        const response = await fetch('/api/activate', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({code: value})});
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.activated !== true) throw new Error(result.message || 'تعذر تفعيل هذا الكود.');
        settings.activated = true;
        settings.activationDemo = !!result.demo;
        save();
        renderGate();
      } catch (error) {
        $('#gateError').textContent = error instanceof TypeError
          ? 'تعذر الاتصال بخادم التفعيل. شغّل npm start وافتح التطبيق من http://127.0.0.1:4173 ثم أعد المحاولة.'
          : error.message || 'تعذر تفعيل هذا الكود. تحقق من الكود وحاول مرة أخرى.';
        button.disabled = false;
      }
    } else if (ageChoice) {
      settings.age = ageChoice.dataset.age;
      save();
      renderGate();
    } else if (accessChoice) {
      settings.a11y = accessChoice.dataset.a11y === 'on';
      save();
      renderGate();
      if (settings.a11y) say('تم تفعيل وضع المساعدة.');
    }
  });
  gate.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.id === 'penCode') gate.querySelector('[data-gate="verify"]').click();
  });

  settingsOverlay.addEventListener('click', event => {
    if (event.target.closest('#exportLibrary')) {
      downloadBackup();
      return;
    }
    const themeButton = event.target.closest('[data-theme-choice]');
    const skinButton = event.target.closest('[data-skin]');
    const ageButton = event.target.closest('[data-age-choice]');
    if (themeButton) {
      setTheme(themeButton.dataset.themeChoice);
    } else if (skinButton) {
      settings.skin = skinButton.dataset.skin;
      save();
      applySkin();
      renderSettings();
      playChime();
    } else if (ageButton) {
      settings.age = ageButton.dataset.ageChoice;
      save();
      applySkin();
      renderSettings();
    } else if (event.target.closest('#settingsA11y')) {
      settings.a11y = !settings.a11y;
      save();
      applySkin();
      renderSettings();
    } else if (event.target.closest('#resetApp')) {
      if (!confirm('إعادة ضبط التطبيق وحذف القصص والإعدادات المحفوظة؟')) return;
      speechSynthesis?.cancel();
      state.stories = SEED.map(item => ({...item, progress: 0}));
      Object.assign(settings, {activated: false, age: null, a11y: null, skin: 'hikma', theme: 'light', stars: 0, arVoice: '', enVoice: '', ...SPEECH_SETTINGS.defaults});
      try { localStorage.removeItem(KEY); } catch {}
      save();
      closeModal('appSettingsOverlay');
      renderLibrary();
      renderGate();
    }
  });
  document.querySelector('#importLibrary').addEventListener('change', event => importBackup(event.target.files?.[0]));

  let activeAudio = null;
  let activeAudioUrl = null;
  let audioTimes = [];
  let pendingAudioLine = null;
  let completionHandled = false;
  window.hikmaReader = {
    get story() { return story; },
    get lines() { return lines; },
    get index() { return lineIndex; },
    setIndex(index) {
      lineIndex = Math.max(0, Math.min(lines.length - 1, index));
      renderLines();
      if (story) {
        story.progressByLang = story.progressByLang || {};
        story.progressByLang[lang] = lineIndex;
        story.progress = lineIndex;
        save();
      }
    },
    stop() { stopSpeech(); stopAudio(); },
    playBlob(blob) { return playRecordedStory(blob); }
  };
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (activeAudio?.paused) activeAudio.play().catch(() => {});
        else if (settings.voiceSource === 'device') window.startSpeech();
        else speakNaturally();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (activeAudio && !activeAudio.paused) activeAudio.pause();
        else if (speaking) window.toggleSpeech();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
      navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
    } catch {}
  }

  function stopAudio() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.src = '';
      activeAudio = null;
    }
    if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
    audioTimes = [];
    pendingAudioLine = null;
  }

  async function playRecordedStory(blobOverride = null) {
    if (!story) return;
    stopSpeech();
    stopAudio();
    const blob = blobOverride || await getAudio(story.id).catch(() => null);
    if (!blob) {
      toast('التسجيل غير متاح على هذا الجهاز');
      return;
    }
    if (lineIndex >= lines.length - 1) window.hikmaReader.setIndex(0);
    activeAudioUrl = URL.createObjectURL(blob);
    const audio = new Audio(activeAudioUrl);
    activeAudio = audio;
    audio.playbackRate = SPEECH_SETTINGS.clampRate(state.settings.rate);
    audio.preservesPitch = true;
    audio.webkitPreservesPitch = true;
    audio.addEventListener('loadedmetadata', () => {
      if (activeAudio !== audio) return;
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        const weights = lines.map(sentence => sentence.length + 8);
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        let elapsed = 0;
        audioTimes = weights.map(weight => {
          const start = audio.duration * elapsed / total;
          elapsed += weight;
          return start;
        });
        audio.currentTime = audioTimes[lineIndex] || 0;
      }
      audio.play().catch(() => {
        if (activeAudio === audio) {
          stopAudio();
          toast('تعذر تشغيل التسجيل');
        }
      });
    }, {once: true});
    audio.ontimeupdate = () => {
      if (activeAudio !== audio || !audioTimes.length) return;
      if (pendingAudioLine !== null) {
        const target = pendingAudioLine;
        pendingAudioLine = null;
        window.hikmaReader.setIndex(target);
        return;
      }
      let index = 0;
      while (index + 1 < audioTimes.length && audioTimes[index + 1] <= audio.currentTime) index++;
      if (index !== lineIndex) window.hikmaReader.setIndex(index);
    };
    audio.onplay = () => {
      $('#playIcon').textContent = 'Ⅱ';
      $('#playPause').setAttribute('aria-label', 'إيقاف مؤقت');
      $('#readerMessage').textContent = 'يُشغّل التسجيل الصوتي.';
    };
    audio.onpause = () => {
      if (activeAudio !== audio || audio.ended) return;
      if (audioTimes.length) audio.currentTime = audioTimes[lineIndex] || 0;
      $('#playIcon').textContent = '▶';
      $('#playPause').setAttribute('aria-label', 'متابعة التسجيل');
      $('#readerMessage').textContent = 'توقفت القراءة عند بداية الجملة الحالية.';
    };
    audio.onended = () => {
      if (activeAudio !== audio) return;
      story.progress = 0;
      save();
      $('#readerMessage').textContent = 'أحسنت! وصلت لنهاية القصة.';
      $('#playIcon').textContent = '↻';
      $('#playPause').setAttribute('aria-label', 'إعادة التسجيل');
      activeAudio = null;
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null;
    };
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('#recordPlay, #playPause, [data-step], #readingText [data-line], [data-close="readerOverlay"]');
    if (!target) return;
    if (target.matches('[data-close="readerOverlay"]')) {
      stopAudio();
      return;
    }
    if (target.id === 'recordPlay') {
      event.preventDefault();
      event.stopImmediatePropagation();
      playRecordedStory();
      return;
    }
    if (!activeAudio) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (target.id === 'playPause') {
      if (activeAudio.paused) activeAudio.play().catch(() => toast('تعذر استئناف التسجيل'));
      else activeAudio.pause();
      return;
    }
    const wasPlaying = !activeAudio.paused;
    const requested = target.matches('[data-step]') ? lineIndex + Number(target.dataset.step) : Number(target.dataset.line);
    if (audioTimes.length) {
      pendingAudioLine = Math.max(0, Math.min(lines.length - 1, requested));
      activeAudio.currentTime = audioTimes[pendingAudioLine] || 0;
    }
    window.hikmaReader.setIndex(requested);
    if (wasPlaying) activeAudio.play().catch(() => toast('تعذر تشغيل التسجيل'));
  }, true);

  document.addEventListener('input', event => {
    if (['readerRate', 'globalRate'].includes(event.target.id) && activeAudio) activeAudio.playbackRate = SPEECH_SETTINGS.clampRate(event.target.value);
  });
  document.addEventListener('change', event => {
    if (!['readerPitch', 'globalPitch'].includes(event.target.id)) return;
    if (settings.voiceSource === 'device' && speaking) {
      stopSpeech();
      window.startSpeech();
    } else if (settings.voiceSource !== 'device' && activeAudio && !activeAudio.paused) {
      stopAudio();
      speakNaturally();
    }
  });

  document.addEventListener('keydown', event => {
    if (!document.querySelector('#readerOverlay.open') || event.target.matches('input,textarea,select,[contenteditable=true]')) return;
    if (event.code === 'Space') {
      event.preventDefault();
      document.querySelector('#playPause')?.click();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      document.querySelector('[data-step="1"]')?.click();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      document.querySelector('[data-step="-1"]')?.click();
    }
  });

  new MutationObserver(() => {
    const message = document.querySelector('#readerMessage');
    if (!message || !message.textContent.includes('وصلت لنهاية القصة')) {
      completionHandled = false;
      return;
    }
    if (completionHandled) return;
    completionHandled = true;
    state.activity.completed = Number(state.activity.completed || 0) + 1;
    markReadingDay();
    if (story) {
      state.activity.recent = [story.id, ...(state.activity.recent || []).filter(id => id !== story.id)].slice(0, 10);
    }
    save();
    renderDashboard();
    if (settings.age === 'u16') {
      settings.stars++;
      save();
      updateProfile();
      message.textContent = '🎉 برافو! كسبت نجمة ⭐';
    } else {
      message.textContent = 'خلصت القراءة ✅';
    }
  }).observe(document.querySelector('#readerContent'), {childList: true, characterData: true, subtree: true});

  document.addEventListener('click', event => {
    if (event.target.closest('#a11yToggle')) requestAnimationFrame(() => {
      settings.a11y = !!settings.a11y;
      save();
      applySkin();
    });
  });
  document.addEventListener('focusin', event => {
    if ((!settings.a11y && settings.voiceGuidance === false) || !event.target.matches('button,input,textarea,select,a')) return;
    if (document.querySelector('#readerOverlay.open') && speaking) return;
    if (activeAudio && !activeAudio.paused) return;
    const text = event.target.getAttribute('aria-label') || event.target.textContent || event.target.placeholder || '';
    say(text.replace(/\s+/g, ' ').trim());
  });
  document.addEventListener('pointerdown', announceFirstTouch, {once: true});
  document.addEventListener('keydown', announceFirstTouch, {once: true});
  function announceFirstTouch() {
    if (settings.firstHint || !('speechSynthesis' in window)) return;
    settings.firstHint = true;
    save();
    say('مرحبًا، زر إمكانية الوصول في أسفل الشاشة. اضغطه لتكبير النص وتشغيل المساعدة الصوتية.');
  }

  settingsOverlay.addEventListener('input', event => {
    const fields = {
      a11yTextScale: ['textScale', value => Number(value)],
      a11yAnnouncementRate: ['announcementRate', value => SPEECH_SETTINGS.clampRate(value)]
    };
    const field = fields[event.target.id];
    if (!field) return;
    settings[field[0]] = field[1](event.target.value);
    if (event.target.id === 'a11yTextScale') $('#a11yTextScaleValue').value = `${settings.textScale}%`;
    if (event.target.id === 'a11yAnnouncementRate') $('#a11yAnnouncementRateValue').value = `${settings.announcementRate}x`;
    save();
    applySkin();
  });
  settingsOverlay.addEventListener('change', event => {
    const fields = {
      a11yLineSpacing: ['lineSpacing', Number],
      a11yHighContrast: ['highContrast', Boolean],
      a11yDyslexiaFont: ['dyslexiaFont', Boolean],
      a11yReducedMotion: ['reducedMotion', Boolean],
      a11yVoiceGuidance: ['voiceGuidance', Boolean],
      a11ySimpleMode: ['simpleMode', Boolean],
      a11yHaptics: ['haptics', Boolean],
      a11yHighlightStyle: ['highlightStyle', String]
    };
    const field = fields[event.target.id];
    if (!field) return;
    settings[field[0]] = field[1](event.target.type === 'checkbox' ? event.target.checked : event.target.value);
    save();
    applySkin();
  });

  let dialogReturnFocus = null;
  settingsOverlay.addEventListener('click', event => {
    if (event.target.closest('#settingsOpen')) return;
    if (event.target.closest('[data-close="appSettingsOverlay"]')) {
      dialogReturnFocus?.focus();
      dialogReturnFocus = null;
    }
  });
  document.addEventListener('click', event => {
    if (event.target.closest('#settingsOpen')) dialogReturnFocus = event.target.closest('#settingsOpen');
  }, true);
  document.addEventListener('keydown', event => {
    const dialog = document.querySelector('.overlay.open [role="dialog"]');
    if (!dialog || event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(item => item.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const cloudCache = new Map();
  let readerSleepTimer = null;
  let cloudConfig = {translation: false, speech: false};
  let cloudServerAvailable = false;

  async function getSpeechCache(key) {
    const database = await db();
    return new Promise(resolve => {
      const request = database.transaction('speechCache').objectStore('speechCache').get(key);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => resolve(null);
    });
  }

  async function saveSpeechCache(key, blob) {
    const database = await db();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction('speechCache', 'readwrite');
      transaction.objectStore('speechCache').put({blob, createdAt: Date.now()}, key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    const entries = await new Promise(resolve => {
      const transaction = database.transaction('speechCache');
      const store = transaction.objectStore('speechCache');
      const valuesRequest = store.getAll();
      const keysRequest = store.getAllKeys();
      transaction.oncomplete = () => resolve(valuesRequest.result.map((item, index) => ({...item, key: keysRequest.result[index]})));
      valuesRequest.onerror = () => resolve([]);
      keysRequest.onerror = () => resolve([]);
    });
    let total = entries.reduce((sum, item) => sum + (item.blob?.size || 0), 0);
    const oldest = entries.sort((a, b) => a.createdAt - b.createdAt);
    while (total > 50 * 1024 * 1024 && oldest.length) {
      const item = oldest.shift();
      total -= item.blob?.size || 0;
      await new Promise(resolve => {
        const transaction = database.transaction('speechCache', 'readwrite');
        transaction.objectStore('speechCache').delete(item.key);
        transaction.oncomplete = resolve;
        transaction.onerror = resolve;
      });
    }
  }

  async function loadCloudConfig() {
    try {
      const response = await fetch('/api/config');
      if (!response.ok) throw new Error('server_unavailable');
      cloudConfig = await response.json();
      cloudServerAvailable = true;
    } catch {
      cloudServerAvailable = false;
    }
    updateCloudControls();
    loadVoiceChoices();
  }

  async function loadVoiceChoices() {
    const select = document.querySelector('#voiceSource');
    if (!select) return;
    try {
      const response = await fetch('/api/voices');
      if (!response.ok) throw new Error('voices_unavailable');
      const voices = await response.json();
      for (const voice of voices) {
        const option = new Option(`${voice.displayName} (${voice.language === 'ar' ? 'العربية' : 'English'})`, `friend:${voice.id}`);
        select.add(option);
      }
    } catch {}
    select.value = settings.voiceSource;
    const azureOption = [...select.options].find(option => option.value === 'azure');
    if (azureOption) azureOption.disabled = !cloudConfig.speech;
  }
  document.querySelector('#voiceSource').addEventListener('change', event => {
    settings.voiceSource = event.target.value;
    save();
    updateCloudControls();
  });

  async function callTranslator(text, from, to, signal) {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text, from, to}),
      signal
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || (result.error === 'translation_not_configured' ? 'أضف إعدادات Azure Translator في ملف .env ثم أعد تشغيل التطبيق.' : 'تعذرت الترجمة الآن.'));
    return result.text;
  }

  function cloudStatus(message, isError = false) {
    const status = document.querySelector('#cloudStatus');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', isError);
  }

  function updateCloudControls() {
    const translateButton = document.querySelector('#translateStory');
    const speechButton = document.querySelector('#neuralSpeech');
    const draftButton = document.querySelector('#translateDraft');
    if (translateButton) translateButton.disabled = false;
    if (draftButton) draftButton.disabled = false;
    if (speechButton) speechButton.disabled = false;
    if (speechButton) {
      speechButton.textContent = settings.voiceSource === 'device'
        ? 'قراءة بصوت الجهاز (جودة أقل)'
        : settings.voiceSource.startsWith('friend:')
          ? 'قراءة بصوت الصديق المصرّح به'
          : 'قراءة بصوت Azure الطبيعي';
    }
    if (!cloudServerAvailable) {
      cloudStatus('لتشغيل الترجمة والصوت الطبيعي، شغّل الخادم المحلي عبر npm start.');
    } else if (!cloudConfig.translation || !cloudConfig.speech) {
      const missing = [!cloudConfig.translation && 'Azure Translator', !cloudConfig.speech && 'Azure Speech'].filter(Boolean).join(' و');
      cloudStatus(`أضف إعدادات ${missing} إلى .env لتفعيل الخدمة.`);
    } else {
      cloudStatus('الترجمة والصوت الطبيعي جاهزان. لا يُرسل النص إلا عند اختيار الخدمة.');
    }
  }

  let translationController = null;
  async function translateStory(to) {
    if (!story || !['ar', 'en'].includes(to)) return;
    if (to === story.lang) {
      translationController?.abort();
      stopSpeech();
      lang = story.lang;
      lineIndex = story.progressByLang?.[lang] || 0;
      window.renderReader();
      return;
    }
    const cached = story.translations?.[to] || (story.translationLang === to ? story.translation : '');
    if (cached) {
      stopSpeech();
      lang = to;
      lineIndex = story.progressByLang?.[lang] || 0;
      window.renderReader();
      cloudStatus('الترجمة المحفوظة لهذه اللغة جاهزة.');
      return;
    }
    if (!cloudConfig.translation) {
      cloudStatus('الترجمة غير مهيأة. أضف Azure Translator إلى .env، أو افتح تحرير الترجمة اليدوي. بقي النص والصوت على اللغة الحالية.', true);
      const select = document.querySelector('#readLang');
      if (select) select.value = lang;
      return;
    }
    translationController?.abort();
    translationController = new AbortController();
    const button = document.querySelector('#translateStory');
    const cancel = document.querySelector('#cancelTranslation');
    if (button) button.disabled = true;
    if (cancel) cancel.hidden = false;
    cloudStatus('جارٍ ترجمة القصة...');
    try {
      const translated = await callTranslator(story.text, story.lang, to, translationController.signal);
      story.translations = {...story.translations, [to]: translated};
      story.translation = translated;
      story.translationLang = to;
      story.translationSources = {...story.translationSources, [to]: 'azure'};
      stopSpeech();
      lang = to;
      lineIndex = story.progressByLang?.[lang] || 0;
      save();
      window.renderReader();
      cloudStatus('ترجمة آلية محفوظة. راجعها قبل القراءة.');
    } catch (error) {
      if (error.name === 'AbortError') cloudStatus('أُلغيت الترجمة. بقي النص والصوت على اللغة الحالية.');
      else cloudStatus(error.message || 'تعذرت الترجمة. بقي النص والصوت على اللغة الحالية؛ أعد المحاولة أو حرّر الترجمة يدويًا.', true);
      const select = document.querySelector('#readLang');
      if (select) select.value = lang;
    } finally {
      translationController = null;
      if (button) button.disabled = false;
      if (cancel) cancel.hidden = true;
    }
  }
  window.hikmaSetLanguage = translateStory;

  async function speakNaturally() {
    if (!story) return;
    const selectedVoice = settings.voiceSource.startsWith('friend:') ? settings.voiceSource.slice(7) : '';
    if (settings.voiceSource === 'device') {
      window.startSpeech();
      return;
    }
    const text = lang === story.lang ? story.text : (story.translations?.[lang] || (story.translationLang === lang ? story.translation : ''));
    if (!text) {
      cloudStatus('ترجم القصة أولًا لاستخدام الصوت بهذه اللغة.', true);
      return;
    }
    const pitch = SPEECH_SETTINGS.clampPitch(state.settings.pitch);
    const cacheKey = `${story.id}:${lang}:${selectedVoice || 'azure'}:${text}:${pitch}`;
    const button = document.querySelector('#neuralSpeech');
    let providerLabel = selectedVoice ? 'يُشغّل صوت الصديق المصرّح به.' : 'يُشغّل صوت Azure الطبيعي.';
    if (button) button.disabled = true;
    cloudStatus('جارٍ إنشاء الصوت الطبيعي...');
    try {
      let blob = cloudCache.get(cacheKey) || await getSpeechCache(cacheKey);
      if (!blob) {
        if (!cloudConfig.speech && !selectedVoice) throw new Error('لا يوجد صوت محفوظ لهذه القصة دون اتصال، كما أن Azure Speech غير مهيأ.');
        const response = await fetch('/api/speech', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({text, lang, pitch, voiceId: selectedVoice})
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message || 'تعذر إنشاء الصوت الطبيعي.');
        }
        const provider = response.headers.get('X-Hikma-Voice-Provider');
        const fallback = response.headers.get('X-Hikma-Voice-Fallback') === 'true';
        providerLabel = provider === 'elevenlabs' ? 'يُشغّل صوت الصديق المصرّح به.' : 'يُشغّل صوت Azure الطبيعي.';
        if (fallback) providerLabel += ' تم استخدام Azure كبديل.';
        blob = await response.blob();
        cloudCache.set(cacheKey, blob);
        await saveSpeechCache(cacheKey, blob);
      }
      cloudStatus(providerLabel);
      await window.hikmaReader.playBlob(blob);
    } catch (error) {
      cloudStatus(error.message || 'تعذر إنشاء الصوت الطبيعي.', true);
    } finally { if (button) button.disabled = false; }
  }

  document.addEventListener('click', event => {
    if (settings.voiceSource === 'device' || !event.target.closest('#playPause, #readingText [data-line]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    speakNaturally();
  }, true);

  function enhanceReader() {
    const panel = document.querySelector('#readerContent .voice-panel');
    if (!panel) return;
    const sentenceCounter = document.querySelector('#counter');
    const readerMessage = document.querySelector('#readerMessage');
    if (sentenceCounter) sentenceCounter.setAttribute('aria-live', 'polite');
    if (readerMessage) {
      readerMessage.setAttribute('role', 'status');
      readerMessage.setAttribute('aria-live', 'polite');
    }
    const readerDialog = panel.closest('[role="dialog"]');
    if (readerDialog) {
      readerDialog.lang = lang;
      readerDialog.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
    if (!panel.querySelector('#sleepTimer')) {
      const timerField = document.createElement('div');
      timerField.className = 'field';
      timerField.innerHTML = '<label for="sleepTimer">مؤقت النوم</label><select id="sleepTimer"><option value="0">إيقاف المؤقت</option><option value="5">5 دقائق</option><option value="15">15 دقيقة</option><option value="30">30 دقيقة</option><option value="60">60 دقيقة</option></select>';
      panel.prepend(timerField);
      timerField.querySelector('#sleepTimer').addEventListener('change', event => {
        clearTimeout(readerSleepTimer);
        const minutes = Number(event.target.value);
        if (!minutes) return;
        readerSleepTimer = setTimeout(() => {
          window.hikmaReader.stop();
          const message = document.querySelector('#readerMessage');
          if (message) message.textContent = 'انتهى مؤقت النوم. تم حفظ موضع القراءة.';
          event.target.value = '0';
        }, minutes * 60 * 1000);
      });
    }
    let languageSelect = panel.querySelector('#readLang');
    if (!languageSelect) {
      const field = document.createElement('div');
      field.className = 'field';
      field.innerHTML = '<label for="readLang">لغة القراءة</label><select id="readLang"></select>';
      panel.insertBefore(field, panel.querySelector('.field'));
      languageSelect = field.querySelector('select');
    }
    languageSelect.innerHTML = `<option value="original">${story.lang === 'ar' ? 'الأصل' : 'Original'}</option><option value="ar">العربية</option><option value="en">English</option>`;
    languageSelect.value = lang === story.lang ? 'original' : lang;
    if (languageSelect.dataset.cloudBound !== 'true') {
      languageSelect.dataset.cloudBound = 'true';
      languageSelect.addEventListener('change', event => {
        event.stopImmediatePropagation();
        translateStory(event.target.value === 'original' ? story.lang : event.target.value);
      }, true);
    }
    if (!panel.querySelector('#cloudVoiceTools')) {
      const tools = document.createElement('div');
      tools.id = 'cloudVoiceTools';
      tools.className = 'cloud-voice-tools';
      tools.innerHTML = '<button class="button secondary" id="translateStory" type="button">إعادة المحاولة أو الترجمة</button><button class="button secondary" id="cancelTranslation" type="button" hidden>إلغاء الترجمة</button><button class="button primary" id="neuralSpeech" type="button">صوت Azure الطبيعي</button><details id="translationEditor"><summary>تحرير الترجمة يدويًا</summary><div class="field"><label for="translationText">النص المترجم</label><textarea id="translationText" maxlength="20000"></textarea></div><button class="button secondary" id="saveTranslation" type="button">حفظ الترجمة</button></details><label class="voice-note"><input id="showOriginal" type="checkbox"> إظهار النص الأصلي</label><p class="voice-note" id="translationBadge" hidden>ترجمة آلية بالذكاء الاصطناعي</p><p class="voice-note" id="cloudStatus" role="status" aria-live="polite"></p>';
      panel.insertBefore(tools, panel.querySelector('#recordOpen'));
      tools.querySelector('#translateStory').addEventListener('click', () => translateStory(lang === story.lang ? (story.lang === 'ar' ? 'en' : 'ar') : lang));
      tools.querySelector('#cancelTranslation').addEventListener('click', () => translationController?.abort());
      tools.querySelector('#neuralSpeech').addEventListener('click', speakNaturally);
      tools.querySelector('#saveTranslation').addEventListener('click', () => {
        const target = lang === story.lang ? (story.lang === 'ar' ? 'en' : 'ar') : lang;
        const text = tools.querySelector('#translationText').value.trim();
        if (!text) return cloudStatus('اكتب الترجمة قبل حفظها.', true);
        story.translations = {...story.translations, [target]: text};
        story.translation = text;
        story.translationLang = target;
        story.translationSources = {...story.translationSources, [target]: 'manual'};
        save();
        cloudStatus('تم حفظ الترجمة يدويًا.');
      });
      tools.querySelector('#showOriginal').addEventListener('change', event => {
        if (event.target.checked) {
          story.returnToLanguage = lang === story.lang ? (story.lang === 'ar' ? 'en' : 'ar') : lang;
          translateStory(story.lang);
        } else if (story.returnToLanguage && story.translations?.[story.returnToLanguage]) {
          translateStory(story.returnToLanguage);
        }
      });
    }
    panel.querySelector('#translationText').value = story.translations?.[lang] || story.translation || '';
    panel.querySelector('#translationBadge').hidden = !(lang !== story.lang && story.translationSources?.[lang] === 'azure');
    updateCloudControls();
    if (!panel.querySelector('#readerSavedTools')) {
      const savedTools = document.createElement('details');
      savedTools.id = 'readerSavedTools';
      savedTools.className = 'reader-saved-tools';
      savedTools.innerHTML = '<summary>علامة وملحوظة للقصة</summary><p class="data-note">اختصارات: المسافة تشغيل/إيقاف، والأسهم للتنقل بين الجمل.</p><button class="button secondary" id="bookmarkSave" type="button">حفظ موضعي الحالي</button><button class="button secondary" id="bookmarkGo" type="button">الانتقال للعلامة المحفوظة</button><div class="field"><label for="storyNote">ملاحظتي</label><textarea id="storyNote" maxlength="2000" placeholder="اكتب ملاحظة لهذه القصة..."></textarea></div><button class="button secondary" id="storyNoteSave" type="button">حفظ الملاحظة</button><p class="status" id="savedReaderStatus" role="status"></p>';
      panel.insertBefore(savedTools, panel.querySelector('#recordOpen'));
      savedTools.querySelector('#bookmarkSave').addEventListener('click', () => {
        story.bookmark = {index: window.hikmaReader.index, lang};
        save();
        savedTools.querySelector('#savedReaderStatus').textContent = `تم حفظ العلامة عند الجملة ${story.bookmark.index + 1}.`;
      });
      savedTools.querySelector('#bookmarkGo').addEventListener('click', () => {
        if (!story.bookmark) return;
        if (story.bookmark.lang !== lang) {
          lang = story.bookmark.lang;
          window.renderReader();
        }
        window.hikmaReader.setIndex(story.bookmark.index);
        document.querySelector('#readerSavedTools #savedReaderStatus').textContent = 'انتقلت إلى العلامة المحفوظة.';
      });
      savedTools.querySelector('#storyNote').value = story.note || '';
      savedTools.querySelector('#storyNoteSave').addEventListener('click', () => {
        story.note = savedTools.querySelector('#storyNote').value.trim();
        save();
        savedTools.querySelector('#savedReaderStatus').textContent = story.note ? 'تم حفظ ملاحظتك على هذا الجهاز.' : 'تم حذف الملاحظة.';
      });
    }
  }

  const readerObserver = new MutationObserver(enhanceReader);
  readerObserver.observe(document.querySelector('#readerContent'), {childList: true});

  function addDraftTranslationControl() {
    const storyForm = document.querySelector('#storyForm');
    if (storyForm && !storyForm.querySelector('#isbnInput')) {
      const bookField = document.createElement('div');
      bookField.className = 'field';
      bookField.innerHTML = '<label for="isbnInput">بحث برقم ISBN</label><input id="isbnInput" inputmode="numeric" autocomplete="off" placeholder="978..." maxlength="17"><div class="feature-setting-row"><button class="button secondary" id="lookupIsbn" type="button">البحث عن الكتاب</button><button class="button secondary" id="scanIsbn" type="button">مسح ISBN بالكاميرا</button></div><button class="button secondary" id="ocrPage" type="button">استخراج نص صفحة من صورة</button><input id="ocrImage" type="file" accept="image/*" capture="environment" hidden><video id="isbnCamera" playsinline hidden style="width:100%;max-height:240px"></video><p class="status" id="bookImportStatus" role="status" aria-live="polite"></p>';
      storyForm.prepend(bookField);
      const bookStatus = bookField.querySelector('#bookImportStatus');
      bookField.querySelector('#lookupIsbn').addEventListener('click', async () => {
        try {
          const isbn = bookField.querySelector('#isbnInput').value.trim();
          const response = await fetch(`/api/isbn?isbn=${encodeURIComponent(isbn)}`);
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.message || 'تعذر البحث عن الكتاب.');
          document.querySelector('#storyTitle').value = result.title;
          bookStatus.textContent = 'تم العثور على بيانات العنوان. امسح صفحة أو أدخل نص القصة يدويًا قبل الحفظ.';
        } catch (error) { bookStatus.textContent = error.message || 'تعذر البحث عن الكتاب.'; }
      });
      bookField.querySelector('#scanIsbn').addEventListener('click', async () => {
        if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
          bookStatus.textContent = 'مسح ISBN بالكاميرا غير مدعوم في هذا المتصفح؛ أدخل الرقم يدويًا.';
          return;
        }
        let stream;
        try {
          const detector = new BarcodeDetector({formats: ['ean_13', 'ean_8']});
          stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}});
          const video = bookField.querySelector('#isbnCamera');
          video.srcObject = stream;
          video.hidden = false;
          await video.play();
          const scan = async () => {
            const codes = await detector.detect(video);
            if (codes.length) {
              bookField.querySelector('#isbnInput').value = codes[0].rawValue;
              bookStatus.textContent = 'تم مسح الرمز. اضغط البحث عن الكتاب للتحقق من رقم ISBN.';
              video.pause();
              video.srcObject = null;
              video.hidden = true;
              stream.getTracks().forEach(track => track.stop());
              return;
            }
            if (!video.hidden) requestAnimationFrame(scan);
          };
          scan();
        } catch {
          stream?.getTracks().forEach(track => track.stop());
          bookStatus.textContent = 'تعذر تشغيل الكاميرا أو قراءة الرمز. يمكنك إدخال ISBN يدويًا.';
        }
      });
      bookField.querySelector('#ocrPage').addEventListener('click', () => {
        if (!('TextDetector' in window)) {
          bookStatus.textContent = 'استخراج النص غير مدعوم في هذا المتصفح. أضف النص يدويًا أو استخدم متصفحًا يوفر TextDetector.';
          return;
        }
        bookField.querySelector('#ocrImage').click();
      });
      bookField.querySelector('#ocrImage').addEventListener('change', async event => {
        const image = event.target.files?.[0];
        if (!image) return;
        try {
          const detector = new TextDetector();
          const bitmap = await createImageBitmap(image);
          const results = await detector.detect(bitmap);
          bitmap.close();
          const text = results.map(result => result.rawValue).filter(Boolean).join('\n');
          if (!text.trim()) throw new Error('لم يُعثر على نص واضح في الصورة.');
          document.querySelector('#storyText').value = [document.querySelector('#storyText').value, text].filter(Boolean).join('\n\n');
          bookStatus.textContent = 'تم استخراج النص. راجعه وصحح الأخطاء قبل الحفظ.';
        } catch (error) { bookStatus.textContent = error.message || 'تعذر استخراج النص من الصورة.'; }
        finally { event.target.value = ''; }
      });
    }
    if (storyForm && !storyForm.querySelector('#storyUrl')) {
      const importField = document.createElement('div');
      importField.className = 'field';
      importField.innerHTML = '<label for="storyUrl">استيراد قصة من رابط</label><input id="storyUrl" type="url" inputmode="url" maxlength="2048" placeholder="https://example.com/story"><button class="button secondary" id="previewUrlImport" type="button">جلب معاينة القصة</button><p class="status" id="urlImportStatus" role="status" aria-live="polite"></p>';
      storyForm.prepend(importField);
      importField.querySelector('#previewUrlImport').addEventListener('click', async event => {
        const button = event.currentTarget;
        const url = importField.querySelector('#storyUrl').value.trim();
        if (!url) {
          importField.querySelector('#urlImportStatus').textContent = 'أدخل رابطًا عامًا أولًا.';
          return;
        }
        button.disabled = true;
        importField.querySelector('#urlImportStatus').textContent = 'جارٍ استخراج نص قابل للقراءة...';
        try {
          const response = await fetch('/api/import-url', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({url})});
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.message || 'تعذر استيراد هذه الصفحة.');
          document.querySelector('#storyTitle').value = result.title;
          document.querySelector('#storyText').value = result.text;
          importField.querySelector('#urlImportStatus').textContent = `معاينة من ${result.sourceUrl}. راجع النص والعنوان ثم احفظ القصة.`;
        } catch (error) {
          importField.querySelector('#urlImportStatus').textContent = `${error.message || 'تعذر الاستيراد.'} لا يتوفر ملخص LLM حتى يُضبط مزوده.`;
        } finally {
          button.disabled = false;
        }
      });
    }
    const field = document.querySelector('#storyTranslation')?.closest('.field');
    if (!field || field.querySelector('#translateDraft')) return;
    const button = document.createElement('button');
    button.id = 'translateDraft';
    button.className = 'button secondary';
    button.type = 'button';
    button.textContent = 'ترجم النص تلقائيًا';
    field.appendChild(button);
    button.addEventListener('click', async () => {
      const text = document.querySelector('#storyText').value.trim();
      if (!text) {
        document.querySelector('#formStatus').textContent = 'اكتب النص أولًا ثم اطلب ترجمته.';
        return;
      }
      if (!cloudConfig.translation) {
        document.querySelector('#formStatus').textContent = 'أضف إعدادات Azure Translator في .env ثم أعد تشغيل التطبيق.';
        return;
      }
      const from = /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
      button.disabled = true;
      document.querySelector('#formStatus').textContent = 'جارٍ ترجمة النص...';
      try {
        document.querySelector('#storyTranslation').value = await callTranslator(text, from, from === 'ar' ? 'en' : 'ar');
        document.querySelector('#formStatus').textContent = 'اكتملت الترجمة. راجعها قبل الحفظ.';
      } catch (error) {
        document.querySelector('#formStatus').textContent = error.message || 'تعذرت الترجمة الآن.';
      } finally {
        button.disabled = !cloudConfig.translation;
      }
    });
    updateCloudControls();
  }

  document.querySelector('#storyForm').addEventListener('reset', () => setTimeout(addDraftTranslationControl));
  addDraftTranslationControl();
  const cloudStyles = document.createElement('style');
  cloudStyles.textContent = '.cloud-voice-tools{display:grid;gap:8px;margin:12px 0}.cloud-voice-tools .button{width:100%}.cloud-voice-tools .voice-note{margin:0}.cloud-voice-tools .button:disabled{cursor:not-allowed;opacity:.55}';
  document.head.appendChild(cloudStyles);
  loadCloudConfig();
  renderGate();
  window.renderLibrary();
  renderDashboard();
})();
