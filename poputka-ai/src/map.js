/* ==========================================================
   Лёгкая карта на тайлах OpenStreetMap.
   Без внешних библиотек: проекция Web Mercator, тайлы 256px,
   перетаскивание, зум. Если тайлы не загрузились (нет сети) —
   аккуратно переключается на схематичный фон, маршрут остаётся
   виден. Демонстрация не ломается офлайн.
   ========================================================== */
(function (PP) {
  'use strict';
  var U = PP.util;
  var TILE = 256;
  var TPL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  function project(lat, lng, z) {
    var s = TILE * Math.pow(2, z);
    var x = (lng + 180) / 360 * s;
    var sy = Math.sin(lat * Math.PI / 180);
    sy = Math.max(-0.9999, Math.min(0.9999, sy));
    var y = (0.5 - Math.log((1 + sy) / (1 - sy)) / (4 * Math.PI)) * s;
    return { x: x, y: y };
  }

  function create(el, opts) {
    opts = opts || {};
    var points = (opts.points || []).filter(function (p) { return p && isFinite(p.lat) && isFinite(p.lng); });
    var state = { z: opts.zoom || 12, cx: 0, cy: 0, ok: true, failed: 0, loaded: 0 };

    U.clear(el);
    el.classList.add('map');
    var tiles = document.createElement('div'); tiles.className = 'map__tiles';
    var fallback = document.createElement('div'); fallback.className = 'map__fallback'; fallback.style.display = 'none';
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'map__svg');
    var pinLayer = document.createElement('div');
    pinLayer.style.cssText = 'position:absolute;inset:0;z-index:2;pointer-events:none';
    el.appendChild(fallback); el.appendChild(tiles); el.appendChild(svg); el.appendChild(pinLayer);

    if (opts.controls !== false) {
      var ctrl = document.createElement('div'); ctrl.className = 'map__ctrl';
      ['+', '−'].forEach(function (sym, i) {
        var b = document.createElement('button');
        b.className = 'map__btn'; b.type = 'button'; b.textContent = sym;
        b.setAttribute('aria-label', i === 0 ? 'Zoom in' : 'Zoom out');
        b.addEventListener('click', function (e) {
          e.preventDefault();
          setZoom(state.z + (i === 0 ? 1 : -1));
        });
        ctrl.appendChild(b);
      });
      el.appendChild(ctrl);
      var attr = document.createElement('div');
      attr.className = 'map__attr'; attr.textContent = '© OpenStreetMap';
      el.appendChild(attr);
    }

    function size() {
      return { w: el.clientWidth || 600, h: el.clientHeight || 320 };
    }

    function fit() {
      var s = size();
      if (!points.length) {
        var c = project(56.83, 60.62, state.z);
        state.cx = c.x; state.cy = c.y; return;
      }
      if (points.length === 1) {
        var p1 = project(points[0].lat, points[0].lng, state.z);
        state.cx = p1.x; state.cy = p1.y; return;
      }
      var z = opts.zoom || 15;
      for (; z >= 8; z--) {
        var xs = [], ys = [];
        points.forEach(function (p) { var q = project(p.lat, p.lng, z); xs.push(q.x); ys.push(q.y); });
        var w = Math.max.apply(null, xs) - Math.min.apply(null, xs);
        var hgt = Math.max.apply(null, ys) - Math.min.apply(null, ys);
        if (w < s.w - 110 && hgt < s.h - 90) break;
      }
      state.z = U.clamp(z, 8, 17);
      var xs2 = [], ys2 = [];
      points.forEach(function (p) { var q = project(p.lat, p.lng, state.z); xs2.push(q.x); ys2.push(q.y); });
      state.cx = (Math.max.apply(null, xs2) + Math.min.apply(null, xs2)) / 2;
      state.cy = (Math.max.apply(null, ys2) + Math.min.apply(null, ys2)) / 2;
    }

    function setZoom(z) {
      z = U.clamp(z, 8, 17);
      if (z === state.z) return;
      var f = Math.pow(2, z - state.z);
      state.cx *= f; state.cy *= f; state.z = z;
      draw();
    }

    function draw() {
      var s = size();
      var left = state.cx - s.w / 2, top = state.cy - s.h / 2;

      /* tiles */
      var n = Math.pow(2, state.z);
      var x0 = Math.floor(left / TILE), x1 = Math.floor((left + s.w) / TILE);
      var y0 = Math.floor(top / TILE), y1 = Math.floor((top + s.h) / TILE);
      var frag = document.createDocumentFragment();
      var pending = 0;
      for (var ty = y0; ty <= y1; ty++) {
        if (ty < 0 || ty >= n) continue;
        for (var tx = x0; tx <= x1; tx++) {
          var wx = ((tx % n) + n) % n;
          var img = new Image();
          img.loading = 'eager';
          img.alt = '';
          img.style.left = (tx * TILE - left) + 'px';
          img.style.top = (ty * TILE - top) + 'px';
          img.src = TPL.replace('{z}', state.z).replace('{x}', wx).replace('{y}', ty);
          pending++;
          img.addEventListener('load', function () { state.loaded++; fallback.style.display = 'none'; });
          img.addEventListener('error', function () {
            state.failed++;
            this.style.visibility = 'hidden';
            if (state.loaded === 0) fallback.style.display = '';
          });
          frag.appendChild(img);
        }
      }
      U.clear(tiles);
      tiles.appendChild(frag);
      if (pending === 0) fallback.style.display = '';

      /* overlay */
      svg.setAttribute('viewBox', '0 0 ' + s.w + ' ' + s.h);
      U.clear(svg);
      U.clear(pinLayer);
      var pxs = points.map(function (p) {
        var q = project(p.lat, p.lng, state.z);
        return { x: q.x - left, y: q.y - top, p: p };
      });

      if (pxs.length > 1) {
        var d = 'M' + pxs.map(function (q) { return q.x.toFixed(1) + ' ' + q.y.toFixed(1); }).join(' L');
        var halo = document.createElementNS(svg.namespaceURI, 'path');
        halo.setAttribute('d', d);
        halo.setAttribute('fill', 'none');
        halo.setAttribute('stroke', 'rgba(255,255,255,.85)');
        halo.setAttribute('stroke-width', '9');
        halo.setAttribute('stroke-linecap', 'round');
        halo.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(halo);
        var line = document.createElementNS(svg.namespaceURI, 'path');
        line.setAttribute('d', d);
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', '#4B37E0');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('stroke-linejoin', 'round');
        line.setAttribute('stroke-dasharray', '1 11');
        line.setAttribute('stroke-dashoffset', '0');
        svg.appendChild(line);
        var solid = document.createElementNS(svg.namespaceURI, 'path');
        solid.setAttribute('d', d);
        solid.setAttribute('fill', 'none');
        solid.setAttribute('stroke', 'rgba(75,55,224,.35)');
        solid.setAttribute('stroke-width', '4');
        solid.setAttribute('stroke-linecap', 'round');
        svg.insertBefore(solid, line);
      }

      pxs.forEach(function (q, i) {
        var pin = document.createElement('div');
        pin.className = 'map__pin';
        pin.style.left = q.x + 'px';
        pin.style.top = q.y + 'px';
        var kind = q.p.kind || (i === 0 ? 'a' : (i === pxs.length - 1 ? 'b' : 'c'));
        pin.innerHTML = (q.p.label ? '<b>' + U.esc(q.p.label) + '</b>' : '') +
          '<span class="map__dot map__dot--' + kind + '"></span>';
        pinLayer.appendChild(pin);
      });
    }

    /* drag to pan */
    if (opts.interactive !== false) {
      var dragging = false, sx = 0, sy = 0, ocx = 0, ocy = 0;
      var onDown = function (e) {
        dragging = true; el.classList.add('is-drag');
        var pt = e.touches ? e.touches[0] : e;
        sx = pt.clientX; sy = pt.clientY; ocx = state.cx; ocy = state.cy;
      };
      var onMove = function (e) {
        if (!dragging) return;
        var pt = e.touches ? e.touches[0] : e;
        state.cx = ocx - (pt.clientX - sx);
        state.cy = ocy - (pt.clientY - sy);
        draw();
        if (e.cancelable) e.preventDefault();
      };
      var onUp = function () { dragging = false; el.classList.remove('is-drag'); };
      el.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      el.addEventListener('touchstart', onDown, { passive: true });
      el.addEventListener('touchmove', onMove, { passive: false });
      el.addEventListener('touchend', onUp);
    }

    fit();
    /* ждём, пока контейнер получит размеры */
    requestAnimationFrame(function () { fit(); draw(); });
    setTimeout(function () { fit(); draw(); }, 120);

    var ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(U.debounce(function () { draw(); }, 120));
      ro.observe(el);
    }
    return { redraw: draw, destroy: function () { if (ro) ro.disconnect(); } };
  }

  PP.map = { create: create, project: project };
})(window.PP);
