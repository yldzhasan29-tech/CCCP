/* ============ Мои поездки + оценки ============ */
(function (PP) {
  'use strict';
  window.PP.views = window.PP.views || {};
  var U = PP.util, h = U.h, icon = U.icon, ui = PP.ui, S = PP.store;

  PP.views.trips = function (root, params) {
    var t = PP.i18n.t, lang = PP.i18n.get();
    var me = S.currentUser();

    if (!me) {
      root.appendChild(h('div', { class: 'wrap section' },
        h('div', { class: 'card card--pad' },
          ui.empty('car', t('t_none'), t('r_login'),
            h('a', { class: 'btn btn--primary', href: '#/auth', text: t('nav_login') })))));
      return;
    }

    var tab = params.query.tab === 'past' ? 'past' : 'upcoming';
    var body = h('div', { class: 'stack gap-4' });

    var tabs = h('div', { class: 'tabs' }, [
      tabBtn('upcoming', t('t_upcoming')),
      tabBtn('past', t('t_past'))
    ]);
    function tabBtn(id, label) {
      return h('button', {
        class: tab === id ? 'is-active' : '', text: label,
        onclick: function () { tab = id; paint(); Array.prototype.forEach.call(tabs.children, function (c, i) {
          c.className = (i === (id === 'upcoming' ? 0 : 1)) ? 'is-active' : '';
        }); }
      });
    }

    root.appendChild(h('div', { class: 'wrap section stack gap-6' }, [
      h('div', { class: 'stack gap-2 reveal' }, [
        h('h1', { text: t('t_title') }),
        h('p', { class: 't-lead', text: t('s_sub') })
      ]),
      tabs, body
    ]));

    function myItems() {
      var out = [];
      S.where('rides', function (r) { return r.driverId === me.id; }).forEach(function (r) {
        out.push({ role: 'driver', ride: r, booking: null, when: new Date(r.departAt) });
      });
      S.where('bookings', function (b) { return b.passengerId === me.id; }).forEach(function (b) {
        var r = S.find('rides', b.rideId);
        if (r) out.push({ role: 'passenger', ride: r, booking: b, when: new Date(r.departAt) });
      });
      out.sort(function (a, b) { return b.when - a.when; });
      return out;
    }

    function paint() {
      U.clear(body);
      var now = Date.now();
      var items = myItems().filter(function (it) {
        var done = it.ride.status === 'completed' || it.when.getTime() < now - 3 * 3600 * 1000;
        return tab === 'past' ? done : !done;
      });
      if (tab === 'upcoming') items.reverse();

      if (!items.length) {
        body.appendChild(h('div', { class: 'card card--pad' },
          ui.empty('car', t('t_none'), t('t_none_hint'),
            h('div', { class: 'row gap-2' }, [
              h('a', { class: 'btn btn--soft btn--sm', href: '#/search', text: t('nav_find') }),
              h('a', { class: 'btn btn--soft btn--sm', href: '#/publish', text: t('nav_publish') })
            ]))));
        return;
      }
      items.forEach(function (it, i) { body.appendChild(tripCard(it, i)); });
    }

    function counterparts(it) {
      if (it.role === 'driver') {
        return S.where('bookings', function (b) {
          return b.rideId === it.ride.id && (b.status === 'accepted' || b.status === 'completed');
        }).map(function (b) { return S.find('users', b.passengerId); }).filter(Boolean);
      }
      var d = S.find('users', it.ride.driverId);
      return d ? [d] : [];
    }

    function hasRated(rideId, toUserId) {
      return S.where('ratings', function (r) {
        return r.rideId === rideId && r.fromUserId === me.id && r.toUserId === toUserId;
      }).length > 0;
    }

    function tripCard(it, i) {
      var r = it.ride;
      var people = counterparts(it);
      var done = r.status === 'completed';
      var statusBadge = it.role === 'driver'
        ? ui.badge(t('t_driver'), 'brand', 'car')
        : ui.badge(t('t_passenger'), 'outline', 'user');

      var bookingBadge = null;
      if (it.booking) {
        var lbl = it.booking.status === 'pending' ? t('r_pending')
          : it.booking.status === 'accepted' ? t('r_accepted')
          : it.booking.status === 'completed' ? t('r_completed') : t('r_declined');
        bookingBadge = ui.badge(lbl, it.booking.status === 'declined' ? 'danger'
          : it.booking.status === 'pending' ? 'ember' : 'mint');
      }

      var actions = h('div', { class: 'row gap-2 wrapflex' });
      actions.appendChild(h('a', { class: 'btn btn--xs btn--ghost', href: '#/ride/' + r.id }, [
        h('span', { text: t('c_more') }),
        h('span', { html: icon('chevronRight', 14), class: 'flip-x', style: { display: 'flex' } })
      ]));
      if (it.role === 'driver' && !done) {
        actions.appendChild(h('button', {
          class: 'btn btn--xs btn--soft', text: t('t_done'),
          onclick: function () {
            S.update('rides', r.id, { status: 'completed' });
            S.where('bookings', function (b) { return b.rideId === r.id && b.status === 'accepted'; })
              .forEach(function (b) { S.update('bookings', b.id, { status: 'completed' }); });
            ui.toast(t('tst_done'), 'ok'); paint();
          }
        }));
      }
      if (done) {
        people.forEach(function (p) {
          if (hasRated(r.id, p.id)) {
            actions.appendChild(ui.badge(t('t_rated'), 'mint', 'checkCircle'));
          } else {
            actions.appendChild(h('button', {
              class: 'btn btn--xs btn--ember',
              onclick: function () { rateModal(r, p); }
            }, [h('span', { html: icon('star', 13), style: { display: 'flex' } }),
                h('span', { text: t('t_rate') + ' · ' + p.name.split(' ')[0] })]));
          }
        });
      }

      return h('div', { class: 'card card--pad tripcard reveal' + (i < 6 ? ' d' + (i + 1) : '') }, [
        h('div', { class: 'row gap-3 center wrapflex' }, [
          statusBadge, bookingBadge,
          h('span', { class: 'grow' }),
          ui.badge(PP.i18n.dayLabel(r.departAt) + ' · ' + U.hhmm(r.departAt), 'outline', 'clock')
        ]),
        h('div', { class: 'route', style: { marginTop: '14px' } }, [
          h('span', { class: 'route__dot route__dot--a' }),
          h('span', { class: 'route__txt', text: PP.places.labelById(r.fromId, lang) }),
          h('span', { class: 'route__line' }),
          h('span', { class: 'route__dot route__dot--b' }),
          h('span', { class: 'route__txt', text: PP.places.labelById(r.toId, lang) })
        ]),
        h('div', { class: 'row between center wrapflex gap-3', style: { marginTop: '14px' } }, [
          h('div', { class: 'row gap-2 center' }, [
            people.length ? h('div', { class: 'avatar-stack' }, people.map(function (p) { return ui.avatar(p, 'xs'); })) : null,
            h('span', { class: 'muted t-xs', text: people.map(function (p) { return p.name; }).join(', ') || t('r_no_requests') })
          ]),
          actions
        ])
      ]);
    }

    /* ---------- модалка оценки ---------- */
    function rateModal(ride, person) {
      var stars = 5, comment = '';
      ui.modal({
        render: function (box, close) {
          var cm = h('textarea', { class: 'textarea', rows: 3, placeholder: t('rt_ph') });
          var label = h('strong', { class: 'grad-text', text: t('rt_5') });
          var picker = ui.starInput(function (n) {
            stars = n; label.textContent = t('rt_' + n);
          }, 5);
          box.appendChild(h('div', { class: 'stack gap-5' }, [
            h('div', { class: 'stack gap-2' }, [
              h('h3', { text: t('rt_title') }),
              h('p', { class: 'dim t-sm', text: t('rt_sub', { name: person.name }) })
            ]),
            h('div', { class: 'row gap-3 center' }, [ui.avatar(person, 'lg'), h('div', { class: 'stack gap-1' }, [
              h('strong', { text: person.name }),
              h('span', { class: 'muted t-xs', text: PP.places.labelById(ride.fromId, lang) + ' → ' + PP.places.labelById(ride.toId, lang) })
            ])]),
            h('div', { class: 'stack gap-2 center', style: { alignItems: 'center' } }, [picker, label]),
            cm,
            h('div', { class: 'row gap-3', style: { justifyContent: 'flex-end' } }, [
              h('button', { class: 'btn btn--ghost', text: t('c_cancel'), onclick: close }),
              h('button', {
                class: 'btn btn--grad', text: t('rt_submit'),
                onclick: function () {
                  S.insert('ratings', {
                    id: U.uid('rt'), rideId: ride.id, fromUserId: me.id,
                    toUserId: person.id, stars: stars, comment: cm.value.trim()
                  });
                  close(); ui.toast(t('tst_rated'), 'ok'); paint();
                }
              })
            ])
          ]));
        }
      });
    }

    paint();
  };
})(window.PP);
