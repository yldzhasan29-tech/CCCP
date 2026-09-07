/* ==========================================================
   AI layer
   • parseRide()  — свободный текст → структурированное объявление
   • translate()  — перевод сообщений чата
   Оба метода работают с бесплатными провайдерами (Groq / Gemini).
   Если ключа нет или сеть недоступна — включается офлайн-режим:
   встроенный парсер и словарь фраз. Демонстрация не ломается.
   ========================================================== */
(function (PP) {
  'use strict';
  var U = PP.util;

  var MODELS = {
    groq:   ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-20b'],
    gemini: ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']
  };
  var LANG_NAME = {
    ru:'Russian', tr:'Turkish', en:'English', zh:'Chinese (Simplified)',
    es:'Spanish (Spain)', 'es-419':'Latin American Spanish', pt:'Portuguese', ar:'Arabic'
  };

  function cfg() {
    var s = PP.store.getSettings();
    return {
      provider: s.provider || 'off',
      key: (s.apiKey || '').trim(),
      model: s.model || (MODELS[s.provider] ? MODELS[s.provider][0] : ''),
      autoTranslate: s.autoTranslate !== false
    };
  }
  function enabled() {
    var c = cfg();
    return c.provider !== 'off' && !!c.key;
  }

  function fetchJSON(url, opts, timeoutMs) {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, timeoutMs || 18000);
    opts = opts || {};
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(url, opts).then(function (r) {
      clearTimeout(to);
      return r.text().then(function (txt) {
        var body = null;
        try { body = JSON.parse(txt); } catch (e) {}
        if (!r.ok) {
          var msg = (body && (body.error && (body.error.message || body.error)) ) || ('HTTP ' + r.status);
          throw new Error(typeof msg === 'string' ? msg : ('HTTP ' + r.status));
        }
        return body;
      });
    }, function (e) { clearTimeout(to); throw e; });
  }

  /* --------- single completion entry point --------- */
  function complete(systemPrompt, userPrompt, opts) {
    var c = cfg();
    if (!enabled()) return Promise.reject(new Error('no-provider'));
    opts = opts || {};
    if (c.provider === 'groq') {
      return fetchJSON('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + c.key },
        body: JSON.stringify({
          model: c.model || MODELS.groq[0],
          temperature: opts.temperature === undefined ? 0.1 : opts.temperature,
          max_tokens: opts.maxTokens || 400,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      }, opts.timeout).then(function (b) {
        return (b && b.choices && b.choices[0] && b.choices[0].message &&
                b.choices[0].message.content) || '';
      });
    }
    if (c.provider === 'gemini') {
      var m = c.model || MODELS.gemini[0];
      var url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
                encodeURIComponent(m) + ':generateContent?key=' + encodeURIComponent(c.key);
      return fetchJSON(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: opts.temperature === undefined ? 0.1 : opts.temperature,
            maxOutputTokens: opts.maxTokens || 400
          }
        })
      }, opts.timeout).then(function (b) {
        var c0 = b && b.candidates && b.candidates[0];
        var parts = c0 && c0.content && c0.content.parts;
        return (parts && parts.map(function (p) { return p.text || ''; }).join('')) || '';
      });
    }
    return Promise.reject(new Error('unknown-provider'));
  }

  function extractJSON(raw) {
    if (!raw) return null;
    var s = String(raw).trim();
    s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b < 0) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  }

  /* ==========================================================
     1) Разбор объявления
     ========================================================== */
  function placeIdList() {
    return PP.places.all.map(function (p) { return p.id + ' = ' + p.ru + ' / ' + p.lat_name; }).join('\n');
  }

  function parseRide(text) {
    var offline = offlineParse(text);
    if (!enabled()) return Promise.resolve(offline);

    var sys =
      'You extract structured ride-share listings from free text written by university students in Yekaterinburg. ' +
      'Answer with STRICT JSON only, no prose, no code fences.\n' +
      'Schema: {"fromId":string|null,"toId":string|null,"time":"HH:MM"|null,"dayOffset":0|1|2,' +
      '"seats":number|null,"price":number|null,"note":string|null}\n' +
      'fromId/toId MUST be one of these ids:\n' + placeIdList() + '\n' +
      'dayOffset: 0 = today, 1 = tomorrow, 2 = day after tomorrow. ' +
      'price is in roubles per seat, 0 when the ride is free. ' +
      'note = any extra remark for passengers, in the language of the input. ' +
      'If a value is not stated, use null. The destination is usually the campus.';

    return complete(sys, String(text || ''), { maxTokens: 300, timeout: 16000 })
      .then(function (raw) {
        var j = extractJSON(raw);
        if (!j) return offline;
        var out = {
          fromId: PP.places.byId[j.fromId] ? j.fromId : offline.fromId,
          toId:   PP.places.byId[j.toId]   ? j.toId   : offline.toId,
          time:   /^\d{1,2}:\d{2}$/.test(j.time || '') ? normTime(j.time) : offline.time,
          dayOffset: [0, 1, 2].indexOf(j.dayOffset) >= 0 ? j.dayOffset : offline.dayOffset,
          seats:  isFinite(j.seats) && j.seats > 0 ? Math.min(6, Math.round(j.seats)) : offline.seats,
          price:  isFinite(j.price) && j.price >= 0 ? Math.round(j.price) : offline.price,
          note:   (j.note && String(j.note).trim()) || offline.note,
          engine: 'ai'
        };
        if (out.fromId === out.toId) out.toId = offline.toId !== out.fromId ? offline.toId : 'campus';
        return out;
      })
      .catch(function () { offline.failed = true; return offline; });
  }

  function normTime(s) {
    var p = String(s).split(':');
    return U.pad2(U.clamp(parseInt(p[0], 10) || 0, 0, 23)) + ':' + U.pad2(U.clamp(parseInt(p[1], 10) || 0, 0, 59));
  }

  /* --------- offline natural-language parser --------- */
  var AR_DIGITS = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
                    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
  function normDigits(s) {
    return String(s || '').replace(/[٠-٩۰-۹]/g, function (d) { return AR_DIGITS[d] || d; });
  }

  var WORD_NUM = {
    'один':1,'одно':1,'одного':1,'двоих':2,'двух':2,'два':2,'две':2,'трёх':3,'троих':3,'три':3,'четверых':4,'четыре':4,
    'bir':1,'iki':2,'üç':3,'uc':3,'dört':4,'dort':4,
    'one':1,'two':2,'three':3,'four':4,
    'uno':1,'una':1,'dos':2,'tres':3,'cuatro':4,
    'um':1,'uma':1,'dois':2,'duas':2,'três':3,'tres':3,'quatro':4,
    '一':1,'两':2,'二':2,'三':3,'四':4,
    'واحد':1,'اثنين':2,'اثنان':2,'ثلاثة':3,'أربعة':4
  };
  var SEAT_WORDS = /(мест|место|места|koltuk|kişi|kisi|seat|seats|plaza|plazas|asiento|asientos|cupo|lugar|lugares|座位|个人|مقعد|مقاعد|شخص)/i;
  var TOMORROW = /(завтра|yarın|yarin|tomorrow|mañana|manana|amanhã|amanha|明天|غدا|غدًا|بكرة)/i;
  var AFTER_TOMORROW = /(послезавтра|öbür gün|obur gun|day after tomorrow|pasado mañana|depois de amanhã|后天|بعد غد)/i;
  var FREE_WORDS = /(бесплатн|ücretsiz|ucretsiz|free|gratis|grátis|gratuito|免费|مجان)/i;
  var PRICE_RE = /(\d{2,5})\s*(₽|руб|рубл|rub|ruble|rublo|rublos|卢布|روبل)/i;

  function offlineParse(raw) {
    var text = normDigits(raw || '');
    var low = text.toLowerCase();

    /* time */
    var time = null;
    var m = low.match(/(\d{1,2})\s*[:.：]\s*(\d{2})/);
    if (m) {
      time = U.pad2(U.clamp(+m[1], 0, 23)) + ':' + U.pad2(U.clamp(+m[2], 0, 59));
    } else {
      var m2 = low.match(/(?:в|saat|at|a las|às|as|在|الساعة)\s*(\d{1,2})(?!\d)/);
      if (m2) time = U.pad2(U.clamp(+m2[1], 0, 23)) + ':00';
    }

    /* day */
    var dayOffset = 0;
    if (AFTER_TOMORROW.test(low)) dayOffset = 2;
    else if (TOMORROW.test(low)) dayOffset = 1;
    else if (time) {
      var now = new Date();
      var mins = (+time.split(':')[0]) * 60 + (+time.split(':')[1]);
      if (mins <= now.getHours() * 60 + now.getMinutes() + 10) dayOffset = 1;
    }

    /* seats */
    var seats = null;
    var sm = low.match(new RegExp('(\\d)\\s*[^\\d]{0,12}?' + SEAT_WORDS.source, 'i'));
    if (sm) seats = +sm[1];
    if (!seats) {
      var sm2 = low.match(new RegExp(SEAT_WORDS.source + '[^\\d]{0,12}?(\\d)', 'i'));
      if (sm2) seats = +sm2[2] || +sm2[1];
    }
    if (!seats) {
      for (var w in WORD_NUM) {
        if (low.indexOf(w) >= 0 && /(могу|взять|беру|alabilir|alırım|take|room|llevo|levo|带|آخذ|можно)/i.test(low)) {
          seats = WORD_NUM[w]; break;
        }
      }
    }
    if (!seats) seats = 2;
    seats = U.clamp(seats, 1, 6);

    /* price */
    var price = null;
    var pm = text.match(PRICE_RE);
    if (pm) price = +pm[1];
    else if (FREE_WORDS.test(low)) price = 0;

    /* places */
    var found = PP.places.findAllInText(text);
    var fromId = null, toId = null;
    if (found.length >= 2) { fromId = found[0].id; toId = found[1].id; }
    else if (found.length === 1) {
      if (found[0].id === 'campus') { toId = 'campus'; fromId = null; }
      else { fromId = found[0].id; toId = 'campus'; }
    }
    if (!toId) toId = 'campus';
    if (!fromId) fromId = (toId === 'campus') ? 'uralmash' : 'campus';
    if (fromId === toId) toId = fromId === 'campus' ? 'pl1905' : 'campus';

    return {
      fromId: fromId, toId: toId,
      time: time || '08:00',
      dayOffset: dayOffset,
      seats: seats,
      price: price === null ? 0 : price,
      note: '',
      engine: 'offline'
    };
  }

  /* ==========================================================
     2) Перевод сообщений
     ========================================================== */
  var PHRASES = [
    { ru:'здравствуйте! место ещё свободно?', tr:'merhaba! koltuk hâlâ boş mu?', en:'hello! is the seat still free?',
      zh:'你好！座位还有吗？', es:'¡hola! ¿sigue libre la plaza?', 'es-419':'¡hola! ¿sigue libre el asiento?',
      pt:'olá! o lugar ainda está livre?', ar:'مرحبًا! هل المقعد ما زال متاحًا؟' },
    { ru:'где именно вас забрать?', tr:'sizi tam olarak nereden alayım?', en:'where exactly should i pick you up?',
      zh:'具体在哪里接我？', es:'¿dónde exactamente te recojo?', 'es-419':'¿dónde exactamente te recojo?',
      pt:'onde exatamente te apanho?', ar:'من أين أقلّك بالضبط؟' },
    { ru:'буду на месте вовремя', tr:'zamanında orada olacağım', en:'i will be there on time',
      zh:'我会准时到', es:'llegaré puntual', 'es-419':'voy a llegar puntual',
      pt:'estarei lá a horas', ar:'سأكون هناك في الموعد' },
    { ru:'спасибо, до встречи!', tr:'teşekkürler, görüşmek üzere!', en:'thanks, see you!',
      zh:'谢谢，回头见！', es:'¡gracias, hasta luego!', 'es-419':'¡gracias, nos vemos!',
      pt:'obrigado, até já!', ar:'شكرًا، إلى اللقاء!' },
    { ru:'да', tr:'evet', en:'yes', zh:'是的', es:'sí', 'es-419':'sí', pt:'sim', ar:'نعم' },
    { ru:'нет', tr:'hayır', en:'no', zh:'不', es:'no', 'es-419':'no', pt:'não', ar:'لا' },
    { ru:'хорошо', tr:'tamam', en:'ok', zh:'好的', es:'de acuerdo', 'es-419':'dale', pt:'está bem', ar:'حسنًا' },
    { ru:'спасибо', tr:'teşekkürler', en:'thank you', zh:'谢谢', es:'gracias', 'es-419':'gracias', pt:'obrigado', ar:'شكرًا' },
    { ru:'здравствуйте', tr:'merhaba', en:'hello', zh:'你好', es:'hola', 'es-419':'hola', pt:'olá', ar:'مرحبًا' },
    { ru:'я опаздываю на 5 минут', tr:'5 dakika geç kalıyorum', en:"i'm running 5 minutes late",
      zh:'我要晚到五分钟', es:'llego 5 minutos tarde', 'es-419':'voy 5 minutos tarde',
      pt:'estou 5 minutos atrasado', ar:'سأتأخر خمس دقائق' },
    { ru:'я уже на месте', tr:'ben geldim', en:'i am already here', zh:'我已经到了',
      es:'ya estoy aquí', 'es-419':'ya llegué', pt:'já cheguei', ar:'أنا هنا بالفعل' },
    { ru:'сколько стоит поездка?', tr:'yolculuk ne kadar?', en:'how much is the ride?',
      zh:'这趟多少钱？', es:'¿cuánto cuesta el viaje?', 'es-419':'¿cuánto sale el viaje?',
      pt:'quanto custa a viagem?', ar:'كم تكلفة المشوار؟' },
    { ru:'можно взять чемодан?', tr:'valiz alabilir miyim?', en:'can i bring a suitcase?',
      zh:'可以带行李箱吗？', es:'¿puedo llevar una maleta?', 'es-419':'¿puedo llevar una maleta?',
      pt:'posso levar uma mala?', ar:'هل يمكنني إحضار حقيبة؟' },
    { ru:'до завтра!', tr:'yarın görüşürüz!', en:'see you tomorrow!', zh:'明天见！',
      es:'¡hasta mañana!', 'es-419':'¡hasta mañana!', pt:'até amanhã!', ar:'إلى الغد!' }
  ];

  function normPhrase(s) {
    return String(s || '').toLowerCase().replace(/[.!?¿¡,;:"'`«»()\[\]{}…]/g, '').replace(/\s+/g, ' ').trim();
  }
  var PHRASE_INDEX = null;
  function buildIndex() {
    if (PHRASE_INDEX) return PHRASE_INDEX;
    PHRASE_INDEX = {};
    PHRASES.forEach(function (row, i) {
      for (var k in row) if (k !== 'engine') PHRASE_INDEX[normPhrase(row[k])] = i;
    });
    return PHRASE_INDEX;
  }

  function offlineTranslate(text, target) {
    var idx = buildIndex();
    var n = normPhrase(text);
    if (idx[n] !== undefined) {
      var row = PHRASES[idx[n]];
      if (row[target]) return { text: row[target], engine: 'offline' };
    }
    /* partial: longest known phrase contained in the message */
    var bestI = -1, bestLen = 0;
    for (var key in idx) {
      if (key.length > 3 && n.indexOf(key) >= 0 && key.length > bestLen) { bestLen = key.length; bestI = idx[key]; }
    }
    if (bestI >= 0 && PHRASES[bestI][target]) {
      return { text: PHRASES[bestI][target], engine: 'offline', partial: true };
    }
    return { text: null, engine: 'none' };
  }

  function translate(text, srcLang, target) {
    if (!text || !target || srcLang === target) return Promise.resolve({ text: null, engine: 'same' });
    if (!enabled()) return Promise.resolve(offlineTranslate(text, target));

    var sys = 'You are a translation engine inside a student ride-sharing chat. ' +
      'Translate the user message into ' + (LANG_NAME[target] || target) + '. ' +
      'Keep it natural and short, preserve emoji, times and place names. ' +
      'Return ONLY the translation, with no quotes, no notes, no explanation.';
    return complete(sys, String(text), { temperature: 0.2, maxTokens: 260, timeout: 15000 })
      .then(function (out) {
        out = String(out || '').trim().replace(/^["'«»]+|["'«»]+$/g, '');
        if (!out) return offlineTranslate(text, target);
        return { text: out, engine: 'ai' };
      })
      .catch(function () {
        var off = offlineTranslate(text, target);
        off.failed = true;
        return off;
      });
  }

  /* ==========================================================
     3) Проверка ключа
     ========================================================== */
  function testKey() {
    return complete('You reply with a single word.', 'Reply with the word OK.',
      { maxTokens: 8, timeout: 14000 })
      .then(function (out) {
        if (!String(out || '').trim()) throw new Error('empty response');
        return true;
      });
  }

  PP.ai = {
    MODELS: MODELS, LANG_NAME: LANG_NAME,
    cfg: cfg, enabled: enabled,
    parseRide: parseRide, offlineParse: offlineParse,
    translate: translate, offlineTranslate: offlineTranslate,
    testKey: testKey
  };
})(window.PP);
