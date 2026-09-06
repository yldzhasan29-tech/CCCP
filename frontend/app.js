const BACKEND_URL = "http://127.0.0.1:8000";
let rides = [];

const date = document.getElementById("date");
date.value = new Date().toISOString().slice(0, 10);

function rideTime(ride) {
  if (ride.time) return ride.time;
  if (!ride.departure_time) return "";
  const iso = String(ride.departure_time);
  return iso.includes("T") ? iso.split("T")[1].slice(0, 5) : iso;
}

function matchPct(ride) {
  const raw = ride.match_score ?? ride.match ?? 0;
  return Math.max(0, Math.min(100, Number(raw) || 0));
}

function toMin(s) {
  const [h, m] = String(s).split(":").map(Number);
  return h * 60 + m;
}

function showResults() {
  const results = document.getElementById("results");
  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function renderRides() {
  const requested = document.getElementById("time").value;
  const selectedDate = document.getElementById("date").value;
  const fromLocation = document.getElementById("from").value;
  const toLocation = document.getElementById("to").value;

  if (!requested || !selectedDate) {
    alert("Пожалуйста, выберите дату и время!");
    return;
  }

  const params = new URLSearchParams({
    from_location: fromLocation,
    to_location: toLocation,
    date: selectedDate,
    time: requested,
  });

  try {
    const response = await fetch(`${BACKEND_URL}/rides/search?${params}`);
    if (!response.ok) throw new Error("Backend connection failed");

    rides = await response.json();
    const requestedMin = toMin(requested);
    const sorted = [...rides].sort(
      (a, b) => Math.abs(toMin(rideTime(a)) - requestedMin) - Math.abs(toMin(rideTime(b)) - requestedMin)
    );

    document.getElementById("count").textContent = `${sorted.length} вариантов`;

    if (sorted.length === 0) {
      document.getElementById("aiExplain").innerHTML =
        "<b>🤖 Совпадений нет.</b> Попробуйте другую дату, время или маршрут. Демо-поездки посеяны на 7 сентября 2026.";
      document.getElementById("rideList").innerHTML =
        `<p class="muted">Поездок на это время не найдено.</p>`;
      showResults();
      return;
    }

    const best = sorted[0];
    const diff = Math.abs(toMin(rideTime(best)) - requestedMin);
    document.getElementById("aiExplain").innerHTML =
      `<b>🤖 AI подобрал варианты.</b> ${best.ai_explanation || "Учитываем время выезда, маршрут и места."} Лучшее совпадение — <b>${matchPct(best)}%</b>: выезд в ${rideTime(best)}, отличается на ${diff} мин.`;

    document.getElementById("rideList").innerHTML = sorted
      .slice(0, 5)
      .map(
        (r) => `
      <article class="ride">
       <div class="match">${matchPct(r)}% match</div>
       <div class="driver"><div class="avatar">🚗</div><div><strong>${r.driver_name}</strong><span class="muted">⭐ ${r.rating} · ${r.car}</span></div></div>
       <div class="route">
         <div class="route-row"><span class="dot"></span><span>${r.from_location}</span><b style="margin-left:auto">${rideTime(r)}</b></div>
         <div class="route-row"><span class="dot green"></span><span>${r.to_location}</span></div>
       </div>
       <div class="ride-bottom"><div><div class="price">${r.price} ₽</div><span class="muted">за место · ${r.available_seats} места</span></div><button class="book" onclick="openRide(${r.id})">Выбрать</button></div>
      </article>`
      )
      .join("");

    showResults();
  } catch (error) {
    console.error("Error connecting frontend to backend:", error);
    alert("Ошибка соединения с AI сервером. Убедитесь, что backend запущен!");
  }
}

window.openRide = (id) => {
  const r = rides.find((x) => x.id === id);
  if (!r) return;
  document.getElementById("modalContent").innerHTML = `
  <div class="ai-title">✨ AI MATCH ${matchPct(r)}%</div>
  <h2>${r.driver_name} · ⭐ ${r.rating}</h2>
  <p class="muted">${r.car} · ${r.available_seats} свободных места</p>
  <div class="route" style="margin-top:18px">
    <div class="route-row"><span class="dot"></span><span>${r.from_location}</span><b style="margin-left:auto">${rideTime(r)}</b></div>
    <div class="route-row"><span class="dot green"></span><span>${r.to_location}</span></div>
  </div>
  <p><b>Почему подходит:</b> ${r.ai_explanation || "Маршрут и время близки к запросу."}</p>
  <p><b>Стоимость:</b> ${r.price} ₽ за место</p>
  <button class="confirm" onclick="confirmRide(${r.id})">Забронировать место</button>`;
  document.getElementById("modal").classList.remove("hidden");
};

window.confirmRide = async (id) => {
  const r = rides.find((x) => x.id === id);
  try {
    const response = await fetch(`${BACKEND_URL}/rides/${id}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seats: 1 }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const detail = err.detail || "Не удалось забронировать место";
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
    if (r) r.available_seats = Math.max(0, (r.available_seats || 1) - 1);
    document.getElementById("modalContent").innerHTML = `<div style="font-size:48px">🎉</div><h2>Место забронировано!</h2><p>Вы выбрали поездку с <b>${r ? r.driver_name : "водителем"}</b> за <b>${r ? r.price : ""} ₽</b>.</p><p class="muted">Оплата в MVP демонстрационная, место уже списано на сервере.</p><button class="confirm" onclick="document.getElementById('modal').classList.add('hidden'); renderRides()">Готово</button>`;
  } catch (error) {
    console.error(error);
    alert(error.message || "Ошибка бронирования");
  }
};

document.getElementById("searchBtn").onclick = renderRides;
document.querySelectorAll(".quick button").forEach((b) => {
  b.onclick = () => {
    document.getElementById("time").value = b.dataset.time;
    renderRides();
  };
});
document.getElementById("closeModal").onclick = () => document.getElementById("modal").classList.add("hidden");
document.getElementById("modal").onclick = (e) => {
  if (e.target.id === "modal") e.target.classList.add("hidden");
};
document.getElementById("loginBtn").onclick = () => {
  document.getElementById("modalContent").innerHTML = `<h2>Вход студента</h2><p class="muted">В MVP используем демонстрационный вход.</p><input style="width:100%;height:48px;border:1px solid #dfe4ec;border-radius:11px;padding:0 12px" placeholder="Почта @urfu.ru"><button class="confirm" onclick="document.getElementById('modal').classList.add('hidden')">Войти</button>`;
  document.getElementById("modal").classList.remove("hidden");
};
