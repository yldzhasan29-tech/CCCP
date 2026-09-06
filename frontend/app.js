const BACKEND_URL = "http://127.0.0.1:8000"; 
let rides = []; // Starts empty, filled dynamically from database

const date = document.getElementById("date");
date.value = new Date().toISOString().slice(0,10);

async function renderRides() {
  const requested = document.getElementById("time").value;
  const selectedDate = document.getElementById("date").value;
  
  if (!requested) {
    alert("Пожалуйста, выберите время!");
    return;
  }

  try {
    // 📡 Live API call fetching backend calculations
    // const response = await fetch(`${BACKEND_URL}/api/rides?time=${requested}&date=${selectedDate}`);
    const response = await fetch(`${BACKEND_URL}/rides/search?from_location=УрФУ / Главный корпус&to_location=Новокольцовский кампус&date=${selectedDate}&time=${requested}`);
    if (!response.ok) throw new Error("Backend connection failed");
    
    // Fill the empty array with raw data objects from the python server
    rides = await response.json(); 

    const [h, m] = requested.split(":").map(Number);
    const sorted = [...rides].sort((a,b) => Math.abs(toMin(a.time)-(h*60+m)) - Math.abs(toMin(b.time)-(h*60+m)));

    document.getElementById("count").textContent = `${sorted.length} вариантов`;
    
    if (sorted.length === 0) {
      document.getElementById("rideList").innerHTML = `<p class="muted">Поездок на это время не найдено.</p>`;
      return;
    }

    // Displays the best AI match found dynamically
    document.getElementById("aiExplain").innerHTML = `<b>🤖 AI подобрал варианты.</b> Учитываем время выезда, совпадение маршрута и наличие мест. Лучшее совпадение — <b>${sorted[0].match}%</b>: выезд в ${sorted[0].time}, всего на ${Math.abs(toMin(sorted[0].time)-(h*60+m))} мин. отличается от вашего запроса.`;
    
    // Injects items cleanly into your existing HTML layout card setup
    document.getElementById("rideList").innerHTML = sorted.slice(0,5).map(r => `
      <article class="ride">
       <div class="match">${r.match}% match</div>
       <div class="driver"><div class="avatar">${r.emoji || '🚗'}</div><div><strong>${r.driver_name}, ${r.age}</strong><span class="muted">⭐ ${r.rating} · ${r.car}</span></div></div>
       <div class="route">
         <div class="route-row"><span class="dot"></span><span>УрФУ / Главный корпус</span><b style="margin-left:auto">${r.departure_time.split("T")[1].substring(0,5)}</b></div>
         <div class="route-row"><span class="dot green"></span><span>Новокольцовский кампус</span></div>
       </div>
       <div class="ride-bottom"><div><div class="price">${r.price} ₽</div><span class="muted">за место · ${r.available_seats} места</span></div><button class="book" onclick="openRide(${r.id})">Выбрать</button></div>
      </article>`).join("");

    document.getElementById("results").classList.remove("hidden");
    document.getElementById("results").scrollIntoView({behavior:"smooth",block:"start"});

  } catch (error) {
    console.error("Error connecting frontend to backend:", error);
    alert("Ошибка соединения с AI сервером. Убедитесь, что backend запущен!");
  }
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
