/* ==========================================================
   Store — data access layer
   Единая точка доступа к данным. Сейчас за ней стоит
   localStorage-адаптер; чтобы перейти на Supabase/Firebase,
   достаточно заменить объект `adapter` — API остаётся тем же.
   ========================================================== */
(function (PP) {
  'use strict';
  var U = PP.util;
  var NS = 'pp.db.v1';
  var SESSION = 'pp.session';
  var SETTINGS = 'pp.settings';

  var COLLECTIONS = ['users', 'rides', 'bookings', 'messages', 'ratings'];

  /* ---------- low-level adapter (swap me for Supabase) ---------- */
  var memory = null;

  var adapter = {
    load: function () {
      if (memory) return memory;
      var raw = null;
      try { raw = localStorage.getItem(NS); } catch (e) {}
      if (raw) {
        try { memory = JSON.parse(raw); } catch (e) { memory = null; }
      }
      if (!memory || !memory.users) memory = emptyDb();
      COLLECTIONS.forEach(function (c) { if (!Array.isArray(memory[c])) memory[c] = []; });
      return memory;
    },
    save: function () {
      try { localStorage.setItem(NS, JSON.stringify(memory)); } catch (e) {}
      emit();
    },
    wipe: function () {
      memory = null;
      try { localStorage.removeItem(NS); } catch (e) {}
    }
  };

  function emptyDb() {
    var db = { _v: 1 };
    COLLECTIONS.forEach(function (c) { db[c] = []; });
    return db;
  }

  /* ---------- reactive ---------- */
  var subs = [];
  function subscribe(fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; }
  function emit() { subs.slice().forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }

  /* ---------- generic ---------- */
  function all(col) { return adapter.load()[col].slice(); }
  function find(col, id) {
    var list = adapter.load()[col];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function where(col, pred) { return adapter.load()[col].filter(pred); }
  function insert(col, obj) {
    var db = adapter.load();
    if (!obj.id) obj.id = U.uid(col.slice(0, 2));
    if (!obj.createdAt) obj.createdAt = new Date().toISOString();
    db[col].push(obj);
    adapter.save();
    return obj;
  }
  function update(col, id, patch) {
    var row = find(col, id);
    if (!row) return null;
    Object.assign(row, patch);
    adapter.save();
    return row;
  }
  function remove(col, id) {
    var db = adapter.load();
    db[col] = db[col].filter(function (r) { return r.id !== id; });
    adapter.save();
  }

  /* ---------- session ---------- */
  function currentUserId() {
    try { return localStorage.getItem(SESSION) || null; } catch (e) { return null; }
  }
  function currentUser() {
    var id = currentUserId();
    return id ? find('users', id) : null;
  }
  function signIn(userId) {
    try { localStorage.setItem(SESSION, userId); } catch (e) {}
    emit();
    return find('users', userId);
  }
  function signOut() {
    try { localStorage.removeItem(SESSION); } catch (e) {}
    emit();
  }

  /* ---------- settings (AI provider etc.) ---------- */
  var defaultSettings = {
    provider: 'off',           // off | groq | gemini
    apiKey: '',
    model: '',
    autoTranslate: true
  };
  function getSettings() {
    var raw = null;
    try { raw = localStorage.getItem(SETTINGS); } catch (e) {}
    var s = defaultSettings;
    if (raw) { try { s = Object.assign({}, defaultSettings, JSON.parse(raw)); } catch (e) {} }
    return s;
  }
  function setSettings(patch) {
    var s = Object.assign({}, getSettings(), patch);
    try { localStorage.setItem(SETTINGS, JSON.stringify(s)); } catch (e) {}
    emit();
    return s;
  }

  /* ---------- domain helpers ---------- */
  function userStats(userId) {
    var rs = where('ratings', function (r) { return r.toUserId === userId; });
    var sum = rs.reduce(function (a, r) { return a + r.stars; }, 0);
    var asDriver = where('rides', function (r) { return r.driverId === userId && r.status === 'completed'; }).length;
    var asPassenger = where('bookings', function (b) {
      return b.passengerId === userId && b.status === 'completed';
    }).length;
    return {
      count: rs.length,
      avg: rs.length ? U.round1(sum / rs.length) : 0,
      trips: asDriver + asPassenger,
      asDriver: asDriver,
      asPassenger: asPassenger,
      reviews: rs.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
    };
  }

  function rideSeatsTaken(rideId) {
    return where('bookings', function (b) {
      return b.rideId === rideId && (b.status === 'accepted' || b.status === 'completed');
    }).reduce(function (a, b) { return a + (b.seats || 1); }, 0);
  }
  function rideSeatsLeft(ride) {
    return Math.max(0, (ride.seats || 0) - rideSeatsTaken(ride.id));
  }

  function threadId(rideId, passengerId) { return rideId + '::' + passengerId; }

  function threadsFor(userId) {
    var out = [];
    var seen = {};
    where('bookings', function (b) { return true; }).forEach(function (b) {
      var ride = find('rides', b.rideId);
      if (!ride) return;
      if (b.passengerId !== userId && ride.driverId !== userId) return;
      var tid = threadId(b.rideId, b.passengerId);
      if (seen[tid]) return;
      seen[tid] = true;
      var other = b.passengerId === userId ? ride.driverId : b.passengerId;
      var msgs = where('messages', function (m) { return m.threadId === tid; })
        .sort(function (a, b2) { return new Date(a.createdAt) - new Date(b2.createdAt); });
      out.push({
        id: tid, rideId: b.rideId, bookingId: b.id,
        ride: ride, booking: b,
        otherId: other, other: find('users', other),
        messages: msgs,
        last: msgs.length ? msgs[msgs.length - 1] : null
      });
    });
    out.sort(function (a, b) {
      var ta = a.last ? new Date(a.last.createdAt) : new Date(a.ride.createdAt || 0);
      var tb = b.last ? new Date(b.last.createdAt) : new Date(b.ride.createdAt || 0);
      return tb - ta;
    });
    return out;
  }

  /* ---------- прочитанные переписки ----------
     Отметки хранятся отдельно от данных: { userId: { threadId: ISO-время } } */
  var READS = 'pp.reads';
  function allReads() {
    try { return JSON.parse(localStorage.getItem(READS) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function markRead(userId, tid) {
    if (!userId || !tid) return;
    var r = allReads();
    r[userId] = r[userId] || {};
    r[userId][tid] = new Date().toISOString();
    try { localStorage.setItem(READS, JSON.stringify(r)); } catch (e) {}
    emit();
  }
  function isUnread(userId, th) {
    if (!th || !th.last) return false;
    if (th.last.senderId === userId) return false;
    var r = allReads()[userId] || {};
    var seenAt = r[th.id];
    if (!seenAt) return true;
    return new Date(th.last.createdAt) > new Date(seenAt);
  }
  function unreadCount(userId) {
    if (!userId) return 0;
    return threadsFor(userId).filter(function (th) { return isUnread(userId, th); }).length;
  }

  /* ---------- каскадные удаления ----------
     Поездку и бронь нельзя удалить «наполовину»: вместе с ними уходят
     связанные брони и сообщения, иначе в чатах остаются осиротевшие ветки. */
  function deleteRide(rideId) {
    var db = adapter.load();
    var bookings = db.bookings.filter(function (b) { return b.rideId === rideId; });
    var tids = bookings.map(function (b) { return threadId(rideId, b.passengerId); });
    db.messages = db.messages.filter(function (m) { return tids.indexOf(m.threadId) < 0; });
    db.bookings = db.bookings.filter(function (b) { return b.rideId !== rideId; });
    db.rides = db.rides.filter(function (r) { return r.id !== rideId; });
    adapter.save();
  }
  function cancelBooking(bookingId) {
    var db = adapter.load();
    var bk = null;
    db.bookings.forEach(function (b) { if (b.id === bookingId) bk = b; });
    if (!bk) return;
    var tid = threadId(bk.rideId, bk.passengerId);
    db.messages = db.messages.filter(function (m) { return m.threadId !== tid; });
    db.bookings = db.bookings.filter(function (b) { return b.id !== bookingId; });
    adapter.save();
  }

  PP.store = {
    COLLECTIONS: COLLECTIONS,
    all: all, find: find, where: where, insert: insert, update: update, remove: remove,
    subscribe: subscribe, emit: emit,
    currentUser: currentUser, currentUserId: currentUserId, signIn: signIn, signOut: signOut,
    getSettings: getSettings, setSettings: setSettings,
    userStats: userStats, rideSeatsLeft: rideSeatsLeft, rideSeatsTaken: rideSeatsTaken,
    threadId: threadId, threadsFor: threadsFor, unreadCount: unreadCount,
    markRead: markRead, isUnread: isUnread,
    deleteRide: deleteRide, cancelBooking: cancelBooking,
    _adapter: adapter, _empty: emptyDb,
    isEmpty: function () { return adapter.load().users.length === 0; },
    replaceAll: function (db) {
      memory = Object.assign(emptyDb(), db);
      adapter.save();
    },
    wipe: function () { adapter.wipe(); }
  };
})(window.PP);
