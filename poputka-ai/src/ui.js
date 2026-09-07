/* ==========================================================
   UI kit — переиспользуемые кусочки интерфейса
   ========================================================== */
(function (PP) {
  'use strict';
  var U = PP.util, h = U.h, icon = U.icon;

  /* ---------- toast ---------- */
  function toast(msg, kind) {
    var root = document.getElementById('toasts');
    if (!root) return;
    var ic = kind === 'ok' ? 'checkCircle' : kind === 'err' ? 'info' : 'sparkle';
    var el = h('div', { class: 'toast toast--' + (kind || 'info') }, [
      h('span', { html: icon(ic, 18), style: { display: 'flex', flex: 'none' } }),
      h('span', { text: msg })
    ]);
    root.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, 3200);
  }

  /* ---------- modal ---------- */
  function modal(opts) {
    var root = document.getElementById('modal-root');
    var box = h('div', { class: 'modal' + (opts.wide ? ' modal--wide' : '') });
    var back = h('div', { class: 'modal-backdrop' }, box);
    function close() {
      if (back.parentNode) back.parentNode.removeChild(back);
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    document.addEventListener('keydown', onKey);
    root.appendChild(back);
    if (opts.render) opts.render(box, close);
    return { close: close, box: box };
  }

  function confirmDialog(title, text, okLabel, onOk) {
    var t = PP.i18n.t;
    modal({
      render: function (box, close) {
        box.appendChild(h('h3', { text: title, style: { marginBottom: '8px' } }));
        box.appendChild(h('p', { class: 'dim', text: text, style: { marginBottom: '22px' } }));
        box.appendChild(h('div', { class: 'row gap-3', style: { justifyContent: 'flex-end' } }, [
          h('button', { class: 'btn btn--ghost', text: t('c_cancel'), onclick: close }),
          h('button', {
            class: 'btn btn--primary', text: okLabel,
            onclick: function () { close(); onOk(); }
          })
        ]));
      }
    });
  }

  /* ---------- avatar ---------- */
  function avatar(user, size) {
    var cls = 'avatar' + (size ? ' avatar--' + size : '');
    return h('div', {
      class: cls,
      style: { background: U.avatarBg(user ? user.id + user.name : '?') },
      title: user ? user.name : ''
    }, U.initials(user ? user.name : '?'));
  }

  /* ---------- stars ---------- */
  function stars(value, size) {
    var full = Math.round(value || 0);
    var wrap = h('span', { class: 'stars' + (size ? ' stars--' + size : '') });
    for (var i = 1; i <= 5; i++) {
      wrap.appendChild(h('span', {
        class: i <= full ? '' : 'star-empty',
        html: icon(i <= full ? 'star' : 'starLine', size === 'lg' ? 22 : 15),
        style: { display: 'flex' }
      }));
    }
    return wrap;
  }

  function starInput(onPick, initial) {
    var val = initial || 0;
    var wrap = h('div', { class: 'stars stars--input' });
    function paint() {
      Array.prototype.forEach.call(wrap.children, function (c, i) {
        c.className = i < val ? '' : 'star-empty';
        c.innerHTML = icon(i < val ? 'star' : 'starLine', 30);
      });
    }
    for (var i = 1; i <= 5; i++) {
      (function (n) {
        var b = h('span', { style: { display: 'flex', cursor: 'pointer' } });
        b.addEventListener('click', function () { val = n; paint(); onPick(n); });
        b.addEventListener('mouseenter', function () {
          Array.prototype.forEach.call(wrap.children, function (c, i2) {
            c.className = i2 < n ? '' : 'star-empty';
            c.innerHTML = icon(i2 < n ? 'star' : 'starLine', 30);
          });
        });
        wrap.appendChild(b);
      })(i);
    }
    wrap.addEventListener('mouseleave', paint);
    paint();
    return wrap;
  }

  /* ---------- rating ring ---------- */
  function ring(pct) {
    var r = 24, c = 2 * Math.PI * r;
    var off = c * (1 - U.clamp(pct, 0, 100) / 100);
    var el = h('div', { class: 'ring' });
    el.innerHTML =
      '<svg viewBox="0 0 56 56" width="56" height="56">' +
      '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#4B37E0"/><stop offset="55%" stop-color="#6B57F6"/>' +
      '<stop offset="100%" stop-color="#00B8E6"/></linearGradient></defs>' +
      '<circle class="ring__track" cx="28" cy="28" r="' + r + '" fill="none" stroke-width="5"/>' +
      '<circle class="ring__bar" cx="28" cy="28" r="' + r + '" fill="none" stroke-width="5" ' +
      'stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + c.toFixed(1) + '"/>' +
      '</svg><div class="ring__val">' + Math.round(pct) + '<span>%</span></div>';
    requestAnimationFrame(function () {
      var bar = el.querySelector('.ring__bar');
      if (bar) bar.setAttribute('stroke-dashoffset', off.toFixed(1));
    });
    return el;
  }

  /* ---------- form controls ---------- */
  function field(label, control, hint) {
    var kids = [h('label', { class: 'field__label', text: label }), control];
    if (hint) kids.push(h('span', { class: 'field__hint', text: hint }));
    return h('div', { class: 'field' }, kids);
  }

  function select(options, value, onChange, attrs) {
    var el = h('select', Object.assign({ class: 'select' }, attrs || {}));
    options.forEach(function (o) {
      el.appendChild(h('option', { value: o.value, text: o.label, selected: String(o.value) === String(value) }));
    });
    el.value = value;
    if (onChange) el.addEventListener('change', function () { onChange(el.value); });
    return el;
  }

  function placeSelect(value, onChange) {
    return select(PP.places.options(PP.i18n.get()), value, onChange);
  }

  function daySelect(value, onChange) {
    var t = PP.i18n.t;
    var opts = [0, 1, 2].map(function (n) {
      var d = new Date(); d.setDate(d.getDate() + n);
      return { value: n, label: n === 0 ? t('c_today') : n === 1 ? t('c_tomorrow') : PP.i18n.dayLabel(d) };
    });
    return select(opts, value, function (v) { onChange(+v); });
  }

  function timeInput(value, onChange) {
    var el = h('input', { class: 'input', type: 'time', value: value || '08:00', step: 300 });
    if (onChange) el.addEventListener('change', function () { onChange(el.value); });
    return el;
  }

  function empty(iconName, title, text, action) {
    return h('div', { class: 'empty' }, [
      h('div', { class: 'empty__icon', html: icon(iconName, 30) }),
      h('div', { class: 'stack gap-2', style: { alignItems: 'center' } }, [
        h('h3', { text: title }),
        text ? h('p', { class: 'dim t-sm', text: text, style: { maxWidth: '340px' } }) : null
      ]),
      action || null
    ]);
  }

  function badge(text, kind, iconName) {
    return h('span', { class: 'badge' + (kind ? ' badge--' + kind : '') }, [
      iconName ? h('span', { html: icon(iconName, 13), style: { display: 'flex' } }) : null,
      h('span', { text: text })
    ]);
  }

  function skeletonCard() {
    return h('div', { class: 'card card--pad' }, [
      h('div', { class: 'sk sk--title' }),
      h('div', { class: 'sk sk--text', style: { width: '80%' } }),
      h('div', { class: 'sk sk--text', style: { width: '60%' } })
    ]);
  }

  /* ---------- misc ---------- */
  function langBadge(code) {
    var m = PP.i18n.meta(code);
    return h('span', { class: 'badge badge--outline' }, [
      h('span', { text: m.flag, style: { fontSize: '13px' } }),
      h('span', { text: m.name })
    ]);
  }

  function priceLabel(price) {
    var t = PP.i18n.t;
    return (!price || price <= 0) ? t('c_free') : (price + ' ' + t('c_rub'));
  }

  function go(hash) { location.hash = hash; }

  PP.ui = {
    toast: toast, modal: modal, confirmDialog: confirmDialog,
    avatar: avatar, stars: stars, starInput: starInput, ring: ring,
    field: field, select: select, placeSelect: placeSelect, daySelect: daySelect,
    timeInput: timeInput, empty: empty, badge: badge, skeletonCard: skeletonCard,
    langBadge: langBadge, priceLabel: priceLabel, go: go
  };
})(window.PP);
