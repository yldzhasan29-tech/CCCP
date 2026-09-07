/* ============ Поиск и подбор поездок ============ */
(function (PP) {
  'use strict';
  window.PP.views = window.PP.views || {};
  var U = PP.util, h = U.h, icon = U.icon, ui = PP.ui;

  PP.views.search = function (root, params) {
    var t = PP.i18n.t, lang = PP.i18n.get();
    var me = PP.store.currentUser();
    var qp = params.query || {};

    var q = {
      fromId: PP.places.byId[qp.from] ? qp.from : 'uralmash',
      toId: PP.places.byId[qp.to] ? qp.to : 'campus',
      dayOffset: [0, 1, 2].indexOf(+qp.day) >= 0 ? +qp.day : 1,
      time: /^\d{1,2}:\d{2}$/.test(qp.time || '') ? qp.time : '08:00',
      flex: +qp.flex || 15,
      seats: +qp.seats || 1,
      sort: qp.sort || 'match'
    };

    var listEl = h('div', { class: 'stack gap-4' });
    var countEl = h('span', { class: 'muted t-sm' });
    var mapEl = h('div', { class: 'map', style: { height: '100%', minHeight: '320px' } });
    var mapInst = null;

    /* ---------- filters ---------- */
    var fromSel = ui.placeSelect(q.fromId, function (v) { q.fromId = v; run(); });
    var toSel = ui.placeSelect(q.toId, function (v) { q.toId = v; run(); });
    var daySel = ui.daySelect(q.dayOffset, function (v) { q.dayOffset = v; run(); });
    var timeIn = ui.timeInput(q.time, function (v) { q.time = v; run(); });
    var seatsSel = ui.select([1, 2, 3, 4].map(function (n) { return { value: n, label: String(n) }; }),
      q.seats, function (v) { q.seats = +v; run(); });
    var sortSel = ui.select([
      { value: 'match', label: t('s_sort_match') },
      { value: 'time', label: t('s_sort_time') },
      { value: 'rating', label: t('s_sort_rating') },
      { value: 'price', label: t('s_sort_price') }
    ], q.sort, function (v) { q.sort = v; run(); });

    var flexVal = h('span', { class: 'badge badge--brand', text: '±' + q.flex + ' ' + t('c_min') });
    var flexIn = h('input', { class: 'range', type: 'range', min: '5', max: '90', step: '5', value: String(q.flex) });
    flexIn.addEventListener('input', function () {
      q.flex = +flexIn.value; flexVal.textContent = '±' + q.flex + ' ' + t('c_min');
    });
    flexIn.addEventListener('change', run);

    var swapBtn = h('button', { class: 'swapbtn', type: 'button', html: icon('swap', 17), 'aria-label': 'swap' });
    swapBtn.addEventListener('click', function () {
      var a = fromSel.value; fromSel.value = toSel.value; toSel.value = a;
      q.fromId = fromSel.value; q.toId = toSel.value; run();
    });

    var filters = h('aside', { class: 'card card--pad stack gap-5 filters' }, [
      h('div', { class: 'row gap-2 center' }, [
        h('span', { html: icon('search', 17), style: { display: 'flex', color: 'var(--brand-500)' } }),
        h('strong', { text: t('s_filters') })
      ]),
      h('div', { class: 'searchcard__pair' }, [
        ui.field(t('c_from'), fromSel), swapBtn, ui.field(t('c_to'), toSel)
      ]),
      h('div', { class: 'row gap-3' }, [
        h('div', { class: 'grow' }, ui.field(t('c_when'), daySel)),
        h('div', { class: 'grow' }, ui.field(t('c_time'), timeIn))
      ]),
      h('div', { class: 'field' }, [
        h('div', { class: 'row between center' }, [
          h('label', { class: 'field__label', text: t('s_flex') }), flexVal
        ]),
        flexIn,
        h('span', { class: 'field__hint', text: t('s_flex_hint', { n: q.flex }) })
      ]),
      ui.field(t('s_need'), seatsSel),
      ui.field(t('s_sort'), sortSel)
    ]);

    var head = h('div', { class: 'wrap section-top stack gap-2 reveal' }, [
      h('h1', { text: t('s_title') }),
      h('p', { class: 't-lead', text: t('s_sub') })
    ]);

    var layout = h('div', { class: 'wrap searchlayout' }, [
      filters,
      h('div', { class: 'stack gap-4' }, [
        h('div', { class: 'row between center wrapflex gap-3' }, [countEl]),
        listEl
      ]),
      h('div', { class: 'searchmap card', style: { padding: '0', overflow: 'hidden' } }, mapEl)
    ]);

    root.appendChild(head);
    root.appendChild(layout);

    function run() {
      var hm = String(q.time).split(':');
      var minutes = (+hm[0] || 0) * 60 + (+hm[1] || 0);
      var results = PP.matching.search({
        fromId: q.fromId, toId: q.toId, dayOffset: q.dayOffset,
        minutes: minutes, flex: q.flex, seats: q.seats, sort: q.sort,
        lang: me ? me.lang : PP.i18n.get(),
        excludeDriver: me ? me.id : null
      });

      countEl.textContent = t('s_results', { n: results.length });
      U.clear(listEl);

      if (!results.length) {
        listEl.appendChild(h('div', { class: 'card card--pad' },
          ui.empty('search', t('s_none'), t('s_none_hint'),
            q.flex < 60 ? h('button', {
              class: 'btn btn--soft', text: t('s_widen'),
              onclick: function () { q.flex = 60; flexIn.value = '60'; flexVal.textContent = '±60 ' + t('c_min'); run(); }
            }) : null)));
      } else {
        results.forEach(function (m, i) { listEl.appendChild(rideCard(m, i)); });
      }

      /* map */
      var pts = [];
      var qf = PP.places.byId[q.fromId], qt = PP.places.byId[q.toId];
      pts.push({ lat: qf.lat, lng: qf.lng, label: PP.places.label(qf, lang), kind: 'a' });
      pts.push({ lat: qt.lat, lng: qt.lng, label: PP.places.label(qt, lang), kind: 'b' });
      results.slice(0, 5).forEach(function (m) {
        var p = PP.places.byId[m.ride.fromId];
        if (p && m.ride.fromId !== q.fromId) pts.push({ lat: p.lat, lng: p.lng, label: PP.places.label(p, lang), kind: 'c' });
      });
      if (mapInst) mapInst.destroy();
      mapInst = PP.map.create(mapEl, { points: pts });
    }

    function rideCard(m, i) {
      var r = m.ride, d = m.driver;
      var reasons = PP.matching.reasons(m, { lang: me ? me.lang : lang });
      var open = false;

      var why = h('div', { class: 'why hide' }, reasons.map(function (rr) {
        return h('div', { class: 'why__row' }, [
          h('span', { html: icon(rr.icon, 15), style: { display: 'flex', color: 'var(--brand-500)', flex: 'none' } }),
          h('span', { class: 't-sm', text: rr.text })
        ]);
      }));
      var whyBtn = h('button', { class: 'btn btn--xs btn--soft' }, [
        h('span', { html: icon('info', 14), style: { display: 'flex' } }),
        h('span', { text: t('m_why') })
      ]);
      whyBtn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        open = !open; why.classList.toggle('hide', !open);
      });

      var card = h('a', {
        class: 'ridecard card card--hover reveal' + (i < 6 ? ' d' + (i + 1) : ''),
        href: '#/ride/' + r.id
      }, [
        h('div', { class: 'ridecard__main' }, [
          h('div', { class: 'ridecard__time stack gap-1' }, [
            h('strong', { class: 'tabular', text: U.hhmm(r.departAt) }),
            h('span', { class: 'muted t-xs', text: PP.i18n.dayLabel(r.departAt) })
          ]),
          h('div', { class: 'ridecard__route stack gap-2 grow' }, [
            h('div', { class: 'route' }, [
              h('span', { class: 'route__dot route__dot--a' }),
              h('span', { class: 'route__txt truncate', text: PP.places.labelById(r.fromId, lang) }),
              h('span', { class: 'route__line' }),
              h('span', { class: 'route__dot route__dot--b' }),
              h('span', { class: 'route__txt truncate', text: PP.places.labelById(r.toId, lang) })
            ]),
            h('div', { class: 'row gap-2 center wrapflex' }, [
              ui.avatar(d, 'xs'),
              h('span', { class: 't-sm strong', text: d ? d.name : '' }),
              m.stats.count
                ? h('span', { class: 'row gap-1 center t-xs muted' }, [ui.stars(m.stats.avg), h('span', { text: String(m.stats.avg) })])
                : ui.badge(t('m_new_driver'), 'outline'),
              h('span', { class: 'muted t-xs', text: PP.i18n.meta(d ? d.lang : 'ru').flag })
            ])
          ]),
          h('div', { class: 'ridecard__side' }, [
            ui.ring(m.pct),
            h('span', { class: 'muted t-2xs', text: t('s_match') })
          ])
        ]),
        h('div', { class: 'ridecard__foot' }, [
          ui.badge(t('s_seats_left', { n: m.seatsLeft }), m.seatsLeft > 0 ? 'mint' : 'danger', 'users'),
          ui.badge(ui.priceLabel(r.price), r.price ? 'ember' : 'mint', 'wallet'),
          r.note ? h('span', { class: 'muted t-xs truncate', style: { maxWidth: '220px' }, text: r.note, dir: 'auto' }) : null,
          h('span', { class: 'grow' }),
          whyBtn
        ]),
        why
      ]);
      return card;
    }

    run();
    return function () { if (mapInst) mapInst.destroy(); };
  };
})(window.PP);
