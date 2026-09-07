/* ==========================================================
   i18n — 8 locales, instant switch, RTL aware
   ========================================================== */
(function (PP) {
  'use strict';
  var ORDER = ['ru', 'tr', 'en', 'zh', 'es', 'es-419', 'pt', 'ar'];
  var KEY = 'pp.lang';
  var current = 'ru';
  var listeners = [];

  function available() {
    return ORDER.filter(function (c) { return !!PP.L[c]; }).map(function (c) {
      return { code: c, name: PP.L[c]._meta.name, flag: PP.L[c]._meta.flag, dir: PP.L[c]._meta.dir };
    });
  }
  function meta(code) { return (PP.L[code || current] || PP.L.ru)._meta; }
  function dirOf(code) { return meta(code).dir; }
  function nameOf(code) { return meta(code).name; }

  /* Русский — язык по умолчанию (жюри УрФУ). Сохранённый выбор пользователя
     всегда важнее; определение по браузеру доступно через detect(true). */
  function detect(useBrowser) {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved && PP.L[saved]) return saved;
    if (!useBrowser) return 'ru';
    var nav = (navigator.languages || [navigator.language || 'ru']).map(String);
    for (var i = 0; i < nav.length; i++) {
      var l = nav[i].toLowerCase();
      if (PP.L[l]) return l;
      if (/^es-(mx|ar|co|cl|pe|ve|ec|bo|uy|py|cr|gt|hn|ni|pa|sv|do|cu|pr)/.test(l)) return 'es-419';
      var base = l.split('-')[0];
      if (base === 'zh') return 'zh';
      if (PP.L[base]) return base;
    }
    return 'ru';
  }

  function t(key, vars) {
    var dict = PP.L[current] || PP.L.ru;
    var s = dict[key];
    if (s === undefined) s = (PP.L.ru[key] !== undefined ? PP.L.ru[key] : key);
    if (vars) {
      s = String(s).replace(/\{(\w+)\}/g, function (m, k) {
        return vars[k] !== undefined ? vars[k] : m;
      });
    }
    return s;
  }

  function set(code, silent) {
    if (!PP.L[code]) code = 'ru';
    current = code;
    try { localStorage.setItem(KEY, code); } catch (e) {}
    var d = dirOf(code);
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('dir', d);
    document.documentElement.classList.toggle('is-rtl', d === 'rtl');
    if (!silent) listeners.forEach(function (fn) { try { fn(code); } catch (e) {} });
  }
  function get() { return current; }
  function onChange(fn) { listeners.push(fn); }

  /* Relative day label: today / tomorrow / dd.mm */
  function dayLabel(date) {
    var off = PP.util.dayOffset(date);
    if (off === 0) return t('c_today');
    if (off === 1) return t('c_tomorrow');
    var d = PP.util.toDate(date);
    return PP.util.pad2(d.getDate()) + '.' + PP.util.pad2(d.getMonth() + 1);
  }
  function dateLabel(date) {
    var d = PP.util.toDate(date);
    try {
      return d.toLocaleDateString(current === 'es-419' ? 'es' : current,
        { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return PP.util.pad2(d.getDate()) + '.' + PP.util.pad2(d.getMonth() + 1) + '.' + d.getFullYear();
    }
  }

  PP.i18n = {
    t: t, set: set, get: get, onChange: onChange, detect: detect,
    available: available, dirOf: dirOf, nameOf: nameOf, meta: meta, ORDER: ORDER,
    dayLabel: dayLabel, dateLabel: dateLabel
  };
})(window.PP);
