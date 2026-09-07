/* ==========================================================
   Попутка ИИ — utilities  (window.PP namespace)
   ========================================================== */
window.PP = window.PP || {};
(function (PP) {
  'use strict';

  /* ---------- DOM ---------- */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'dataset') { for (var d in v) el.dataset[d] = v[d]; }
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    appendKids(el, children);
    return el;
  }
  function appendKids(el, kids) {
    if (kids === null || kids === undefined || kids === false) return;
    if (Array.isArray(kids)) { kids.forEach(function (c) { appendKids(el, c); }); return; }
    if (kids instanceof Node) { el.appendChild(kids); return; }
    el.appendChild(document.createTextNode(String(kids)));
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); return el; }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- ids / random ---------- */
  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---------- Geo ---------- */
  function haversine(a, b) {
    if (!a || !b) return 0;
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toRad, dLng = (b.lng - a.lng) * toRad;
    var la1 = a.lat * toRad, la2 = b.lat * toRad;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(la1) * Math.cos(la2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  /* ---------- Time ---------- */
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function toDate(v) { return v instanceof Date ? v : new Date(v); }
  function hhmm(v) { var d = toDate(v); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function isoDay(v) { var d = toDate(v); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function minutesOfDay(v) { var d = toDate(v); return d.getHours() * 60 + d.getMinutes(); }
  function sameDay(a, b) { return isoDay(a) === isoDay(b); }
  function addMinutes(v, m) { return new Date(toDate(v).getTime() + m * 60000); }
  function startOfDay(v) { var d = toDate(v); d.setHours(0, 0, 0, 0); return d; }
  function dayOffset(v) {
    var a = startOfDay(new Date()).getTime(), b = startOfDay(v).getTime();
    return Math.round((b - a) / 86400000);
  }
  function combineDayTime(dayISO, timeHHMM) {
    var p = String(timeHHMM || '08:00').split(':');
    var d = new Date(dayISO + 'T00:00:00');
    if (isNaN(d.getTime())) d = new Date();
    d.setHours(parseInt(p[0], 10) || 0, parseInt(p[1], 10) || 0, 0, 0);
    return d;
  }

  /* ---------- Strings ---------- */
  function initials(name) {
    var parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
    return parts.map(function (p) { return (p[0] || '').toUpperCase(); }).join('');
  }
  var AV_COLORS = [
    'linear-gradient(135deg,#4B37E0,#8877FF)',
    'linear-gradient(135deg,#FF7A45,#FFB020)',
    'linear-gradient(135deg,#12B886,#5AD6AE)',
    'linear-gradient(135deg,#0BA5EC,#5AC8FA)',
    'linear-gradient(135deg,#E5484D,#FF8A8E)',
    'linear-gradient(135deg,#7A3EE8,#C77DFF)',
    'linear-gradient(135deg,#0C9A72,#7BD389)',
    'linear-gradient(135deg,#3A2AB4,#00B8E6)'
  ];
  function hashCode(s) {
    var hsh = 0, str = String(s || '');
    for (var i = 0; i < str.length; i++) { hsh = (hsh << 5) - hsh + str.charCodeAt(i); hsh |= 0; }
    return Math.abs(hsh);
  }
  function avatarBg(seed) { return AV_COLORS[hashCode(seed) % AV_COLORS.length]; }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function round1(n) { return Math.round(n * 10) / 10; }

  function debounce(fn, ms) {
    var t; return function () {
      var a = arguments, c = this;
      clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 200);
    };
  }

  /* ---------- Icons (inline SVG, currentColor) ---------- */
  var I = {};
  function icon(name, size) {
    var s = size || 18;
    var body = I[name] || '';
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }
  I.search = '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.2-3.2"/>';
  I.plus = '<path d="M12 5v14M5 12h14"/>';
  I.chat = '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.7L3 21l1.9-5A8.3 8.3 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"/>';
  I.car = '<path d="M5 17h14M6.5 17v2M17.5 17v2"/><path d="M4 13l1.6-4.6A2 2 0 0 1 7.5 7h9a2 2 0 0 1 1.9 1.4L20 13v4H4z"/><circle cx="7.5" cy="14.5" r="1"/><circle cx="16.5" cy="14.5" r="1"/>';
  I.user = '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>';
  I.star = '<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" fill="currentColor" stroke="none"/>';
  I.starLine = '<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z"/>';
  I.clock = '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 1.8"/>';
  I.pin = '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>';
  I.globe = '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 3 2.6 15 0 18M12 3c-2.6 3-2.6 15 0 18"/>';
  I.sparkle = '<path d="M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9z"/><path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>';
  I.arrowRight = '<path d="M5 12h14M13 6l6 6-6 6"/>';
  I.arrowLeft = '<path d="M19 12H5M11 18l-6-6 6-6"/>';
  I.swap = '<path d="M7 4v13M7 17l-3-3M7 17l3-3"/><path d="M17 20V7M17 7l-3 3M17 7l3 3"/>';
  I.check = '<path d="M4.5 12.5l5 5 10-11"/>';
  I.checkCircle = '<circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.7 2.7L16 9.5"/>';
  I.x = '<path d="M6 6l12 12M18 6L6 18"/>';
  I.send = '<path d="M21 3L10.5 13.5"/><path d="M21 3l-6.8 18-3.7-7.5L3 10z"/>';
  I.settings = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>';
  I.shield = '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z"/><path d="M9 12.2l2.1 2.1L15.2 10"/>';
  I.users = '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.4 2.9-5.4 6.5-5.4s6.5 2 6.5 5.4"/><path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.4M18 14.9c2.2.6 3.6 2.2 3.6 4.6"/>';
  I.chevronDown = '<path d="M6 9l6 6 6-6"/>';
  I.chevronRight = '<path d="M9 6l6 6-6 6"/>';
  I.logout = '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4M6 12h10"/>';
  I.mail = '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>';
  I.translate = '<path d="M3.5 6H12M7.7 4v2M9.6 6c-.6 4-3 6.6-6.1 8M6 10.5c1 2 3 3.6 5.4 4.4"/><path d="M12.5 20l3.9-9.5L20.3 20M14 16.8h5"/>';
  I.route = '<circle cx="6" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M6 8.6v3.9a3 3 0 0 0 3 3h3.5a3 3 0 0 1 3 3v.9"/>';
  I.wallet = '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="17" cy="14.5" r="1.2" fill="currentColor" stroke="none"/>';
  I.calendar = '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>';
  I.bolt = '<path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z"/>';
  I.menu = '<path d="M4 7h16M4 12h16M4 17h16"/>';
  I.info = '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>';
  I.trash = '<path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M6.5 7l1 12.5A1.5 1.5 0 0 0 9 21h6a1.5 1.5 0 0 0 1.5-1.5L17.5 7"/>';
  I.key = '<circle cx="8" cy="15" r="4"/><path d="M10.9 12.1L20 3M17 6l2.5 2.5M14.5 8.5L17 11"/>';
  I.download = '<path d="M12 3v12M7 11l5 5 5-5M4 20h16"/>';
  I.flame = '<path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-1.6.6-3 1.5-4 .2 1.4 1 2.2 2 2.2 1.6 0 2-1.6 1.5-7.2z"/>';
  I.eye = '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>';
  I.play = '<path d="M7 4.5l12 7.5-12 7.5z" fill="currentColor" stroke="none"/>';
  I.refresh = '<path d="M20 11a8 8 0 1 0-1.1 5"/><path d="M20 4v7h-7"/>';

  PP.util = {
    h: h, $: $, $$: $$, clear: clear, esc: esc, uid: uid,
    haversine: haversine, pad2: pad2, hhmm: hhmm, isoDay: isoDay, sameDay: sameDay,
    minutesOfDay: minutesOfDay, addMinutes: addMinutes, startOfDay: startOfDay,
    dayOffset: dayOffset, combineDayTime: combineDayTime, toDate: toDate,
    initials: initials, avatarBg: avatarBg, hashCode: hashCode,
    clamp: clamp, round1: round1, debounce: debounce, icon: icon
  };
})(window.PP);
