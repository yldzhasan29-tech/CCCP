const rides=[
 {id:1,name:"Александр",age:21,car:"Toyota Camry",rating:4.9,seats:2,time:"08:25",price:120,match:96,emoji:"👨🏻‍💻",note:"Почти идеальное совпадение по времени"},
 {id:2,name:"Мария",age:20,car:"Kia Rio",rating:4.8,seats:3,time:"08:35",price:105,match:91,emoji:"👩🏻‍🎓",note:"Маршрут совпадает, +5 минут к вашему времени"},
 {id:3,name:"Дмитрий",age:22,car:"Hyundai Solaris",rating:4.7,seats:1,time:"08:40",price:95,match:84,emoji:"👨🏻‍🎓",note:"Самый дешёвый подходящий вариант"},
 {id:4,name:"Анна",age:19,car:"Volkswagen Polo",rating:5.0,seats:2,time:"08:20",price:110,match:82,emoji:"👩🏻‍💻",note:"Ранний выезд, высокий рейтинг"},
 {id:5,name:"Илья",age:23,car:"Skoda Octavia",rating:4.9,seats:1,time:"08:50",price:100,match:76,emoji:"🧑🏻‍💼",note:"Подходит по маршруту"}
];

const date=document.getElementById("date");
date.value=new Date().toISOString().slice(0,10);

function renderRides(){
 const requested=document.getElementById("time").value;
 const [h,m]=requested.split(":").map(Number);
 const sorted=[...rides].sort((a,b)=>Math.abs(toMin(a.time)-(h*60+m))-Math.abs(toMin(b.time)-(h*60+m)));
 document.getElementById("count").textContent=`${sorted.length} вариантов`;
 document.getElementById("aiExplain").innerHTML=`<b>🤖 AI подобрал варианты.</b> Учитываем время выезда, совпадение маршрута и наличие мест. Лучшее совпадение — <b>${sorted[0].match}%</b>: выезд в ${sorted[0].time}, всего на ${Math.abs(toMin(sorted[0].time)-(h*60+m))} мин. отличается от вашего запроса.`;
 document.getElementById("rideList").innerHTML=sorted.slice(0,5).map(r=>`
   <article class="ride">
    <div class="match">${r.match}% match</div>
    <div class="driver"><div class="avatar">${r.emoji}</div><div><strong>${r.name}, ${r.age}</strong><span class="muted">⭐ ${r.rating} · ${r.car}</span></div></div>
    <div class="route">
      <div class="route-row"><span class="dot"></span><span>УрФУ / Главный корпус</span><b style="margin-left:auto">${r.time}</b></div>
      <div class="route-row"><span class="dot green"></span><span>Новокольцовский кампус</span></div>
    </div>
    <div class="ride-bottom"><div><div class="price">${r.price} ₽</div><span class="muted">за место · ${r.seats} места</span></div><button class="book" onclick="openRide(${r.id})">Выбрать</button></div>
   </article>`).join("");
 document.getElementById("results").classList.remove("hidden");
 document.getElementById("results").scrollIntoView({behavior:"smooth",block:"start"});
}
function toMin(s){const [h,m]=s.split(":").map(Number);return h*60+m}

window.openRide=(id)=>{
 const r=rides.find(x=>x.id===id);
 document.getElementById("modalContent").innerHTML=`
  <div class="ai-title">✨ AI MATCH ${r.match}%</div>
  <h2>${r.name}, ${r.age} · ⭐ ${r.rating}</h2>
  <p class="muted">${r.car} · ${r.seats} свободных места</p>
  <div class="route" style="margin-top:18px">
    <div class="route-row"><span class="dot"></span><span>УрФУ / Главный корпус</span><b style="margin-left:auto">${r.time}</b></div>
    <div class="route-row"><span class="dot green"></span><span>Новокольцовский кампус</span></div>
  </div>
  <p><b>Почему подходит:</b> ${r.note}.</p>
  <p><b>Стоимость:</b> ${r.price} ₽ за место</p>
  <button class="confirm" onclick="confirmRide('${r.name}',${r.price})">Забронировать место</button>`;
 document.getElementById("modal").classList.remove("hidden");
}
window.confirmRide=(name,price)=>{
 document.getElementById("modalContent").innerHTML=`<div style="font-size:48px">🎉</div><h2>Место забронировано!</h2><p>Вы выбрали поездку с <b>${name}</b> за <b>${price} ₽</b>.</p><p class="muted">Демо-режим MVP: реального платежа нет.</p><button class="confirm" onclick="document.getElementById('modal').classList.add('hidden')">Готово</button>`;
}
document.getElementById("searchBtn").onclick=renderRides;
document.querySelectorAll(".quick button").forEach(b=>b.onclick=()=>{document.getElementById("time").value=b.dataset.time;renderRides()});
document.getElementById("closeModal").onclick=()=>document.getElementById("modal").classList.add("hidden");
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")e.target.classList.add("hidden")};
document.getElementById("loginBtn").onclick=()=>{document.getElementById("modalContent").innerHTML=`<h2>Вход студента</h2><p class="muted">В MVP используем демонстрационный вход.</p><input style="width:100%;height:48px;border:1px solid #dfe4ec;border-radius:11px;padding:0 12px" placeholder="Почта @urfu.ru"><button class="confirm" onclick="document.getElementById('modal').classList.add('hidden')">Войти</button>`;document.getElementById("modal").classList.remove("hidden")};
