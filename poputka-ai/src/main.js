/* ============ Точка входа ============ */
(function (PP) {
  'use strict';

  function boot() {
    PP.i18n.set(PP.i18n.detect(), true);
    PP.seed.ensure();

    PP.i18n.onChange(function () { PP.shell.render(); });
    window.addEventListener('hashchange', function () { PP.shell.render(); });

    PP.shell.render();

    /* глобальный перехват ошибок — чтобы демонстрация не «падала» молча */
    window.addEventListener('error', function (e) {
      console.error('[Попутка ИИ]', e.message);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();
})(window.PP);
