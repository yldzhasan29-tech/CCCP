/* ==========================================================
   Matching engine
   score = 0.50·маршрут + 0.36·время + 0.14·рейтинг
   Объяснение «почему эта поездка» строится по шаблонам,
   без обращения к LLM — быстро, дёшево и предсказуемо.
   ========================================================== */
(function (PP) {
  'use strict';
  var U = PP.util, S = PP.store, P = PP.places;

  var W_ROUTE = 0.50, W_TIME = 0.36, W_RATING = 0.14;
  var LEG_KM_ZERO = 9;   /* отклонение, при котором участок даёт 0 */

  function legScore(a, b) {
    var d = U.haversine(a, b);
    return { s: U.clamp(1 - d / LEG_KM_ZERO, 0, 1), km: d };
  }

  function scoreRide(ride, q) {
    var from = P.byId[ride.fromId], to = P.byId[ride.toId];
    var qFrom = P.byId[q.fromId], qTo = P.byId[q.toId];
    if (!from || !to || !qFrom || !qTo) return null;

    var lf = legScore(qFrom, from), lt = legScore(qTo, to);
    var route = (lf.s + lt.s) / 2;

    var dt = Math.abs(U.minutesOfDay(ride.departAt) - q.minutes);
    var flex = q.flex || 15;
    var time;
    if (dt <= flex) time = 1 - 0.35 * (dt / Math.max(1, flex));
    else time = Math.max(0, 0.65 * (1 - (dt - flex) / 75));

    var st = S.userStats(ride.driverId);
    var rating = st.count ? U.clamp((st.avg - 3) / 2, 0, 1) : 0.6;

    var total = W_ROUTE * route + W_TIME * time + W_RATING * rating;

    return {
      ride: ride,
      score: total,
      pct: Math.round(U.clamp(total, 0, 1) * 100),
      routePct: Math.round(route * 100),
      dt: dt,
      seatsLeft: S.rideSeatsLeft(ride),
      driver: S.find('users', ride.driverId),
      stats: st,
      sameFrom: ride.fromId === q.fromId,
      sameTo: ride.toId === q.toId,
      kmFrom: U.round1(lf.km), kmTo: U.round1(lt.km)
    };
  }

  /* q = {fromId,toId,dayOffset,minutes,flex,seats,lang} */
  function search(q) {
    var now = Date.now();
    var rides = S.where('rides', function (r) {
      if (r.status !== 'open') return false;
      if (U.dayOffset(r.departAt) !== q.dayOffset) return false;
      if (new Date(r.departAt).getTime() < now - 30 * 60000) return false;
      if (q.excludeDriver && r.driverId === q.excludeDriver) return false;
      return S.rideSeatsLeft(r) >= (q.seats || 1);
    });

    var out = [];
    rides.forEach(function (r) {
      var m = scoreRide(r, q);
      if (m && m.score > 0.12) out.push(m);
    });

    var sort = q.sort || 'match';
    out.sort(function (a, b) {
      if (sort === 'time') return new Date(a.ride.departAt) - new Date(b.ride.departAt);
      if (sort === 'rating') return (b.stats.avg || 0) - (a.stats.avg || 0);
      if (sort === 'price') return (a.ride.price || 0) - (b.ride.price || 0);
      return b.score - a.score;
    });
    return out;
  }

  /* Шаблонные объяснения — локализуются через i18n */
  function reasons(m, q) {
    var t = PP.i18n.t, out = [];

    if (m.dt === 0) out.push({ icon: 'clock', text: t('m_time_exact') });
    else if (m.dt <= 10) out.push({ icon: 'clock', text: t('m_time_close', { n: m.dt }) });
    else out.push({ icon: 'clock', text: t('m_time_window', { n: m.dt }) });

    if (m.sameFrom && m.sameTo) out.push({ icon: 'route', text: t('m_route_same') });
    else if (m.routePct >= 55) out.push({ icon: 'route', text: t('m_route_near', { n: m.routePct }) });
    else out.push({ icon: 'route', text: t('m_route_far') });

    if (m.stats.count) out.push({ icon: 'star', text: t('m_rating', { n: m.stats.avg }) });
    else out.push({ icon: 'star', text: t('m_new_driver') });

    if (q && q.lang && m.driver && m.driver.lang === q.lang) {
      out.push({ icon: 'globe', text: t('m_lang') });
    } else {
      out.push({ icon: 'users', text: t('m_seats', { n: m.seatsLeft }) });
    }
    return out;
  }

  PP.matching = { search: search, scoreRide: scoreRide, reasons: reasons };
})(window.PP);
