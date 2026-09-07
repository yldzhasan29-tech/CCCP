/* ==========================================================
   Points of interest — Екатеринбург / кампус Новокольцовский
   ========================================================== */
(function (PP) {
  'use strict';
  var PLACES = [
    { id:'campus',  ru:'Кампус Новокольцовский', lat:56.7486, lng:60.7912, lat_name:'Novokoltsovsky Campus', kind:'campus' },
    { id:'urfu19',  ru:'УрФУ, Мира 19 (Втузгородок)', lat:56.8430, lng:60.6540, lat_name:'UrFU Mira 19', kind:'uni' },
    { id:'pl1905',  ru:'Площадь 1905 года', lat:56.8370, lng:60.5975, lat_name:'1905 Square', kind:'metro' },
    { id:'uralmash',ru:'Уралмаш', lat:56.8886, lng:60.5980, lat_name:'Uralmash', kind:'metro' },
    { id:'elmash',  ru:'Эльмаш', lat:56.8760, lng:60.6360, lat_name:'Elmash', kind:'district' },
    { id:'botanica',ru:'Ботаническая', lat:56.7955, lng:60.6260, lat_name:'Botanicheskaya', kind:'metro' },
    { id:'chkalov', ru:'Чкаловская', lat:56.8065, lng:60.6070, lat_name:'Chkalovskaya', kind:'metro' },
    { id:'geolog',  ru:'Геологическая', lat:56.8228, lng:60.5990, lat_name:'Geologicheskaya', kind:'metro' },
    { id:'dinamo',  ru:'Динамо', lat:56.8480, lng:60.6010, lat_name:'Dinamo', kind:'metro' },
    { id:'zhbi',    ru:'ЖБИ', lat:56.8320, lng:60.6640, lat_name:'ZhBI', kind:'district' },
    { id:'akadem',  ru:'Академический', lat:56.7930, lng:60.5230, lat_name:'Akademicheskiy', kind:'district' },
    { id:'pioner',  ru:'Пионерский', lat:56.8620, lng:60.6120, lat_name:'Pionerskiy', kind:'district' },
    { id:'himmash', ru:'Химмаш', lat:56.7690, lng:60.6820, lat_name:'Khimmash', kind:'district' },
    { id:'sinkam',  ru:'Синие Камни', lat:56.8250, lng:60.6900, lat_name:'Siniye Kamni', kind:'district' },
    { id:'kolcovo', ru:'Аэропорт Кольцово', lat:56.7431, lng:60.8027, lat_name:'Koltsovo Airport', kind:'airport' },
    { id:'vokzal',  ru:'Ж/д вокзал', lat:56.8590, lng:60.6030, lat_name:'Railway station', kind:'station' },
    { id:'uktus',   ru:'Уктус', lat:56.7760, lng:60.6180, lat_name:'Uktus', kind:'district' },
    { id:'shirrech',ru:'Широкая Речка', lat:56.8180, lng:60.4880, lat_name:'Shirokaya Rechka', kind:'district' }
  ];

  var byId = {};
  PLACES.forEach(function (p) { byId[p.id] = p; });

  /* Aliases used by the offline natural-language parser */
  var ALIASES = {
    campus:  ['новокольцов','кампус','campus','novokol','نوفوكول','新科利佐沃','campüs','kampüs'],
    urfu19:  ['мира 19','втузгород','урфу','urfu','vtuzgorod','ürfü'],
    pl1905:  ['1905','площадь 1905','plaza','square','ساحة','广场','meydan'],
    uralmash:['уралмаш','uralmas','uralmash','أورالماش','乌拉尔马什'],
    elmash:  ['эльмаш','elmash','elmaş'],
    botanica:['ботанич','botanic','botani','植物园','بوتانيت'],
    chkalov: ['чкалов','chkalov','çkalov'],
    geolog:  ['геологич','geolog'],
    dinamo:  ['динамо','dinamo','dynamo'],
    zhbi:    ['жби','zhbi','jbi'],
    akadem:  ['академич','akadem','academic'],
    pioner:  ['пионер','pioner','pioneer'],
    himmash: ['химмаш','himmash','khimmash','himmaş'],
    sinkam:  ['синие камни','sinie','siniye','sinyi'],
    kolcovo: ['кольцово','koltsovo','kolcovo','airport','аэропорт','havaliman','مطار','机场'],
    vokzal:  ['вокзал','vokzal','railway','train station','gar','محطة'],
    uktus:   ['уктус','uktus'],
    shirrech:['широкая речка','shirokaya','şirokaya']
  };

  function label(place, lang) {
    if (!place) return '';
    return (lang === 'ru') ? place.ru : place.lat_name;
  }
  function labelById(id, lang) { return label(byId[id], lang); }

  /* find place id inside free text */
  function findInText(text) {
    var s = String(text || '').toLowerCase();
    var best = null, bestPos = 1e9;
    for (var id in ALIASES) {
      var list = ALIASES[id];
      for (var i = 0; i < list.length; i++) {
        var pos = s.indexOf(list[i]);
        if (pos >= 0 && pos < bestPos) { bestPos = pos; best = { id: id, pos: pos, len: list[i].length }; }
      }
    }
    return best;
  }
  /* find all matches ordered by position */
  function findAllInText(text) {
    var s = String(text || '').toLowerCase();
    var found = [];
    for (var id in ALIASES) {
      var list = ALIASES[id], bp = -1, bl = 0;
      for (var i = 0; i < list.length; i++) {
        var pos = s.indexOf(list[i]);
        if (pos >= 0 && (bp < 0 || pos < bp)) { bp = pos; bl = list[i].length; }
      }
      if (bp >= 0) found.push({ id: id, pos: bp, len: bl });
    }
    found.sort(function (a, b) { return a.pos - b.pos; });
    return found;
  }

  PP.places = {
    all: PLACES, byId: byId, label: label, labelById: labelById,
    findInText: findInText, findAllInText: findAllInText,
    options: function (lang) {
      return PLACES.map(function (p) { return { value: p.id, label: label(p, lang) }; });
    }
  };
})(window.PP);
