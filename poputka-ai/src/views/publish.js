/* ============ Публикация поездки ============ */
(function (PP) {
  'use strict';
  window.PP.views = window.PP.views || {};
  var U = PP.util, h = U.h, icon = U.icon, ui = PP.ui;

  PP.views.publish = function (root) {
    var t = PP.i18n.t;
    var me = PP.store.currentUser();

    var wrap = h('div', { class: 'wrap wrap--narrow section stack gap-6' });
    root.appendChild(wrap);

    wrap.appendChild(h('div', { class: 'stack gap-3 reveal' }, [
      ui.badge(PP.ai.enabled() ? PP.ai.cfg().provider.toUpperCase() : t('st_offline'),
               PP.ai.enabled() ? 'mint' : 'outline', 'sparkle'),
      h('h1', { text: t('pub_title') }),
      h('p', { class: 't-lead', text: t('pub_sub') })
    ]));

    if (!me) {
      wrap.appendChild(h('div', { class: 'card card--pad reveal d1' },
        ui.empty('user', t('pub_login'), t('auth_sub'),
          h('a', { class: 'btn btn--primary', href: '#/auth', text: t('nav_login') }))));
      return;
    }

    var ta = h('textarea', { class: 'textarea', placeholder: t('pub_nl_ph'), rows: 4 });
    var parseBtn = h('button', { class: 'btn btn--grad btn--lg' }, [
      h('span', { html: icon('sparkle', 18), style: { display: 'flex' } }),
      h('span', { text: t('pub_parse') })
    ]);
    var resultBox = h('div', { class: 'stack gap-6' });

    var exRow = h('div', { class: 'row gap-2 wrapflex' }, [t('pub_ex1'), t('pub_ex2'), t('pub_ex3')].map(function (x) {
      return h('button', { class: 'chip', onclick: function () { ta.value = x; ta.focus(); } }, x);
    }));

    wrap.appendChild(h('div', { class: 'card card--pad stack gap-4 reveal d1' }, [
      h('label', { class: 'field__label', text: t('pub_nl_label') }),
      ta,
      h('div', { class: 'stack gap-2' }, [
        h('span', { class: 'field__hint', text: t('pub_examples') }),
        exRow
      ]),
      h('div', { class: 'row gap-3 wrapflex' }, [parseBtn])
    ]));
    wrap.appendChild(resultBox);

    parseBtn.addEventListener('click', function () {
      var text = ta.value.trim();
      if (!text) { ui.toast(t('pub_empty'), 'err'); ta.focus(); return; }
      parseBtn.disabled = true;
      var old = parseBtn.innerHTML;
      parseBtn.innerHTML = '';
      parseBtn.appendChild(h('span', { class: 'spinner' }));
      parseBtn.appendChild(h('span', { text: t('pub_parsing') }));

      U.clear(resultBox);
      resultBox.appendChild(h('div', { class: 'card card--pad stack gap-3' }, [
        h('div', { class: 'sk sk--title' }),
        h('div', { class: 'sk sk--line', style: { width: '92%' } }),
        h('div', { class: 'sk sk--line', style: { width: '70%' } }),
        h('div', { class: 'sk sk--line', style: { width: '48%' } })
      ]));

      var started = Date.now();
      PP.ai.parseRide(text).then(function (parsed) {
        var wait = Math.max(0, 520 - (Date.now() - started));
        setTimeout(function () {
          parseBtn.disabled = false; parseBtn.innerHTML = old;
          U.clear(resultBox);
          resultBox.appendChild(reviewCard(parsed, text));
          resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, wait);
      });
    });

    /* ---------- карточка проверки ---------- */
    function reviewCard(p, rawText) {
      var state = {
        fromId: p.fromId, toId: p.toId, day: p.dayOffset,
        time: p.time, seats: p.seats, price: p.price, note: p.note || ''
      };
      var fromSel = ui.placeSelect(state.fromId, function (v) { state.fromId = v; refreshMap(); });
      var toSel = ui.placeSelect(state.toId, function (v) { state.toId = v; refreshMap(); });
      var daySel = ui.daySelect(state.day, function (v) { state.day = v; });
      var timeIn = ui.timeInput(state.time, function (v) { state.time = v; });
      var seatsSel = ui.select([1, 2, 3, 4, 5, 6].map(function (n) { return { value: n, label: String(n) }; }),
        state.seats, function (v) { state.seats = +v; });
      var priceIn = h('input', { class: 'input', type: 'number', min: '0', step: '10', value: String(state.price || 0) });
      priceIn.addEventListener('input', function () { state.price = Math.max(0, parseInt(priceIn.value, 10) || 0); });
      var noteIn = h('input', { class: 'input', placeholder: t('pub_note_ph'), value: state.note });

      var mapEl = h('div', { class: 'map', style: { height: '230px' } });
      var mapInst = null;
      function refreshMap() {
        var a = PP.places.byId[state.fromId], b = PP.places.byId[state.toId];
        if (mapInst) mapInst.destroy();
        mapInst = PP.map.create(mapEl, {
          points: [
            { lat: a.lat, lng: a.lng, label: PP.places.label(a, PP.i18n.get()), kind: 'a' },
            { lat: b.lat, lng: b.lng, label: PP.places.label(b, PP.i18n.get()), kind: 'b' }
          ]
        });
      }
      setTimeout(refreshMap, 0);

      var engineBadge = p.engine === 'ai'
        ? ui.badge(t('pub_ai'), 'mint', 'sparkle')
        : ui.badge(t('pub_offline'), 'outline', 'bolt');

      var submitBtn = h('button', { class: 'btn btn--grad btn--lg btn--block' }, [
        h('span', { html: icon('checkCircle', 18), style: { display: 'flex' } }),
        h('span', { text: t('pub_submit') })
      ]);
      submitBtn.addEventListener('click', function () {
        var when = new Date();
        when.setDate(when.getDate() + state.day);
        var hm = String(state.time || '08:00').split(':');
        when.setHours(+hm[0] || 0, +hm[1] || 0, 0, 0);
        /* объявление в прошлом никто не найдёт — не даём его создать */
        if (when.getTime() < Date.now() - 60000) {
          ui.toast(t('pub_past'), 'err');
          timeIn.classList.add('is-error');
          timeIn.focus();
          setTimeout(function () { timeIn.classList.remove('is-error'); }, 2500);
          return;
        }
        var ride = PP.store.insert('rides', {
          id: U.uid('r'),
          driverId: me.id,
          fromId: state.fromId, toId: state.toId,
          departAt: when.toISOString(),
          seats: state.seats,
          price: state.price,
          note: (noteIn.value || '').trim(),
          rawText: rawText,
          parsedBy: p.engine,
          status: 'open'
        });
        ui.toast(t('tst_published'), 'ok');
        ui.go('#/ride/' + ride.id);
      });

      return h('div', { class: 'card card--pad stack gap-5 reveal' }, [
        h('div', { class: 'row between center wrapflex gap-3' }, [
          h('div', { class: 'stack gap-1' }, [
            h('h3', { text: t('pub_review_t') }),
            h('span', { class: 'dim t-sm', text: t('pub_review_s') })
          ]),
          engineBadge
        ]),
        p.engine === 'offline' ? h('div', { class: 'note' }, [
          h('span', { html: icon('info', 16), style: { display: 'flex', flex: 'none' } }),
          h('span', { class: 't-sm', text: t('pub_ai_hint') })
        ]) : null,
        h('div', { class: 'formgrid' }, [
          ui.field(t('c_from'), fromSel),
          ui.field(t('c_to'), toSel),
          ui.field(t('c_when'), daySel),
          ui.field(t('c_time'), timeIn),
          ui.field(t('c_seats'), seatsSel),
          ui.field(t('pub_price') + ' (' + t('c_rub') + ')', priceIn, t('pub_price_hint'))
        ]),
        ui.field(t('pub_note') + ' · ' + t('c_optional'), noteIn),
        mapEl,
        submitBtn
      ]);
    }
  };
})(window.PP);
