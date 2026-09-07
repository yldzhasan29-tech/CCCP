/* ============ Настройки: модель ИИ, язык, данные ============ */
(function (PP) {
  'use strict';
  window.PP.views = window.PP.views || {};
  var U = PP.util, h = U.h, icon = U.icon, ui = PP.ui, S = PP.store;

  PP.views.settings = function (root) {
    var t = PP.i18n.t;
    var s = S.getSettings();
    var me = S.currentUser();

    var provSel = ui.select([
      { value: 'off', label: t('st_off') },
      { value: 'groq', label: 'Groq (llama 3.3 · free tier)' },
      { value: 'gemini', label: 'Google Gemini (free tier)' }
    ], s.provider, function (v) {
      s = S.setSettings({ provider: v, model: (PP.ai.MODELS[v] || [''])[0] });
      PP.shell.render();
    });

    var keyIn = h('input', {
      class: 'input', type: 'password', placeholder: t('st_key_ph'), value: s.apiKey || '',
      autocomplete: 'off', spellcheck: 'false'
    });
    keyIn.addEventListener('input', function () { S.setSettings({ apiKey: keyIn.value.trim() }); });

    var eyeBtn = h('button', {
      class: 'btn btn--ghost btn--icon btn--sm', html: icon('eye', 17),
      onclick: function () { keyIn.type = keyIn.type === 'password' ? 'text' : 'password'; }
    });

    var models = PP.ai.MODELS[s.provider] || [];
    var modelSel = models.length ? ui.select(models.map(function (m) { return { value: m, label: m }; }),
      s.model || models[0], function (v) { S.setSettings({ model: v }); }) : null;

    var testOut = h('span', { class: 'field__hint' });
    var testBtn = h('button', { class: 'btn btn--soft btn--sm' }, [
      h('span', { html: icon('bolt', 15), style: { display: 'flex' } }),
      h('span', { text: t('st_test') })
    ]);
    testBtn.addEventListener('click', function () {
      if (!PP.ai.enabled()) { testOut.textContent = t('st_off'); return; }
      testBtn.disabled = true;
      U.clear(testOut);
      testOut.appendChild(h('span', { class: 'row gap-2 center' }, [
        h('span', { class: 'spinner', style: { width: '13px', height: '13px' } }),
        h('span', { text: t('st_testing') })
      ]));
      PP.ai.testKey().then(function () {
        testBtn.disabled = false;
        U.clear(testOut);
        testOut.appendChild(h('span', { style: { color: 'var(--mint-600)', fontWeight: '700' }, text: '✓ ' + t('st_test_ok') }));
        ui.toast(t('st_test_ok'), 'ok');
      }).catch(function (e) {
        testBtn.disabled = false;
        U.clear(testOut);
        var msg = String(e && e.message || e).slice(0, 120);
        testOut.appendChild(h('span', { style: { color: 'var(--danger-500)', fontWeight: '700' }, text: t('st_test_fail', { msg: msg }) }));
      });
    });

    var aiCard = h('div', { class: 'card card--pad stack gap-5 reveal' }, [
      h('div', { class: 'row between center wrapflex gap-3' }, [
        h('div', { class: 'row gap-2 center' }, [
          h('span', { html: icon('sparkle', 18), style: { display: 'flex', color: 'var(--brand-500)' } }),
          h('strong', { text: t('st_ai') })
        ]),
        PP.ai.enabled() ? ui.badge(s.provider.toUpperCase(), 'mint', 'checkCircle')
                        : ui.badge(t('st_offline'), 'outline', 'bolt')
      ]),
      ui.field(t('st_provider'), provSel, t('st_ai_hint')),
      s.provider !== 'off' ? h('div', { class: 'stack gap-4' }, [
        h('div', { class: 'field' }, [
          h('label', { class: 'field__label', text: t('st_key') }),
          h('div', { class: 'row gap-2' }, [h('div', { class: 'grow' }, keyIn), eyeBtn])
        ]),
        modelSel ? ui.field(t('st_model'), modelSel) : null,
        h('div', { class: 'row gap-3 center wrapflex' }, [testBtn, testOut])
      ]) : h('div', { class: 'note' }, [
        h('span', { html: icon('info', 16), style: { display: 'flex', flex: 'none' } }),
        h('span', { class: 't-sm', text: t('st_offline_hint') })
      ]),
      h('div', { class: 'stack gap-2' }, [
        h('span', { class: 'field__label', text: t('ch_auto') }),
        (function () {
          var sw = h('label', { class: 'switch' }, [
            h('input', { type: 'checkbox', checked: s.autoTranslate !== false ? true : null }),
            h('span', { class: 'switch__track' }),
            h('span', { class: 't-sm', text: t('ch_ai_on') })
          ]);
          sw.querySelector('input').addEventListener('change', function () {
            S.setSettings({ autoTranslate: this.checked });
          });
          return sw;
        })()
      ])
    ]);

    var langCard = h('div', { class: 'card card--pad stack gap-4 reveal d1' }, [
      h('div', { class: 'row gap-2 center' }, [
        h('span', { html: icon('globe', 18), style: { display: 'flex', color: 'var(--brand-500)' } }),
        h('strong', { text: t('st_lang') })
      ]),
      h('span', { class: 'field__hint', text: t('st_lang_hint') }),
      h('div', { class: 'langgrid' }, PP.i18n.available().map(function (l) {
        return h('button', {
          class: 'langtile' + (l.code === PP.i18n.get() ? ' is-active' : ''),
          onclick: function () { PP.i18n.set(l.code); }
        }, [
          h('span', { style: { fontSize: '20px' }, text: l.flag }),
          h('span', { class: 't-sm strong', text: l.name }),
          l.dir === 'rtl' ? h('span', { class: 'badge badge--outline', text: 'RTL' }) : null
        ]);
      }))
    ]);

    var accountCard = me ? h('div', { class: 'card card--pad stack gap-4 reveal d2' }, [
      h('div', { class: 'row gap-2 center' }, [
        h('span', { html: icon('user', 18), style: { display: 'flex', color: 'var(--brand-500)' } }),
        h('strong', { text: t('st_account') })
      ]),
      h('div', { class: 'row gap-3 center' }, [
        ui.avatar(me, 'lg'),
        h('div', { class: 'stack gap-1 grow', style: { minWidth: 0 } }, [
          h('strong', { text: me.name }),
          h('span', { class: 'muted t-xs truncate', text: me.email })
        ]),
        h('a', { class: 'btn btn--xs btn--soft', href: '#/profile/' + me.id, text: t('nav_profile') })
      ]),
      ui.field(t('auth_lang'), ui.select(PP.i18n.available().map(function (l) {
        return { value: l.code, label: l.flag + '  ' + l.name };
      }), me.lang, function (v) {
        S.update('users', me.id, { lang: v });
        ui.toast(t('tst_saved'), 'ok');
      }), t('auth_lang_hint')),
      h('div', { class: 'stack gap-2' }, [
        h('span', { class: 'field__label', text: t('st_switch') }),
        h('span', { class: 'field__hint', text: t('st_switch_hint') }),
        h('div', { class: 'row gap-2 wrapflex' }, S.all('users').map(function (u) {
          return h('button', {
            class: 'chip' + (u.id === me.id ? ' is-active' : ''),
            onclick: function () {
              S.signIn(u.id); ui.toast(t('tst_in', { name: u.name }), 'ok'); PP.shell.render();
            }
          }, [ui.avatar(u, 'xs'), h('span', { text: u.name.split(' ')[0] })]);
        }))
      ])
    ]) : null;

    var dataCard = h('div', { class: 'card card--pad stack gap-4 reveal d3' }, [
      h('div', { class: 'row gap-2 center' }, [
        h('span', { html: icon('refresh', 18), style: { display: 'flex', color: 'var(--brand-500)' } }),
        h('strong', { text: t('st_data') })
      ]),
      h('p', { class: 'dim t-sm', text: t('st_data_hint') }),
      h('button', {
        class: 'btn btn--danger btn--sm', style: { alignSelf: 'flex-start' },
        onclick: function () {
          ui.confirmDialog(t('st_reset'), t('st_data_hint'), t('c_confirm'), function () {
            PP.seed.install();
            ui.toast(t('st_reset_ok'), 'ok');
            PP.shell.render();
          });
        }
      }, [h('span', { html: icon('trash', 15), style: { display: 'flex' } }), h('span', { text: t('st_reset') })])
    ]);

    root.appendChild(h('div', { class: 'wrap wrap--narrow section stack gap-6' }, [
      h('div', { class: 'stack gap-2 reveal' }, [
        h('h1', { text: t('st_title') })
      ]),
      aiCard, langCard, accountCard, dataCard
    ]));
  };
})(window.PP);
