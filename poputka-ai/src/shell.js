/* ==========================================================
   Оболочка приложения: шапка, навигация, роутер
   ========================================================== */
(function (PP) {
  'use strict';
  var U = PP.util, h = U.h, icon = U.icon;

  var ROUTES = [
    { re: /^\/?$/,                 view: 'home' },
    { re: /^\/auth$/,              view: 'auth' },
    { re: /^\/search$/,            view: 'search' },
    { re: /^\/publish$/,           view: 'publish' },
    { re: /^\/ride\/([\w:.-]+)$/,  view: 'ride',    keys: ['id'] },
    { re: /^\/chats$/,             view: 'chats' },
    { re: /^\/chats\/(.+)$/,       view: 'chats',   keys: ['tid'] },
    { re: /^\/trips$/,             view: 'trips' },
    { re: /^\/profile\/([\w-]+)$/, view: 'profile', keys: ['id'] },
    { re: /^\/settings$/,          view: 'settings' }
  ];

  function parseHash() {
    var raw = location.hash.replace(/^#/, '') || '/';
    var qi = raw.indexOf('?');
    var path = qi >= 0 ? raw.slice(0, qi) : raw;
    var query = {};
    if (qi >= 0) {
      raw.slice(qi + 1).split('&').forEach(function (kv) {
        if (!kv) return;
        var p = kv.split('=');
        query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
    }
    for (var i = 0; i < ROUTES.length; i++) {
      var m = path.match(ROUTES[i].re);
      if (m) {
        var params = { query: query, path: path };
        (ROUTES[i].keys || []).forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); });
        return { view: ROUTES[i].view, params: params };
      }
    }
    return { view: 'home', params: { query: {}, path: '/' } };
  }

  /* ---------- dropdown helper ---------- */
  function dropdown(triggerEl, buildPanel) {
    var dd = h('div', { class: 'dd' });
    var panel = h('div', { class: 'dd__panel' });
    dd.appendChild(triggerEl); dd.appendChild(panel);
    function close() { dd.classList.remove('is-open'); document.removeEventListener('mousedown', outside); }
    function outside(e) { if (!dd.contains(e.target)) close(); }
    triggerEl.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dd.classList.toggle('is-open');
      if (open) {
        U.clear(panel); buildPanel(panel, close);
        setTimeout(function () { document.addEventListener('mousedown', outside); }, 0);
      } else close();
    });
    return dd;
  }

  /* ---------- language picker ---------- */
  function langPicker() {
    var m = PP.i18n.meta(PP.i18n.get());
    var trigger = h('button', { class: 'btn btn--ghost btn--sm', title: PP.i18n.t('lang_pick') }, [
      h('span', { text: m.flag, style: { fontSize: '15px' } }),
      h('span', { text: m.name, class: 'lang-name' }),
      h('span', { html: icon('chevronDown', 15), style: { display: 'flex', opacity: '.6' } })
    ]);
    return dropdown(trigger, function (panel, close) {
      panel.appendChild(h('div', { class: 'dd__title', text: PP.i18n.t('lang_pick') }));
      PP.i18n.available().forEach(function (l) {
        panel.appendChild(h('button', {
          class: 'dd__item' + (l.code === PP.i18n.get() ? ' is-active' : ''),
          onclick: function () { close(); PP.i18n.set(l.code); }
        }, [
          h('span', { class: 'dd__flag', text: l.flag }),
          h('span', { text: l.name, class: 'grow' }),
          l.code === PP.i18n.get() ? h('span', { html: icon('check', 15), style: { display: 'flex' } }) : null
        ]));
      });
    });
  }

  /* ---------- user menu ---------- */
  function userMenu() {
    var t = PP.i18n.t;
    var me = PP.store.currentUser();
    if (!me) {
      return h('a', { class: 'btn btn--primary btn--sm', href: '#/auth' }, [
        h('span', { html: icon('user', 16), style: { display: 'flex' } }),
        h('span', { text: t('nav_login') })
      ]);
    }
    var trigger = h('button', { class: 'user-chip', title: me.name }, [
      PP.ui.avatar(me, 'sm'),
      h('span', { class: 'user-chip__name truncate', text: me.name.split(' ')[0] }),
      h('span', { html: icon('chevronDown', 15), style: { display: 'flex', opacity: '.55' } })
    ]);
    return dropdown(trigger, function (panel, close) {
      panel.appendChild(h('div', { class: 'dd__title', text: me.email }));
      panel.appendChild(h('a', { class: 'dd__item', href: '#/profile/' + me.id, onclick: close }, [
        h('span', { html: icon('user', 17), style: { display: 'flex' } }), t('nav_profile')
      ]));
      panel.appendChild(h('a', { class: 'dd__item', href: '#/trips', onclick: close }, [
        h('span', { html: icon('car', 17), style: { display: 'flex' } }), t('nav_trips')
      ]));
      panel.appendChild(h('a', { class: 'dd__item', href: '#/settings', onclick: close }, [
        h('span', { html: icon('settings', 17), style: { display: 'flex' } }), t('nav_settings')
      ]));
      panel.appendChild(h('div', { class: 'dd__sep' }));
      panel.appendChild(h('div', { class: 'dd__title', text: t('st_switch') }));
      PP.store.all('users').forEach(function (u) {
        if (u.id === me.id) return;
        panel.appendChild(h('button', {
          class: 'dd__item',
          onclick: function () {
            close(); PP.store.signIn(u.id);
            PP.ui.toast(PP.i18n.t('tst_in', { name: u.name }), 'ok');
          }
        }, [
          PP.ui.avatar(u, 'xs'),
          h('span', { class: 'grow truncate', text: u.name }),
          h('span', { class: 'muted t-xs', text: PP.i18n.meta(u.lang).flag })
        ]));
      });
      panel.appendChild(h('div', { class: 'dd__sep' }));
      panel.appendChild(h('button', {
        class: 'dd__item',
        onclick: function () { close(); PP.store.signOut(); PP.ui.toast(t('tst_out'), 'info'); PP.ui.go('#/'); }
      }, [h('span', { html: icon('logout', 17), style: { display: 'flex' } }), t('nav_logout')]));
    });
  }

  /* ---------- header ---------- */
  function navLinks(current, onNav) {
    var t = PP.i18n.t;
    var me = PP.store.currentUser();
    var items = [
      { href: '#/search',  label: t('nav_find'),    view: 'search',  icon: 'search' },
      { href: '#/publish', label: t('nav_publish'), view: 'publish', icon: 'plus' },
      { href: '#/chats',   label: t('nav_chats'),   view: 'chats',   icon: 'chat' },
      { href: '#/trips',   label: t('nav_trips'),   view: 'trips',   icon: 'car' }
    ];
    return items.map(function (it) {
      var badge = null;
      if (it.view === 'chats' && me) {
        var n = PP.store.unreadCount(me.id);
        if (n) badge = h('span', { class: 'nav__badge', text: String(n) });
      }
      return h('a', {
        class: 'nav__link' + (current === it.view ? ' is-active' : ''),
        href: it.href, onclick: onNav || null
      }, [
        h('span', { html: icon(it.icon, 16), style: { display: 'flex' } }),
        h('span', { text: it.label }),
        badge
      ]);
    });
  }

  function header(current) {
    var t = PP.i18n.t;
    var burger = h('button', {
      class: 'btn btn--ghost btn--icon btn--sm mob-only',
      html: icon('menu', 20),
      'aria-label': t('nav_menu')
    });
    var el = h('header', { class: 'header' }, [
      h('div', { class: 'wrap header__inner' }, [
        h('a', { class: 'brand', href: '#/' }, [
          h('div', { class: 'brand__mark', html: logoSvg(18) }),
          h('div', { class: 'stack' }, [
            h('span', { class: 'brand__name', text: t('app_name') }),
            h('span', { class: 'brand__sub', text: t('brand_sub') })
          ])
        ]),
        h('nav', { class: 'nav desk-only' }, navLinks(current)),
        h('div', { class: 'grow' }),
        h('div', { class: 'row gap-2' }, [
          h('span', { class: 'desk-only', style: { display: 'flex' } }, langPicker()),
          userMenu(),
          burger
        ])
      ])
    ]);

    var sheet = h('div', { class: 'mobnav' }, [
      h('div', { class: 'mobnav__inner stack gap-2' }, navLinks(current, function () { sheet.classList.remove('is-open'); }).concat([
        h('div', { class: 'divider', style: { margin: '8px 0' } }),
        langPicker()
      ]))
    ]);
    burger.addEventListener('click', function (e) { e.stopPropagation(); sheet.classList.toggle('is-open'); });
    document.addEventListener('click', function (e) {
      if (sheet.classList.contains('is-open') && !sheet.contains(e.target)) sheet.classList.remove('is-open');
    });
    el.appendChild(sheet);
    return el;
  }

  function logoSvg(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="6.5" cy="6.5" r="2.4"/><circle cx="17.5" cy="17.5" r="2.4"/>' +
      '<path d="M6.5 9.4v2.9a3 3 0 0 0 3 3h2.2a3 3 0 0 1 3 3v.7"/></svg>';
  }

  /* ---------- footer ---------- */
  function footer() {
    var t = PP.i18n.t;
    return h('footer', { class: 'footer' }, [
      h('div', { class: 'wrap footer__inner' }, [
        h('div', { class: 'row gap-3 center' }, [
          h('div', { class: 'brand__mark', html: logoSvg(16), style: { width: '28px', height: '28px', borderRadius: '9px' } }),
          h('div', { class: 'stack' }, [
            h('strong', { text: t('app_name'), style: { color: 'var(--ink-900)' } }),
            h('span', { class: 'muted t-xs', text: t('app_tag') })
          ])
        ]),
        h('div', { class: 'grow' }),
        h('span', { class: 'muted t-xs', text: '© OpenStreetMap contributors · UrFU ТОП ИИ 2026' })
      ])
    ]);
  }

  /* ---------- router ---------- */
  var currentCleanup = null;
  function render() {
    var app = document.getElementById('app');
    var r = parseHash();
    var view = PP.views[r.view] || PP.views.home;

    if (currentCleanup) { try { currentCleanup(); } catch (e) {} currentCleanup = null; }
    U.clear(app);
    app.appendChild(header(r.view));
    var page = h('main', { class: 'page' });
    app.appendChild(page);
    var res = view(page, r.params);
    if (typeof res === 'function') currentCleanup = res;
    if (r.view !== 'chats') app.appendChild(footer());
    if (!r.params.query.keepScroll) window.scrollTo(0, 0);
  }

  PP.shell = { render: render, parseHash: parseHash, dropdown: dropdown, logoSvg: logoSvg };
})(window.PP);
