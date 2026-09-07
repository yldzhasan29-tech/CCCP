/* ============ Карточка поездки ============ */
(function (PP) {
  'use strict';
  window.PP.views = window.PP.views || {};
  var U = PP.util, h = U.h, icon = U.icon, ui = PP.ui, S = PP.store;

  PP.views.ride = function (root, params) {
    var t = PP.i18n.t, lang = PP.i18n.get();
    var ride = S.find('rides', params.id);
    var me = S.currentUser();
    var mapInst = null;

    if (!ride) {
      root.appendChild(h('div', { class: 'wrap section' },
        h('div', { class: 'card card--pad' }, ui.empty('info', t('s_none'), ''))));
      return;
    }

    var driver = S.find('users', ride.driverId);
    var st = S.userStats(driver.id);
    var seatsLeft = S.rideSeatsLeft(ride);
    var isMine = me && me.id === driver.id;
    var myBooking = me ? S.where('bookings', function (b) {
      return b.rideId === ride.id && b.passengerId === me.id;
    })[0] : null;

    var a = PP.places.byId[ride.fromId], b = PP.places.byId[ride.toId];
    var mapEl = h('div', { class: 'map', style: { height: '280px' } });
    setTimeout(function () {
      mapInst = PP.map.create(mapEl, {
        points: [
          { lat: a.lat, lng: a.lng, label: PP.places.label(a, lang), kind: 'a' },
          { lat: b.lat, lng: b.lng, label: PP.places.label(b, lang), kind: 'b' }
        ]
      });
    }, 0);

    /* ---------- action panel ---------- */
    function actionPanel() {
      if (!me) {
        return h('a', { class: 'btn btn--primary btn--lg btn--block', href: '#/auth', text: t('r_login') });
      }

      /* --- водитель --- */
      if (isMine) {
        return h('div', { class: 'stack gap-3' }, [
          ui.badge(t('r_yours'), 'brand', 'car'),
          ride.status === 'open' ? h('button', {
            class: 'btn btn--lg btn--block', onclick: completeRide
          }, [h('span', { html: icon('checkCircle', 18), style: { display: 'flex' } }),
              h('span', { text: t('r_complete') })])
            : ui.badge(t('r_completed'), 'mint', 'checkCircle'),
          ride.status === 'open' ? h('button', {
            class: 'btn btn--danger btn--sm btn--block', onclick: removeRide
          }, [h('span', { html: icon('trash', 15), style: { display: 'flex' } }),
              h('span', { text: t('c_delete') })]) : null
        ]);
      }

      /* --- пассажир, у которого уже есть бронь --- */
      if (myBooking) {
        var label = myBooking.status === 'pending' ? t('r_pending')
          : myBooking.status === 'accepted' ? t('r_accepted')
          : myBooking.status === 'completed' ? t('r_completed') : t('r_declined');
        var kind = myBooking.status === 'accepted' ? 'mint'
          : myBooking.status === 'declined' ? 'danger' : 'ember';

        var rows = [
          h('div', { class: 'row gap-2 center wrapflex' }, [
            ui.badge(label, kind, 'checkCircle'),
            myBooking.seats > 1 ? ui.badge(myBooking.seats + ' × ' + t('c_seats'), 'outline', 'users') : null
          ])
        ];

        if (myBooking.status === 'declined') {
          /* отказ — можно попробовать снова, если места остались */
          rows.push(seatsLeft > 0 ? h('button', {
            class: 'btn btn--primary btn--lg btn--block',
            onclick: function () {
              S.cancelBooking(myBooking.id);
              S.insert('bookings', {
                id: U.uid('b'), rideId: ride.id, passengerId: me.id, seats: 1, status: 'pending'
              });
              ui.toast(t('tst_req'), 'ok'); PP.shell.render();
            }
          }, [h('span', { html: icon('refresh', 17), style: { display: 'flex' } }),
              h('span', { text: t('r_again') })])
            : h('button', { class: 'btn btn--lg btn--block is-disabled', text: t('r_full') }));
        } else {
          rows.push(h('a', {
            class: 'btn btn--primary btn--lg btn--block',
            href: '#/chats/' + S.threadId(ride.id, me.id)
          }, [h('span', { html: icon('chat', 18), style: { display: 'flex' } }),
              h('span', { text: t('r_chat') })]));
        }

        if (myBooking.status === 'pending' || myBooking.status === 'accepted') {
          rows.push(h('button', {
            class: 'btn btn--danger btn--sm btn--block',
            onclick: function () {
              ui.confirmDialog(t('r_cancel_req'), t('r_cancel_req') + '?', t('c_confirm'), function () {
                S.cancelBooking(myBooking.id);
                ui.toast(t('tst_req_off'), 'info');
                PP.shell.render();
              });
            }
          }, [h('span', { html: icon('x', 15), style: { display: 'flex' } }),
              h('span', { text: t('r_cancel_req') })]));
        }
        return h('div', { class: 'stack gap-3' }, rows);
      }

      /* --- свободных мест нет --- */
      if (seatsLeft <= 0 || ride.status !== 'open') {
        return h('button', { class: 'btn btn--lg btn--block is-disabled', text: t('r_full') });
      }

      /* --- новая бронь: сколько мест + запрос --- */
      var want = 1;
      var seatOpts = [];
      for (var i = 1; i <= seatsLeft; i++) seatOpts.push({ value: i, label: String(i) });
      var seatsSel = ui.select(seatOpts, want, function (v) { want = +v; });

      var btn = h('button', { class: 'btn btn--grad btn--lg btn--block' }, [
        h('span', { html: icon('checkCircle', 18), style: { display: 'flex' } }),
        h('span', { text: t('r_request') })
      ]);
      btn.addEventListener('click', function () {
        S.insert('bookings', {
          id: U.uid('b'), rideId: ride.id, passengerId: me.id,
          seats: U.clamp(want, 1, seatsLeft), status: 'pending'
        });
        ui.toast(t('tst_req'), 'ok');
        PP.shell.render();
      });

      return h('div', { class: 'stack gap-3' }, [
        seatsLeft > 1 ? ui.field(t('r_seats_pick'), seatsSel) : null,
        btn
      ]);
    }

    function completeRide() {
      ui.confirmDialog(t('r_complete'), t('r_completed') + '?', t('c_confirm'), function () {
        S.update('rides', ride.id, { status: 'completed' });
        S.where('bookings', function (bk) { return bk.rideId === ride.id && bk.status === 'accepted'; })
          .forEach(function (bk) { S.update('bookings', bk.id, { status: 'completed' }); });
        ui.toast(t('tst_done'), 'ok');
        ui.go('#/trips');
      });
    }

    function removeRide() {
      ui.confirmDialog(t('c_delete'), t('r_delete_q'), t('c_delete'), function () {
        S.deleteRide(ride.id);
        ui.toast(t('tst_ride_off'), 'info');
        ui.go('#/trips');
      });
    }

    /* ---------- requests (driver side) ---------- */
    function requestsPanel() {
      if (!isMine) return null;
      var list = S.where('bookings', function (bk) { return bk.rideId === ride.id; });
      return h('div', { class: 'card card--pad stack gap-4' }, [
        h('div', { class: 'row gap-2 center' }, [
          h('span', { html: icon('users', 18), style: { display: 'flex', color: 'var(--brand-500)' } }),
          h('strong', { text: t('r_requests') }),
          h('span', { class: 'grow' }),
          ui.badge(String(list.length), 'outline')
        ]),
        list.length ? h('div', { class: 'stack gap-3' }, list.map(bookingRow))
                    : h('p', { class: 'dim t-sm', text: t('r_no_requests') })
      ]);
    }

    function bookingRow(bk) {
      var p = S.find('users', bk.passengerId);
      var pst = S.userStats(bk.passengerId);
      var actions;
      if (bk.status === 'pending') {
        actions = h('div', { class: 'row gap-2' }, [
          h('button', {
            class: 'btn btn--xs btn--soft', onclick: function () {
              /* нельзя подтвердить больше пассажиров, чем есть мест */
              if ((bk.seats || 1) > S.rideSeatsLeft(ride)) {
                ui.toast(t('r_full'), 'err');
                return;
              }
              S.update('bookings', bk.id, { status: 'accepted' });
              ui.toast(t('tst_acc'), 'ok'); PP.shell.render();
            }
          }, t('r_accept')),
          h('button', {
            class: 'btn btn--xs btn--danger', onclick: function () {
              S.update('bookings', bk.id, { status: 'declined' });
              ui.toast(t('tst_dec'), 'info'); PP.shell.render();
            }
          }, t('r_decline'))
        ]);
      } else {
        var lbl = bk.status === 'accepted' ? t('r_accepted')
          : bk.status === 'completed' ? t('r_completed') : t('r_declined');
        actions = ui.badge(lbl, bk.status === 'declined' ? 'danger' : 'mint');
      }
      return h('div', { class: 'row gap-3 center bookrow' }, [
        ui.avatar(p, 'sm'),
        h('div', { class: 'stack gap-0 grow', style: { minWidth: 0 } }, [
          h('a', { class: 'strong t-sm truncate', href: '#/profile/' + p.id, text: p.name }),
          h('span', { class: 'row gap-1 center muted t-xs' }, [
            pst.count ? ui.stars(pst.avg) : null,
            h('span', { text: pst.count ? String(pst.avg) : t('m_new_driver') })
          ])
        ]),
        h('a', {
          class: 'btn btn--xs btn--ghost', href: '#/chats/' + S.threadId(ride.id, p.id),
          html: icon('chat', 16), title: t('r_chat')
        }),
        actions
      ]);
    }

    /* ---------- render ---------- */
    var wrap = h('div', { class: 'wrap section ridepage' }, [
      h('div', { class: 'stack gap-5' }, [
        h('a', { class: 'btn btn--ghost btn--sm', href: '#/search', style: { alignSelf: 'flex-start' } }, [
          h('span', { html: icon('arrowLeft', 16), class: 'flip-x', style: { display: 'flex' } }),
          h('span', { text: t('c_back') })
        ]),
        h('div', { class: 'card card--pad stack gap-5 reveal' }, [
          h('div', { class: 'row between wrapflex gap-4 center' }, [
            h('div', { class: 'stack gap-2' }, [
              h('div', { class: 'row gap-2 center wrapflex' }, [
                ui.badge(PP.i18n.dayLabel(ride.departAt) + ' · ' + U.hhmm(ride.departAt), 'brand', 'clock'),
                ui.badge(ui.priceLabel(ride.price), ride.price ? 'ember' : 'mint', 'wallet'),
                ui.badge(t('s_seats_left', { n: seatsLeft }), seatsLeft ? 'mint' : 'danger', 'users')
              ]),
              h('h1', { class: 'route-title' }, [
                h('span', { text: PP.places.labelById(ride.fromId, lang) }),
                h('span', { class: 'route-title__arrow', html: icon('arrowRight', 22) }),
                h('span', { text: PP.places.labelById(ride.toId, lang) })
              ])
            ])
          ]),
          mapEl,
          ride.note ? h('div', { class: 'note' }, [
            h('span', { html: icon('info', 16), style: { display: 'flex', flex: 'none' } }),
            h('span', { class: 't-sm', text: ride.note, dir: 'auto' })
          ]) : null,
          ride.rawText ? h('div', { class: 'rawquote' }, [
            h('span', { class: 'field__label', text: t('pub_nl_label') }),
            h('p', { class: 't-sm', text: '«' + ride.rawText + '»', dir: 'auto' })
          ]) : null
        ]),
        requestsPanel()
      ]),
      h('div', { class: 'stack gap-5' }, [
        h('div', { class: 'card card--pad stack gap-4 reveal d1' }, [
          h('span', { class: 'field__label', text: t('r_driver') }),
          h('a', { class: 'row gap-3 center', href: '#/profile/' + driver.id }, [
            ui.avatar(driver, 'lg'),
            h('div', { class: 'stack gap-1', style: { minWidth: 0 } }, [
              h('strong', { class: 'truncate', text: driver.name }),
              h('span', { class: 'row gap-1 center muted t-xs' }, [
                st.count ? ui.stars(st.avg) : null,
                h('span', { text: st.count ? st.avg + ' · ' + t('p_trips') + ': ' + st.trips : t('m_new_driver') })
              ])
            ])
          ]),
          driver.car ? h('div', { class: 'row gap-2 center dim t-sm' }, [
            h('span', { html: icon('car', 16), style: { display: 'flex' } }),
            h('span', { text: driver.car })
          ]) : null,
          h('div', { class: 'row gap-2 center dim t-sm' }, [
            h('span', { html: icon('globe', 16), style: { display: 'flex' } }),
            h('span', { text: PP.i18n.meta(driver.lang).flag + ' ' + PP.i18n.nameOf(driver.lang) })
          ]),
          h('div', { class: 'row gap-2 center', style: { color: 'var(--mint-600)' } }, [
            h('span', { html: icon('shield', 16), style: { display: 'flex' } }),
            h('span', { class: 't-sm strong', text: t('p_verified') })
          ]),
          h('div', { class: 'divider', style: { margin: '4px 0' } }),
          actionPanel()
        ])
      ])
    ]);

    root.appendChild(wrap);
    return function () { if (mapInst) mapInst.destroy(); };
  };
})(window.PP);
