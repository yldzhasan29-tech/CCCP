/* ============ Вход / регистрация ============ */
(function (PP) {
  'use strict';
  window.PP.views = window.PP.views || {};
  var U = PP.util, h = U.h, icon = U.icon, ui = PP.ui;
  var EMAIL_RE = /^[a-z0-9][a-z0-9._-]*@stud\.urfu\.ru$/i;

  PP.views.auth = function (root) {
    var t = PP.i18n.t;
    var state = { name: '', email: '', lang: PP.i18n.get(), car: '' };
    var errName = null, errMail = null;

    var nameIn = h('input', { class: 'input', placeholder: t('auth_name_ph'), value: '' });
    var mailIn = h('input', { class: 'input', type: 'email', placeholder: 'ivan.ivanov@stud.urfu.ru', autocomplete: 'email' });
    var carIn = h('input', { class: 'input', placeholder: t('auth_car_ph') });
    var langSel = ui.select(PP.i18n.available().map(function (l) {
      return { value: l.code, label: l.flag + '  ' + l.name };
    }), state.lang, function (v) { state.lang = v; });

    errName = h('span', { class: 'field__error hide' });
    errMail = h('span', { class: 'field__error hide' });

    function submit(e) {
      if (e) e.preventDefault();
      var name = nameIn.value.trim();
      var mail = mailIn.value.trim();
      var okName = name.length >= 3 && name.indexOf(' ') > 0;
      var okMail = EMAIL_RE.test(mail);

      nameIn.classList.toggle('is-error', !okName);
      mailIn.classList.toggle('is-error', !okMail);
      errName.textContent = okName ? '' : t('auth_name_err');
      errName.classList.toggle('hide', okName);
      errMail.textContent = okMail ? '' : t('auth_email_err');
      errMail.classList.toggle('hide', okMail);
      if (!okName || !okMail) return;

      var existing = PP.store.where('users', function (u) {
        return u.email.toLowerCase() === mail.toLowerCase();
      })[0];
      var user;
      if (existing) {
        PP.store.update('users', existing.id, { name: name, lang: state.lang, car: carIn.value.trim() || existing.car });
        user = existing;
      } else {
        user = PP.store.insert('users', {
          id: U.uid('u'), name: name, email: mail, lang: state.lang,
          car: carIn.value.trim(), bio: '', joined: new Date().toISOString()
        });
      }
      PP.store.signIn(user.id);
      PP.i18n.set(state.lang);
      ui.toast(t('tst_in', { name: user.name }), 'ok');
      ui.go('#/search');
    }

    var form = h('form', { class: 'stack gap-5', onsubmit: submit }, [
      h('div', { class: 'field' }, [
        h('label', { class: 'field__label', text: t('auth_name') }), nameIn, errName
      ]),
      h('div', { class: 'field' }, [
        h('label', { class: 'field__label', text: t('auth_email') }),
        h('div', { class: 'input-group' }, [
          h('span', { class: 'input-group__icon', html: icon('mail', 17) }), mailIn
        ]),
        errMail,
        h('span', { class: 'field__hint', text: t('auth_email_hint') })
      ]),
      ui.field(t('auth_lang'), langSel, t('auth_lang_hint')),
      ui.field(t('auth_car') + ' · ' + t('c_optional'), carIn, t('auth_car_hint')),
      h('button', { class: 'btn btn--grad btn--lg btn--block', type: 'submit' }, [
        h('span', { text: t('auth_submit') }),
        h('span', { html: icon('arrowRight', 18), style: { display: 'flex' } })
      ])
    ]);

    var demoUsers = PP.store.all('users').slice(0, 6);
    var demo = h('div', { class: 'card card--pad stack gap-4 reveal d2' }, [
      h('div', { class: 'stack gap-1' }, [
        h('h3', { text: t('auth_demo_title') }),
        h('p', { class: 'dim t-sm', text: t('auth_demo_hint') })
      ]),
      h('div', { class: 'demo-grid' }, demoUsers.map(function (u) {
        var st = PP.store.userStats(u.id);
        return h('button', {
          class: 'demo-user',
          onclick: function () {
            PP.store.signIn(u.id);
            PP.i18n.set(u.lang);
            ui.toast(t('tst_in', { name: u.name }), 'ok');
            ui.go('#/search');
          }
        }, [
          ui.avatar(u, 'lg'),
          h('div', { class: 'stack gap-1', style: { minWidth: 0 } }, [
            h('strong', { class: 'truncate', text: u.name }),
            h('span', { class: 'muted t-xs truncate', text: PP.i18n.meta(u.lang).flag + ' ' + PP.i18n.nameOf(u.lang) }),
            h('span', { class: 'row gap-1 center t-xs muted' }, [
              ui.stars(st.avg), h('span', { text: st.count ? String(st.avg) : '—' })
            ])
          ])
        ]);
      }))
    ]);

    root.appendChild(h('div', { class: 'auth-hero' }, [
      h('div', { class: 'wrap auth-grid' }, [
        h('div', { class: 'stack gap-6 reveal' }, [
          h('div', { class: 'stack gap-3' }, [
            ui.badge(t('p_verified'), 'brand', 'shield'),
            h('h1', { text: t('auth_title') }),
            h('p', { class: 't-lead', text: t('auth_sub') })
          ]),
          h('div', { class: 'card card--pad' }, form)
        ]),
        h('div', { class: 'stack gap-5' }, [demo, sideNote()])
      ])
    ]));

    function sideNote() {
      return h('div', { class: 'card card--pad card--sunken stack gap-3 reveal d3' }, [
        h('div', { class: 'row gap-2 center' }, [
          h('span', { html: icon('shield', 18), style: { display: 'flex', color: 'var(--mint-500)' } }),
          h('strong', { text: t('home_f4t') })
        ]),
        h('p', { class: 'dim t-sm', text: t('home_f4d') }),
        h('div', { class: 'row gap-2 wrapflex' }, PP.i18n.available().map(function (l) {
          return ui.badge(l.flag + ' ' + l.name, 'outline');
        }))
      ]);
    }
  };
})(window.PP);
