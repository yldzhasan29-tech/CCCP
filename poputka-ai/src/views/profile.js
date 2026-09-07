/* ============ Профиль пользователя ============ */
(function (PP) {
  'use strict';
  window.PP.views = window.PP.views || {};
  var U = PP.util, h = U.h, icon = U.icon, ui = PP.ui, S = PP.store;

  PP.views.profile = function (root, params) {
    var t = PP.i18n.t, lang = PP.i18n.get();
    var user = S.find('users', params.id);
    if (!user) {
      root.appendChild(h('div', { class: 'wrap section' },
        h('div', { class: 'card card--pad' }, ui.empty('user', t('p_title'), ''))));
      return;
    }
    var st = S.userStats(user.id);
    var me = S.currentUser();

    var rides = S.where('rides', function (r) { return r.driverId === user.id && r.status === 'open'; })
      .sort(function (a, b) { return new Date(a.departAt) - new Date(b.departAt); });

    root.appendChild(h('div', { class: 'wrap section profilepage' }, [
      h('div', { class: 'stack gap-5' }, [
        h('div', { class: 'card card--pad stack gap-5 reveal' }, [
          h('div', { class: 'row gap-4 center wrapflex' }, [
            ui.avatar(user, 'xl'),
            h('div', { class: 'stack gap-2 grow', style: { minWidth: 0 } }, [
              h('h1', { text: user.name, style: { fontSize: 'var(--t-h2)' } }),
              h('div', { class: 'row gap-2 center wrapflex' }, [
                ui.badge(t('p_verified'), 'mint', 'shield'),
                ui.langBadge(user.lang),
                me && me.id === user.id ? ui.badge(t('c_you'), 'brand') : null
              ])
            ])
          ]),
          user.bio ? h('p', { class: 'dim', text: user.bio, dir: 'auto' }) : null,
          h('div', { class: 'kpis' }, [
            kpi(st.count ? String(st.avg) : '—', t('p_rating'), st.count ? ui.stars(st.avg) : null),
            kpi(String(st.trips), t('p_trips')),
            kpi(String(st.asDriver), t('p_as_driver')),
            kpi(String(st.asPassenger), t('p_as_passenger'))
          ]),
          user.car ? h('div', { class: 'row gap-2 center dim t-sm' }, [
            h('span', { html: icon('car', 16), style: { display: 'flex' } }),
            h('span', { text: user.car })
          ]) : null,
          h('div', { class: 'row gap-2 center muted t-xs' }, [
            h('span', { html: icon('calendar', 15), style: { display: 'flex' } }),
            h('span', { text: t('p_member', { date: PP.i18n.dateLabel(user.joined || Date.now()) }) })
          ])
        ]),
        h('div', { class: 'card card--pad stack gap-4 reveal d1' }, [
          h('div', { class: 'row gap-2 center' }, [
            h('span', { html: icon('star', 17), style: { display: 'flex', color: 'var(--star-500)' } }),
            h('strong', { text: t('p_reviews') }),
            h('span', { class: 'grow' }),
            ui.badge(String(st.count), 'outline')
          ]),
          st.reviews.length ? h('div', { class: 'stack gap-4' }, st.reviews.map(function (r) {
            var from = S.find('users', r.fromUserId);
            return h('div', { class: 'review' }, [
              ui.avatar(from, 'sm'),
              h('div', { class: 'stack gap-1 grow', style: { minWidth: 0 } }, [
                h('div', { class: 'row gap-2 center wrapflex' }, [
                  h('strong', { class: 't-sm', text: from ? from.name : '—' }),
                  ui.stars(r.stars),
                  h('span', { class: 'muted t-2xs', text: PP.i18n.dateLabel(r.createdAt) })
                ]),
                r.comment ? h('p', { class: 'dim t-sm', text: r.comment, dir: 'auto' }) : null
              ])
            ]);
          })) : h('p', { class: 'dim t-sm', text: t('p_no_reviews') })
        ])
      ]),
      h('div', { class: 'stack gap-5' }, [
        h('div', { class: 'card card--pad stack gap-4 reveal d2' }, [
          h('div', { class: 'row gap-2 center' }, [
            h('span', { html: icon('car', 17), style: { display: 'flex', color: 'var(--brand-500)' } }),
            h('strong', { text: t('nav_find') })
          ]),
          rides.length ? h('div', { class: 'stack gap-3' }, rides.slice(0, 6).map(function (r) {
            return h('a', { class: 'miniride', href: '#/ride/' + r.id }, [
              h('div', { class: 'stack gap-1 grow', style: { minWidth: 0 } }, [
                h('strong', { class: 't-sm tabular', text: PP.i18n.dayLabel(r.departAt) + ' · ' + U.hhmm(r.departAt) }),
                h('span', { class: 'muted t-xs truncate', text: PP.places.labelById(r.fromId, lang) + ' → ' + PP.places.labelById(r.toId, lang) })
              ]),
              ui.badge(ui.priceLabel(r.price), r.price ? 'ember' : 'mint')
            ]);
          })) : h('p', { class: 'dim t-sm', text: t('t_none') })
        ])
      ])
    ]));

    function kpi(value, label, extra) {
      return h('div', { class: 'kpi' }, [
        h('strong', { class: 'kpi__v tabular', text: value }),
        extra || null,
        h('span', { class: 'kpi__l', text: label })
      ]);
    }
  };
})(window.PP);
