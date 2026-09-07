/* ==========================================================
   Demo dataset — generated relative to "today" so the app
   always looks alive during the presentation.
   ========================================================== */
(function (PP) {
  'use strict';
  var U = PP.util;

  function at(dayOffset, hhmm) {
    var d = new Date();
    d.setDate(d.getDate() + dayOffset);
    var p = hhmm.split(':');
    d.setHours(+p[0], +p[1], 0, 0);
    return d.toISOString();
  }
  function ago(days) {
    var d = new Date(); d.setDate(d.getDate() - days); return d.toISOString();
  }

  function build() {
    var users = [
      { id:'u_maria',  name:'Мария Кузнецова', email:'m.kuznetsova@stud.urfu.ru', lang:'ru',
        car:'Kia Rio, белая · Е 432 УК', bio:'Магистратура ИРИТ-РТФ. Езжу в кампус почти каждый день.', joined:ago(320) },
      { id:'u_hasan',  name:'Hasan Yıldız', email:'h.yildiz@stud.urfu.ru', lang:'tr',
        car:'', bio:'Uluslararası ilişkiler. Sabah dersleri için kampüse gidiyorum.', joined:ago(140) },
      { id:'u_dmitry', name:'Дмитрий Орлов', email:'d.orlov@stud.urfu.ru', lang:'ru',
        car:'Skoda Octavia, серая · К 771 ВН', bio:'ИНМиТ, 3 курс. Беру попутчиков по дороге на пары.', joined:ago(410) },
      { id:'u_li',     name:'Li Wei', email:'li.wei@stud.urfu.ru', lang:'zh',
        car:'', bio:'化学工程专业二年级，住在植物园附近。', joined:ago(95) },
      { id:'u_amir',   name:'Amir Haddad', email:'a.haddad@stud.urfu.ru', lang:'ar',
        car:'Lada Vesta, синяя · А 104 ОР', bio:'طالب هندسة معمارية، أسكن قرب أورالماش.', joined:ago(200) },
      { id:'u_sofia',  name:'Sofía Reyes', email:'s.reyes@stud.urfu.ru', lang:'es-419',
        car:'', bio:'Intercambio en economía. Vivo en Akademicheskiy.', joined:ago(60) },
      { id:'u_ana',    name:'Ana Ribeiro', email:'a.ribeiro@stud.urfu.ru', lang:'pt',
        car:'', bio:'Mestrado em ciência de dados. Costumo ir de manhã cedo.', joined:ago(75) },
      { id:'u_elena',  name:'Елена Соколова', email:'e.sokolova@stud.urfu.ru', lang:'ru',
        car:'Hyundai Solaris, чёрная · О 250 МТ', bio:'УралЭНИН. Возвращаюсь из кампуса вечером.', joined:ago(500) }
    ];

    var rides = [
      { id:'r_1', driverId:'u_maria',  fromId:'uralmash', toId:'campus', departAt:at(1,'08:00'), seats:3,
        price:150, note:'Есть место для рюкзака. Выезжаю ровно, без опозданий.', status:'open', createdAt:ago(1) },
      { id:'r_2', driverId:'u_dmitry', fromId:'botanica', toId:'campus', departAt:at(1,'08:15'), seats:2,
        price:120, note:'Могу подобрать у метро Ботаническая, у выхода к ТЦ.', status:'open', createdAt:ago(1) },
      { id:'r_3', driverId:'u_amir',   fromId:'uralmash', toId:'campus', departAt:at(1,'08:30'), seats:2,
        price:0,   note:'أذهب كل يوم، مجانًا — فقط للرفقة.', status:'open', createdAt:ago(2) },
      { id:'r_4', driverId:'u_elena',  fromId:'pl1905',   toId:'campus', departAt:at(1,'07:45'), seats:3,
        price:180, note:'Кофе в машине не пьём :) Багажник свободен.', status:'open', createdAt:ago(1) },
      { id:'r_5', driverId:'u_dmitry', fromId:'campus',   toId:'pl1905', departAt:at(1,'17:30'), seats:3,
        price:150, note:'Обратно после пар, подвезу до центра.', status:'open', createdAt:ago(1) },
      { id:'r_6', driverId:'u_maria',  fromId:'campus',   toId:'uralmash', departAt:at(1,'18:00'), seats:3,
        price:150, note:'', status:'open', createdAt:ago(1) },
      { id:'r_7', driverId:'u_elena',  fromId:'chkalov',  toId:'campus', departAt:at(2,'08:20'), seats:2,
        price:140, note:'', status:'open', createdAt:ago(1) },
      { id:'r_8', driverId:'u_amir',   fromId:'zhbi',     toId:'campus', departAt:at(2,'09:00'), seats:3,
        price:0,   note:'', status:'open', createdAt:ago(1) },
      /* completed history — источник рейтингов и «Завершённые» */
      { id:'r_p1', driverId:'u_maria', fromId:'uralmash', toId:'campus', departAt:ago(3), seats:3,
        price:150, note:'', status:'completed', createdAt:ago(5) },
      { id:'r_p2', driverId:'u_dmitry',fromId:'botanica', toId:'campus', departAt:ago(6), seats:2,
        price:120, note:'', status:'completed', createdAt:ago(8) },
      { id:'r_p3', driverId:'u_elena', fromId:'campus',   toId:'pl1905', departAt:ago(9), seats:3,
        price:180, note:'', status:'completed', createdAt:ago(11) }
    ];

    var bookings = [
      { id:'b_1',  rideId:'r_1',  passengerId:'u_hasan', seats:1, status:'accepted',  createdAt:ago(1) },
      { id:'b_2',  rideId:'r_1',  passengerId:'u_li',    seats:1, status:'pending',   createdAt:ago(0) },
      { id:'b_3',  rideId:'r_2',  passengerId:'u_ana',   seats:1, status:'accepted',  createdAt:ago(1) },
      { id:'b_4',  rideId:'r_4',  passengerId:'u_sofia', seats:1, status:'pending',   createdAt:ago(0) },
      { id:'b_p1', rideId:'r_p1', passengerId:'u_hasan', seats:1, status:'completed', createdAt:ago(5) },
      { id:'b_p2', rideId:'r_p1', passengerId:'u_sofia', seats:1, status:'completed', createdAt:ago(5) },
      { id:'b_p3', rideId:'r_p2', passengerId:'u_li',    seats:1, status:'completed', createdAt:ago(8) },
      { id:'b_p4', rideId:'r_p3', passengerId:'u_amir',  seats:1, status:'completed', createdAt:ago(11) }
    ];

    /* Чат Hasan (tr) ↔ Мария (ru) — с уже готовыми переводами,
       чтобы демонстрация работала даже без ключа и интернета. */
    var t1 = 'r_1::u_hasan';
    var base = Date.now() - 1000 * 60 * 90;
    function ts(mins) { return new Date(base + mins * 60000).toISOString(); }

    var messages = [
      { id:'m_1', threadId:t1, rideId:'r_1', senderId:'u_hasan', srcLang:'tr',
        text:'Merhaba! Yarın sabah için bir koltuk hâlâ boş mu?',
        tr:{ ru:'Здравствуйте! Место на завтрашнее утро ещё свободно?',
             en:'Hello! Is a seat for tomorrow morning still free?',
             tr:'Merhaba! Yarın sabah için bir koltuk hâlâ boş mu?' },
        createdAt:ts(0), engine:'ai' },
      { id:'m_2', threadId:t1, rideId:'r_1', senderId:'u_maria', srcLang:'ru',
        text:'Да, есть два места. Выезжаю от Уралмаша в 8:00 ровно.',
        tr:{ tr:'Evet, iki koltuk var. Uralmaş\'tan tam 08:00\'de çıkıyorum.',
             en:'Yes, two seats left. I leave Uralmash at 8:00 sharp.',
             ru:'Да, есть два места. Выезжаю от Уралмаша в 8:00 ровно.' },
        createdAt:ts(4), engine:'ai' },
      { id:'m_3', threadId:t1, rideId:'r_1', senderId:'u_hasan', srcLang:'tr',
        text:'Harika. Beni metro çıkışının önünden alabilir misiniz?',
        tr:{ ru:'Отлично. Сможете забрать меня у выхода из метро?',
             en:'Great. Could you pick me up in front of the metro exit?',
             tr:'Harika. Beni metro çıkışının önünden alabilir misiniz?' },
        createdAt:ts(7), engine:'ai' },
      { id:'m_4', threadId:t1, rideId:'r_1', senderId:'u_maria', srcLang:'ru',
        text:'Конечно. Буду там в 7:58, машина белая Kia Rio.',
        tr:{ tr:'Tabii ki. 07:58\'de orada olacağım, araç beyaz Kia Rio.',
             en:'Of course. I will be there at 7:58, a white Kia Rio.',
             ru:'Конечно. Буду там в 7:58, машина белая Kia Rio.' },
        createdAt:ts(9), engine:'ai' },
      { id:'m_5', threadId:t1, rideId:'r_1', senderId:'u_hasan', srcLang:'tr',
        text:'Teşekkür ederim, yarın görüşürüz!',
        tr:{ ru:'Спасибо, до встречи завтра!',
             en:'Thank you, see you tomorrow!',
             tr:'Teşekkür ederim, yarın görüşürüz!' },
        createdAt:ts(11), engine:'ai' }
    ];

    var t2 = 'r_2::u_ana';
    var messages2 = [
      { id:'m_6', threadId:t2, rideId:'r_2', senderId:'u_ana', srcLang:'pt',
        text:'Boa noite! Consigo levar uma mala pequena?',
        tr:{ ru:'Добрый вечер! Можно взять небольшой чемодан?',
             en:'Good evening! Can I bring a small suitcase?',
             pt:'Boa noite! Consigo levar uma mala pequena?' },
        createdAt:ts(-40), engine:'ai' },
      { id:'m_7', threadId:t2, rideId:'r_2', senderId:'u_dmitry', srcLang:'ru',
        text:'Да, багажник почти пустой, места хватит.',
        tr:{ pt:'Sim, a mala do carro está quase vazia, há espaço de sobra.',
             en:'Yes, the boot is almost empty, there is plenty of room.',
             ru:'Да, багажник почти пустой, места хватит.' },
        createdAt:ts(-36), engine:'ai' }
    ];

    var ratings = [
      { id:'rt_1', rideId:'r_p1', fromUserId:'u_hasan', toUserId:'u_maria', stars:5,
        comment:'Çok dakik ve nazik bir sürücü. Kesinlikle tekrar binerim.', createdAt:ago(3) },
      { id:'rt_2', rideId:'r_p1', fromUserId:'u_sofia', toUserId:'u_maria', stars:5,
        comment:'Muy puntual y el auto impecable.', createdAt:ago(3) },
      { id:'rt_3', rideId:'r_p1', fromUserId:'u_maria', toUserId:'u_hasan', stars:5,
        comment:'Пришёл вовремя, приятный попутчик.', createdAt:ago(3) },
      { id:'rt_4', rideId:'r_p2', fromUserId:'u_li',    toUserId:'u_dmitry', stars:4,
        comment:'路线很顺，但出发晚了五分钟。', createdAt:ago(6) },
      { id:'rt_5', rideId:'r_p2', fromUserId:'u_dmitry',toUserId:'u_li', stars:5,
        comment:'Всё отлично, спасибо!', createdAt:ago(6) },
      { id:'rt_6', rideId:'r_p3', fromUserId:'u_amir',  toUserId:'u_elena', stars:5,
        comment:'سائقة ممتازة، الرحلة كانت مريحة جدًا.', createdAt:ago(9) },
      { id:'rt_7', rideId:'r_p3', fromUserId:'u_elena', toUserId:'u_amir', stars:5,
        comment:'Вежливый и пунктуальный.', createdAt:ago(9) }
    ];

    return {
      users: users,
      rides: rides,
      bookings: bookings,
      messages: messages.concat(messages2),
      ratings: ratings
    };
  }

  PP.seed = {
    build: build,
    install: function () { PP.store.replaceAll(build()); },
    ensure: function () { if (PP.store.isEmpty()) PP.store.replaceAll(build()); }
  };
})(window.PP);
