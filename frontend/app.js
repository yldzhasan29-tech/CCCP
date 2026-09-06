const API = "/api";
let currentUser = JSON.parse(localStorage.getItem("poputka_user") || "null");

// ---------- Tabs ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "routes") loadRoutes();
    if (btn.dataset.tab === "demand") loadDemand();
  });
});

// ---------- Helpers ----------
function fmtZone(name, km) { return `${name} (~${km} км)`; }

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

function requireLogin(box) {
  if (!currentUser) {
    box.innerHTML = `<p class="error-msg">Сначала зарегистрируйтесь на вкладке «Аккаунт».</p>`;
    return false;
  }
  return true;
}

// ---------- Load zones into selects ----------
let ZONES = {};
async function loadZones() {
  const data = await api("/zones");
  ZONES = data.zones;
  const selects = [document.getElementById("driverZone"), document.getElementById("passengerZone")];
  selects.forEach(sel => {
    sel.innerHTML = Object.entries(ZONES)
      .map(([name, km]) => `<option value="${name}">${fmtZone(name, km)}</option>`)
      .join("");
  });
}
loadZones();

// ---------- Account ----------
const accountResult = document.getElementById("accountResult");
if (currentUser) {
  accountResult.innerHTML = `<div class="info-card success-msg">Вы вошли как <b>${currentUser.name}</b> (${currentUser.email})</div>`;
}

document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const payload = Object.fromEntries(form.entries());
  try {
    const data = await api("/users/register", { method: "POST", body: JSON.stringify(payload) });
    currentUser = data;
    localStorage.setItem("poputka_user", JSON.stringify(currentUser));
    const cls = data.verified ? "success-msg" : "error-msg";
    accountResult.innerHTML = `<div class="info-card"><p class="${cls}">${data.message || ""}</p>
      <p>Вы вошли как <b>${data.name}</b> (${data.email})</p></div>`;
  } catch (err) {
    accountResult.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
});

// ---------- Driver: publish route ----------
document.getElementById("routeForm").addEventListener("submit", async e => {
  e.preventDefault();
  const box = document.getElementById("routeResult");
  if (!requireLogin(box)) return;
  const form = new FormData(e.target);
  const payload = Object.fromEntries(form.entries());
  payload.driver_id = currentUser.id;
  payload.music = form.get("music") ? 1 : 0;
  payload.talkative = form.get("talkative") ? 1 : 0;
  try {
    const data = await api("/routes", { method: "POST", body: JSON.stringify(payload) });
    box.innerHTML = `<p class="success-msg">${data.message}</p>`;
    e.target.reset();
  } catch (err) {
    box.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
});

// ---------- Passenger: find matches ----------
document.getElementById("requestForm").addEventListener("submit", async e => {
  e.preventDefault();
  const box = document.getElementById("matchesResult");
  if (!requireLogin(box)) return;
  const form = new FormData(e.target);
  const payload = Object.fromEntries(form.entries());
  payload.passenger_id = currentUser.id;
  if (payload.pref_music === "") delete payload.pref_music; else payload.pref_music = payload.pref_music === "1";
  if (payload.pref_talkative === "") delete payload.pref_talkative; else payload.pref_talkative = payload.pref_talkative === "1";

  try {
    const data = await api("/requests", { method: "POST", body: JSON.stringify(payload) });
    renderMatches(box, data);
  } catch (err) {
    box.innerHTML = `<p class="error-msg">${err.message}</p>`;
  }
});

function renderMatches(box, data) {
  if (!data.matches.length) {
    box.innerHTML = `<p class="error-msg">Пока нет подходящих водителей. Заявка сохранена — как только появится маршрут, вы увидите совпадение здесь.</p>`;
    return;
  }
  box.innerHTML = data.matches.map(m => `
    <div class="match-card">
      <span class="score-badge">Совпадение: ${Math.round(m.match_score * 100)}%</span>
      <div class="route-row">
        <span><b>${m.driver_name}</b> · выезд в ${m.departure_time}</span>
        <span>${m.seats_available}/${m.seats_total} мест</span>
      </div>
      <div style="margin:6px 0;">
        <span class="pill">${m.music ? "🎵 музыка" : "🔇 без музыки"}</span>
        <span class="pill">${m.talkative ? "💬 общительный" : "🤫 тишина"}</span>
        ${m.driver_rating ? `<span class="pill">⭐ ${m.driver_rating}</span>` : ""}
        <span class="pill ${m.price.is_peak ? "peak" : "off-peak"}">${m.price.is_peak ? "час пик" : "не пик"}</span>
      </div>
      <div class="price">${m.price.price_per_passenger_rub} ₽ / чел.</div>
      <div class="savings">экономия ~${m.price.savings_rub} ₽ по сравнению с такси</div>
      <button onclick="confirmTrip(${m.route_id}, ${data.request_id}, this)">Забронировать место</button>
    </div>
  `).join("");
}

async function confirmTrip(routeId, requestId, btn) {
  btn.disabled = true;
  btn.textContent = "Бронируем...";
  try {
    const data = await api("/trips", {
      method: "POST",
      body: JSON.stringify({ route_id: routeId, request_id: requestId }),
    });
    btn.closest(".match-card").innerHTML = `<p class="success-msg">✅ ${data.message} Итоговая цена: ${data.price_rub} ₽.</p>`;
  } catch (err) {
    btn.textContent = "Ошибка, попробуйте снова";
    alert(err.message);
    btn.disabled = false;
  }
}

// ---------- Active routes list ----------
document.getElementById("refreshRoutes").addEventListener("click", loadRoutes);
async function loadRoutes() {
  const box = document.getElementById("routesList");
  box.innerHTML = "Загрузка...";
  const routes = await api("/routes");
  if (!routes.length) {
    box.innerHTML = `<p class="hint">Пока нет активных маршрутов.</p>`;
    return;
  }
  box.innerHTML = routes.map(r => `
    <div class="route-card">
      <div class="route-row">
        <span><b>${r.driver_name}</b> · ${r.origin_zone} → ${r.direction === "to_campus" ? "кампус" : "город"}</span>
        <span>${r.departure_time}</span>
      </div>
      <div style="margin-top:4px;">
        <span class="pill">${r.seats_available}/${r.seats_total} мест свободно</span>
        <span class="pill">${r.music ? "🎵" : "🔇"}</span>
        <span class="pill">${r.talkative ? "💬" : "🤫"}</span>
      </div>
    </div>
  `).join("");
}

// ---------- Demand dashboard ----------
async function loadDemand() {
  const box = document.getElementById("demandDashboard");
  box.innerHTML = "Загрузка прогноза...";
  const data = await api("/demand/forecast");
  const dirLabels = { to_campus: "В кампус (утро)", from_campus: "Из кампуса (вечер)" };

  box.innerHTML = Object.entries(data).map(([direction, rows]) => {
    const maxDemand = Math.max(1, ...rows.map(r => r.demand));
    const sorted = [...rows].sort((a, b) => a.hour - b.hour);
    return `
      <div class="info-card">
        <h3 style="margin-top:0;color:var(--navy)">${dirLabels[direction] || direction}</h3>
        ${sorted.filter(r => r.demand > 0 || r.supply > 0).map(r => `
          <div class="demand-hour-row">
            <span class="hour">${String(r.hour).padStart(2, "0")}:00</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(r.demand / maxDemand) * 100}%"></div></div>
            <span>${r.demand} заявок / ${r.supply} мест</span>
            ${r.bonus_percent > 0 ? `<span class="bonus-tag">+${r.bonus_percent}% водителю</span>` : ""}
          </div>
        `).join("")}
      </div>
    `;
  }).join("");
}
