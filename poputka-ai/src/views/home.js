/* ============ Главная ============ */
(function (PP) {
  'use strict';
  window.PP.views = window.PP.views || {};
  var U = PP.util, h = U.h, icon = U.icon, ui = PP.ui;

  PP.views.home = function (root) {
    var t = PP.i18n.t;
    var lang = PP.i18n.get();

    /* ---- quick search ---- */
    var q = { fromId: 'uralmash', toId: 'campus', day: 1, time: '08:00' };
    var fromSel = ui.placeSelect(q.fromId, function (v) { q.fromId = v; });
    var toSel = ui.placeSelect(q.toId, function (v) { q.toId = v; });
    var daySel = ui.daySelect(q.day, function (v) { q.day = v; });
    var timeIn = ui.timeInput(q.time, function (v) { q.time = v; });

    function swap() {
      var a = fromSel.value; fromSel.value = toSel.value; toSel.value = a;
      q.fromId = fromSel.value; q.toId = toSel.value;
    }
    function doSearch() {
      ui.go('#/search?from=' + fromSel.value + '&to=' + toSel.value +
            '&day=' + daySel.value + '&time=' + encodeURIComponent(timeIn.value));
    }

    var searchCard = h('div', { class: 'searchcard reveal d3' }, [
      h('div', { class: 'row gap-2 center', style: { marginBottom: '14px' } }, [
        h('span', { html: icon('bolt', 16), style: { display: 'flex', color: 'var(--brand-500)' } }),
        h('strong', { class: 't-sm', text: t('home_quick') })
      ]),
      h('div', { class: 'searchcard__grid' }, [
        h('div', { class: 'searchcard__pair' }, [
          ui.field(t('c_from'), fromSel),
          h('button', {
            class: 'swapbtn', type: 'button', onclick: swap,
            'aria-label': 'swap', html: icon('swap', 17)
          }),
          ui.field(t('c_to'), toSel)
        ]),
        ui.field(t('c_when'), daySel),
        ui.field(t('c_time'), timeIn),
        h('button', { class: 'btn btn--grad btn--lg searchcard__go', onclick: doSearch }, [
          h('span', { html: icon('search', 18), style: { display: 'flex' } }),
          h('span', { text: t('c_search') })
        ])
      ])
    ]);

    /* ---- hero ---- */
    var hero = h('section', { class: 'hero' }, [
      h('div', { class: 'hero__mesh' }),
      h('div', { class: 'wrap hero__inner' }, [
        h('div', { class: 'hero__copy stack gap-5' }, [
          h('span', { class: 'reveal' }, ui.badge(t('home_badge'), 'brand', 'sparkle')),
          h('h1', { class: 't-display reveal d1' }, [
            h('span', { text: t('home_t1') + ' ' }),
            h('span', { class: 'grad-text', text: t('home_t2') }),
            h('br'),
            h('span', { text: t('home_t3') })
          ]),
          h('p', { class: 't-lead reveal d2', text: t('home_sub'), style: { maxWidth: '560px' } }),
          h('div', { class: 'row gap-3 wrapflex reveal d3' }, [
            h('a', { class: 'btn btn--grad btn--lg', href: '#/search' }, [
              h('span', { html: icon('search', 18), style: { display: 'flex' } }),
              h('span', { text: t('home_cta_find') })
            ]),
            h('a', { class: 'btn btn--lg', href: '#/publish' }, [
              h('span', { html: icon('car', 18), style: { display: 'flex' } }),
              h('span', { text: t('home_cta_publish') })
            ])
          ]),
          h('div', { class: 'stats reveal d4' }, [
            stat(t('home_s1'), t('home_s1l')),
            stat(t('home_s2'), t('home_s2l')),
            stat(t('home_s3'), t('home_s3l'))
          ])
        ]),
        h('div', { class: 'hero__side' }, [previewCard()])
      ]),
      h('div', { class: 'wrap' }, searchCard)
    ]);

    function stat(v, l) {
      return h('div', { class: 'stat' }, [
        h('strong', { class: 'stat__v', text: v }),
        h('span', { class: 'stat__l', text: l })
      ]);
    }

    /* ---- preview card (мини-демо чата) ---- */
    function previewCard() {
      return h('div', { class: 'preview reveal d3' }, [
        h('div', { class: 'preview__bar' }, [
          h('span', { class: 'preview__dot' }), h('span', { class: 'preview__dot' }), h('span', { class: 'preview__dot' }),
          h('span', { class: 'preview__title', text: PP.i18n.t('ch_ai_on') })
        ]),
        h('div', { class: 'preview__body stack gap-3' }, [
          h('div', { class: 'bubble bubble--in' }, [
            h('div', { text: 'Merhaba! Yarın sabah bir koltuk boş mu?' }),
            h('div', { class: 'bubble__tr', text: 'Здравствуйте! Место на завтра утром свободно?' })
          ]),
          h('div', { class: 'bubble bubble--out' }, [
            h('div', { text: 'Да, есть два места. Выезжаю в 8:00.' }),
            h('div', { class: 'bubble__tr', text: 'Evet, iki koltuk var. 08:00\'de çıkıyorum.' })
          ]),
          h('div', { class: 'row gap-2 center', style: { paddingTop: '4px' } }, [
            ui.badge('🇹🇷 → 🇷🇺', 'brand', 'translate'),
            ui.badge(t('ai_ai'), 'mint', 'sparkle')
          ])
        ])
      ]);
    }

    /* ---- how it works ---- */
    var how = h('section', { class: 'wrap section' }, [
      sectionHead(t('home_how_t'), t('home_how_s')),
      h('div', { class: 'steps' }, [
        step(1, 'sparkle', t('home_h1t'), t('home_h1d')),
        step(2, 'route', t('home_h2t'), t('home_h2d')),
        step(3, 'translate', t('home_h3t'), t('home_h3d'))
      ])
    ]);
    function step(n, ic, title, desc) {
      return h('div', { class: 'step card card--pad card--hover' }, [
        h('div', { class: 'step__top' }, [
          h('div', { class: 'step__icon', html: icon(ic, 22) }),
          h('span', { class: 'step__n', text: '0' + n })
        ]),
        h('h3', { text: title, style: { marginTop: '18px' } }),
        h('p', { class: 'dim t-sm', text: desc, style: { marginTop: '8px' } })
      ]);
    }

    /* ---- features ---- */
    var feats = h('section', { class: 'wrap section' }, [
      sectionHead(t('home_feat_t'), t('home_feat_s')),
      h('div', { class: 'featgrid' }, [
        feat('sparkle', t('home_f1t'), t('home_f1d')),
        feat('translate', t('home_f2t'), t('home_f2d')),
        feat('star', t('home_f3t'), t('home_f3d')),
        feat('shield', t('home_f4t'), t('home_f4d')),
        feat('pin', t('home_f5t'), t('home_f5d')),
        feat('globe', t('home_f6t'), t('home_f6d'))
      ])
    ]);
    function feat(ic, title, desc) {
      return h('div', { class: 'feat' }, [
        h('div', { class: 'feat__icon', html: icon(ic, 20) }),
        h('div', { class: 'stack gap-1' }, [
          h('strong', { text: title }),
          h('span', { class: 'dim t-sm', text: desc })
        ])
      ]);
    }

    function sectionHead(title, sub) {
      return h('div', { class: 'sechead' }, [
        h('h2', { text: title }),
        h('p', { class: 't-lead', text: sub })
      ]);
    }

    /* ---- final CTA ---- */
    var cta = h('section', { class: 'wrap section' }, [
      h('div', { class: 'ctaband' }, [
        h('div', { class: 'ctaband__mesh' }),
        h('div', { class: 'ctaband__inner' }, [
          h('div', { class: 'stack gap-2' }, [
            h('h2', { text: t('home_cta_t'), style: { color: '#fff' } }),
            h('p', { text: t('home_cta_s'), style: { color: 'rgba(255,255,255,.78)' } })
          ]),
          h('div', { class: 'row gap-3 wrapflex' }, [
            h('a', { class: 'btn btn--lg', href: '#/publish', style: { background: '#fff' } }, [
              h('span', { html: icon('plus', 18), style: { display: 'flex' } }),
              h('span', { text: t('nav_publish') })
            ]),
            h('a', { class: 'btn btn--lg btn--ghost', href: '#/search', style: { color: '#fff', border: '1px solid rgba(255,255,255,.35)' } },
              t('nav_find'))
          ])
        ])
      ])
    ]);

    root.appendChild(hero);
    root.appendChild(how);
    root.appendChild(feats);
    root.appendChild(cta);
  };
})(window.PP);
