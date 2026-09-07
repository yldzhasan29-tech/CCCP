/* ============ Чаты с автоматическим переводом ============ */
(function (PP) {
  'use strict';
  window.PP.views = window.PP.views || {};
  var U = PP.util, h = U.h, icon = U.icon, ui = PP.ui, S = PP.store;

  PP.views.chats = function (root, params) {
    var t = PP.i18n.t, lang = PP.i18n.get();
    var me = S.currentUser();

    if (!me) {
      root.appendChild(h('div', { class: 'wrap section' },
        h('div', { class: 'card card--pad' },
          ui.empty('chat', t('ch_none'), t('r_login'),
            h('a', { class: 'btn btn--primary', href: '#/auth', text: t('nav_login') })))));
      return;
    }

    var threads = S.threadsFor(me.id);
    var activeId = params.tid || (threads[0] && threads[0].id) || null;
    var active = threads.filter(function (x) { return x.id === activeId; })[0] || null;

    var listEl = h('aside', { class: 'chatlist' });
    var paneEl = h('section', { class: 'chatpane' });
    var layout = h('div', { class: 'wrap chatlayout' + (params.tid ? ' has-active' : '') }, [listEl, paneEl]);
    root.appendChild(layout);

    /* ---------- список переписок ---------- */
    U.clear(listEl);
    listEl.appendChild(h('div', { class: 'chatlist__head' }, [
      h('strong', { text: t('ch_title') }),
      ui.badge(String(threads.length), 'outline')
    ]));
    if (!threads.length) {
      listEl.appendChild(h('div', { style: { padding: '10px' } },
        ui.empty('chat', t('ch_none'), t('ch_none_hint'),
          h('a', { class: 'btn btn--soft btn--sm', href: '#/search', text: t('nav_find') }))));
    }
    threads.forEach(function (th) {
      var last = th.last;
      var preview = last ? (last.senderId === me.id ? '↩ ' : '') + last.text : (th.ride.note || '');
      var unread = S.isUnread(me.id, th) && th.id !== activeId;
      listEl.appendChild(h('a', {
        class: 'chatlist__item' + (th.id === activeId ? ' is-active' : '') + (unread ? ' is-unread' : ''),
        href: '#/chats/' + encodeURIComponent(th.id)
      }, [
        ui.avatar(th.other, 'sm'),
        h('div', { class: 'stack gap-1 grow', style: { minWidth: 0 } }, [
          h('div', { class: 'row between center gap-2' }, [
            h('strong', { class: 't-sm truncate', text: th.other ? th.other.name : '—' }),
            h('span', { class: 'row gap-2 center nowrap' }, [
              unread ? h('span', { class: 'unread-dot' }) : null,
              h('span', { class: 'muted t-2xs', text: last ? U.hhmm(last.createdAt) : '' })
            ])
          ]),
          h('span', { class: 'muted t-xs truncate', text: preview, dir: 'auto' }),
          h('span', { class: 'row gap-1 center muted t-2xs' }, [
            h('span', { html: icon('route', 12), style: { display: 'flex' } }),
            h('span', { class: 'truncate', text: PP.places.labelById(th.ride.fromId, lang) + ' → ' + PP.places.labelById(th.ride.toId, lang) })
          ]),
          h('span', { class: 'row gap-1 center muted t-2xs' }, [
            h('span', { html: icon('clock', 12), style: { display: 'flex' } }),
            h('span', { text: PP.i18n.dayLabel(th.ride.departAt) + ' · ' + U.hhmm(th.ride.departAt) }),
            th.ride.status === 'completed' ? PP.ui.badge(t('r_completed'), 'outline') : null
          ])
        ])
      ]));
    });

    /* ---------- панель разговора ---------- */
    if (!active) {
      U.clear(paneEl);
      paneEl.appendChild(ui.empty('chat', t('ch_select'), t('ch_none_hint')));
      return;
    }

    var other = active.other;
    S.markRead(me.id, active.id);
    var myLang = me.lang || lang;
    var otherLang = other ? (other.lang || 'ru') : 'ru';
    var settings = S.getSettings();
    var autoTranslate = settings.autoTranslate !== false;

    var msgsEl = h('div', { class: 'msgs' });
    var input = h('textarea', { class: 'chatinput', rows: 1, placeholder: t('ch_ph') });
    var sendBtn = h('button', { class: 'btn btn--grad btn--icon', html: icon('send', 18), 'aria-label': t('c_send') });

    var autoSwitch = h('label', { class: 'switch' }, [
      h('input', { type: 'checkbox', checked: autoTranslate ? true : null }),
      h('span', { class: 'switch__track' }),
      h('span', { class: 't-xs strong', text: t('ch_auto') })
    ]);
    autoSwitch.querySelector('input').addEventListener('change', function () {
      autoTranslate = this.checked;
      S.setSettings({ autoTranslate: autoTranslate });
      paint();
    });

    U.clear(paneEl);
    paneEl.appendChild(h('div', { class: 'chatpane__head' }, [
      h('a', { class: 'btn btn--ghost btn--icon btn--sm mob-only', href: '#/chats', html: icon('arrowLeft', 18) }),
      ui.avatar(other, 'sm'),
      h('div', { class: 'stack gap-0 grow', style: { minWidth: 0 } }, [
        h('a', { class: 'strong t-sm truncate', href: '#/profile/' + (other ? other.id : ''), text: other ? other.name : '—' }),
        h('span', { class: 'muted t-2xs truncate', text: t('ch_lang_of', { lang: PP.i18n.nameOf(otherLang) }) })
      ]),
      h('a', {
        class: 'btn btn--xs btn--soft desk-only', href: '#/ride/' + active.rideId
      }, [h('span', { html: icon('car', 14), style: { display: 'flex' } }), h('span', { text: t('r_title') })]),
      autoSwitch
    ]));
    paneEl.appendChild(msgsEl);

    var quick = h('div', { class: 'quickbar' }, ['ch_q1', 'ch_q2', 'ch_q3', 'ch_q4'].map(function (k) {
      return h('button', {
        class: 'chip', onclick: function () { input.value = t(k); input.focus(); autoGrow(); }
      }, t(k));
    }));

    paneEl.appendChild(h('div', { class: 'composer' }, [
      quick,
      h('div', { class: 'composer__row' }, [input, sendBtn])
    ]));

    function autoGrow() {
      input.style.height = 'auto';
      input.style.height = Math.min(120, input.scrollHeight) + 'px';
    }
    input.addEventListener('input', autoGrow);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    sendBtn.addEventListener('click', send);

    /* ---------- рендер сообщений ---------- */
    function paint() {
      var msgs = S.where('messages', function (m) { return m.threadId === active.id; })
        .sort(function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
      U.clear(msgsEl);

      if (!msgs.length) {
        msgsEl.appendChild(h('div', { class: 'msgs__empty' },
          ui.empty('translate', t('ch_ai_on'), t('ch_none_hint'))));
      }

      msgs.forEach(function (m) {
        var mine = m.senderId === me.id;
        var targetLang = mine ? otherLang : myLang;
        var bubble = h('div', { class: 'bubble ' + (mine ? 'bubble--out' : 'bubble--in') }, [
          h('div', { text: m.text, dir: 'auto' })
        ]);

        if (autoTranslate && targetLang !== m.srcLang) {
          var cached = m.tr && m.tr[targetLang];
          var trEl = h('div', { class: 'bubble__tr', dir: 'auto' }, cached ? [
            h('span', { text: cached })
          ] : [h('span', { class: 'row gap-2 center' }, [h('span', { class: 'spinner' }), h('span', { text: t('ch_translating') })])]);
          bubble.appendChild(trEl);
          if (!cached) {
            PP.ai.translate(m.text, m.srcLang, targetLang).then(function (res) {
              U.clear(trEl);
              if (res.text) {
                var row = S.find('messages', m.id);
                if (row) {
                  row.tr = row.tr || {}; row.tr[targetLang] = res.text;
                  S.update('messages', m.id, { tr: row.tr, engine: res.engine });
                }
                trEl.appendChild(h('span', { text: res.text }));
              } else {
                trEl.appendChild(h('span', { class: 'muted', text: '— ' + t('ch_offline') + ' —' }));
              }
            });
          }
        }

        bubble.appendChild(h('div', { class: 'bubble__meta' }, [
          h('span', { text: U.hhmm(m.createdAt) }),
          h('span', { text: '·' }),
          h('span', { text: PP.i18n.meta(m.srcLang).flag + ' ' + t('ch_original') }),
          m.engine === 'ai' ? h('span', { text: '· ' + t('ai_ai') }) :
            (m.engine === 'offline' ? h('span', { text: '· ' + t('ai_offline') }) : null)
        ]));

        msgsEl.appendChild(h('div', { class: 'msgrow' + (mine ? ' msgrow--out' : '') }, [
          mine ? null : ui.avatar(other, 'xs'),
          bubble
        ]));
      });
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }

    function send() {
      var text = input.value.trim();
      if (!text) return;
      input.value = ''; autoGrow();
      var msg = S.insert('messages', {
        id: U.uid('m'), threadId: active.id, rideId: active.rideId,
        senderId: me.id, srcLang: myLang, text: text, tr: {}, engine: 'pending'
      });
      paint();
      PP.ai.translate(text, myLang, otherLang).then(function (res) {
        var row = S.find('messages', msg.id);
        if (!row) return;
        row.tr = row.tr || {};
        if (res.text) row.tr[otherLang] = res.text;
        S.update('messages', msg.id, { tr: row.tr, engine: res.engine === 'none' ? 'offline' : res.engine });
        paint();
      });
    }

    paint();
    setTimeout(function () { msgsEl.scrollTop = msgsEl.scrollHeight; }, 60);
  };
})(window.PP);
