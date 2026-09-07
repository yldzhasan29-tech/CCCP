<div align="center">

<img src="assets/favicon.svg" width="72" alt="Poputka AI" />

# Попутка ИИ · Poputka AI

**UrFU öğrencileri için şehir ↔ Novokoltsovski kampüsü akıllı araç paylaşımı**

UrFU «ТОП ИИ» hackathonu · Кейс 10

[![Pages](https://img.shields.io/badge/yay%C4%B1n-GitHub%20Pages-2b3137?logo=github)](../../deployments)
[![No build](https://img.shields.io/badge/build-gerekmiyor-12B886)](#-çalıştırma-30-saniye)
[![Zero deps](https://img.shields.io/badge/ba%C4%9F%C4%B1ml%C4%B1l%C4%B1k-0-4B37E0)](#-mimari)
[![i18n](https://img.shields.io/badge/dil-8-6B57F6)](#diller)
[![License](https://img.shields.io/badge/lisans-MIT-lightgrey)](LICENSE)

[Русский README →](README.md)

<img src="docs/screenshots/01-home.jpg" width="880" alt="Ana sayfa" />

</div>

---

## Nedir

UrFU öğrencilerinin kampüse birlikte gitmesini sağlayan bir web uygulaması.
Sürücü ilanını **normal cümlelerle** yazıyor — yapay zekâ bunu yapılandırılmış bir yolculuğa çeviriyor.
Yolcu arama yapıyor, **her önerinin neden önerildiğinin açıklamasıyla** eşleşme listesi alıyor ve
**her mesajın karşı tarafın diline otomatik çevrildiği** bir sohbette anlaşıyor.

Novokoltsovski kampüsü onlarca ülkeden öğrenci barındırıyor; dil engeli burada süs değil,
gerçek bir problem. Ürünün çekirdeği de bu.

---

## 🚀 Çalıştırma (30 saniye)

Ne `npm install`, ne build, ne bağımlılık.

```bash
git clone https://github.com/<organizasyon>/<depo>.git
cd <depo>
python3 -m http.server 8000
```

<http://localhost:8000> adresini aç.

Ya da doğrudan **`index.html` dosyasına çift tıkla** — dosyadan da çalışır.

> İnternet yalnızca OpenStreetMap karoları ve web fontu için gerekli.
> İnternet yokken uygulama **çökmez**: harita şematik moda düşer, güzergâh ve duraklar görünmeye devam eder.

---

## 🌐 Yayına alma

### GitHub Pages (workflow hazır)

Depoda [`.github/workflows/pages.yml`](.github/workflows/pages.yml) var. Bir kez açman yeterli:

**Settings → Pages → Build and deployment → Source: `GitHub Actions`**

Bundan sonra `main` dalına her push, siteyi
`https://<organizasyon>.github.io/<depo>/` adresinde otomatik günceller.

### Diğer seçenekler

| Platform | Ne yapılır |
|---|---|
| **Netlify** | klasörü <https://app.netlify.com/drop> sayfasına sürükle-bırak |
| **Vercel** | `vercel --prod` (statik proje, build komutu boş) |

---

## ✨ Özellikler

| | Özellik | Nerede |
|---|---|---|
| 🪄 | **Doğal dil çözümleme.** «Uralmaş'tan 8:30'da çıkıyorum, iki kişi alabilirim» → nokta, saat, koltuk, ücret | `İlan ver` |
| 🎯 | **Eşleştirme** güzergâh, saat ve puana göre; yüzdelik eşleşme halkası | `Yolculuk bul` |
| 💬 | **«Bu yolculuk neden» açıklaması** — şablonla, modele gitmeden: anında ve öngörülebilir | karttaki buton |
| 🌍 | **Sohbette çeviri.** Her mesaj hem orijinal hem okuyanın dilinde | `Sohbetler` |
| ⭐ | **Karşılıklı puanlama** 1–5 yıldız + yorum | `Yolculuklarım → Tamamlanan` |
| 🛡 | **Öğrenci doğrulaması** `@stud.urfu.ru` adresiyle | `Giriş` |
| 🗺 | **Harita** OpenStreetMap karolarıyla — kütüphanesiz, kendi implementasyonumuz | her yerde |
| 📱 | **Tam responsive** — hedef kitle telefondan giriyor | — |

### Diller

Rusça (varsayılan) · Türkçe · English · 中文 · Español · Español (LatAm) · Português · **العربية tam RTL desteğiyle**

Geçiş anında, sayfa yenilenmeden. Arapça'da düzen tamamen aynalanıyor —
navigasyon, kartlar, sohbet, harita.

---

## 📸 Ekranlar

<table>
<tr>
<td width="50%"><img src="docs/screenshots/02-search.jpg" alt="Arama ve eşleştirme" /><br /><sub><b>Açıklamalı eşleştirme.</b> Yüzdelik skor ve gerekçe: saat, güzergâh, sürücü puanı.</sub></td>
<td width="50%"><img src="docs/screenshots/04-chat.jpg" alt="Çevirili sohbet" /><br /><sub><b>Otomatik çevirili sohbet.</b> Üstte orijinal, altta okuyanın dilindeki çeviri.</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/05-chat-rtl.jpg" alt="Arapça arayüz, RTL" /><br /><sub><b>Arapça, RTL.</b> Düzen tamamen aynalanıyor; içerideki Latin ve Kiril metinler kendi yönünü koruyor.</sub></td>
<td><img src="docs/screenshots/06-profile.jpg" alt="Profil" /><br /><sub><b>Profil ve değerlendirmeler.</b> Puan, sürücü ve yolcu olarak yolculuk sayısı.</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/03-publish.jpg" alt="İlan verme" /><br /><sub><b>İlan çözümleme.</b> Serbest metin → yapılandırılmış yolculuk; her alan düzeltilebilir.</sub></td>
<td align="center"><img src="docs/screenshots/07-mobile.jpg" width="300" alt="Mobil görünüm" /><br /><sub><b>Telefon.</b> Hedef kitle buradan giriyor.</sub></td>
</tr>
</table>

---

## 🤖 Yapay zekâ modelini bağlama

**Uygulama anahtarsız da tam çalışır.** Anahtar yoksa yerleşik ilan çözümleyici ve ifade sözlüğü
devreye girer — demo ne anahtarsız ne internetsiz bozulur.

Gerçek modeli bağlamak için:

1. Ücretsiz anahtar al:
   * **Groq** — <https://console.groq.com/keys> (llama-3.3-70b, cömert ücretsiz kota)
   * **Google Gemini** — <https://aistudio.google.com/apikey> (gemini-2.0-flash)
2. Uygulamada: **Ayarlar → Yapay zekâ modeli** → sağlayıcıyı seç, anahtarı yapıştır
3. **Anahtarı test et** — yeşil onay görünürse hazır

> Anahtar yalnızca tarayıcının `localStorage`'ında durur ve seçtiğin sağlayıcı dışında
> hiçbir yere gitmez. Depoda anahtar yok, olmamalı da.

<img src="docs/screenshots/08-settings.jpg" width="620" alt="Yapay zekâ ayarları" />

---

## 🏗 Mimari

Uygulama framework'süz ve build adımı olmadan saf JavaScript ile yazıldı — böylece takımdaki
herkes yarım dakikada çalıştırıp yayına alabiliyor ve sunumda çökecek bir şey kalmıyor.

```
index.html                 tek giriş noktası
styles/
  tokens.css               tasarım sistemi: palet, tipografi, spacing, gölge, animasyon
  base.css                 reset + tipografi
  components.css           buton, input, kart, rozet, sohbet balonu, harita, modal
  views.css                sayfa düzenleri, responsive, RTL
src/
  util.js                  DOM yardımcıları, tarih/coğrafya, ikon seti
  i18n.js                  8 dilli çeviri motoru, RTL yönetimi
  locales/*.js             çeviri dosyaları — her biri 266 anahtar, tam eşleşmeli
  places.js                Yekaterinburg durakları: koordinat + parser için takma adlar
  store.js                 VERİ KATMANI (soyut) — şu an localStorage adaptörü
  seed.js                  demo veri: kullanıcı, ilan, sohbet, puan
  ai.js                    Groq/Gemini istemcisi + çevrimdışı parser + ifade sözlüğü
  matching.js              eşleşme skoru + şablon açıklamalar
  map.js                   OSM karo haritası: projeksiyon, sürükleme, zum, fallback
  ui.js                    UI kit: toast, modal, avatar, yıldız, halka, form alanları
  shell.js                 şapka, navigasyon, router
  views/*.js               ekranlar
  main.js                  başlatma
scripts/check-locales.js   çeviri anahtarı denetimi (CI'da çalışır)
```

### Eşleştirme algoritması

```
skor = 0.50 · güzergâh yakınlığı
     + 0.36 · saat farkı (esneklik penceresi ±5…90 dakika)
     + 0.14 · sürücü puanı
```

Güzergâh yakınlığı, kalkış ve varış noktaları için ayrı ayrı haversine formülüyle hesaplanıyor.
«Bu yolculuk neden» açıklaması **modelle değil şablonla** üretiliyor: anında görünmeli,
sıfır maliyetli olmalı ve asla uydurmamalı.

### Gerçek veritabanına geçiş

Tüm veri erişimi [`src/store.js`](src/store.js) içindeki `adapter` nesnesinden geçiyor
(`load` / `save` artı `all` / `find` / `where` / `insert` / `update` / `remove`).
Supabase veya Firebase'e geçmek için sadece bu nesneyi değiştirmek yeterli — ekranlar değişmiyor.

---

## 🎬 Sunum senaryosu (5 dakika)

1. **Ana sayfa** — dili Rusça'dan Arapça'ya çevir: arayüz anında RTL'e dönüyor.
2. **İlan ver** — şunu yaz: *«Завтра еду с Уралмаша в кампус в 8:30, могу взять двоих, 150 рублей»*
   → «Разобрать с ИИ» → hazır ilan ve haritada güzergâh.
3. **Yolculuk bul** — «Bu yolculuk neden»i aç: saat farkı, güzergâh örtüşmesi, sürücü puanı.
4. **Sohbetler** — Hasan (Türkçe) ↔ Мария (Rusça) yazışması; her mesajda orijinal + çeviri.
   Kullanıcı menüsünden **kullanıcı değiştir** — aynı diyalog karşı taraftan.
5. **Yolculuklarım → Tamamlanan** — puan ver, profilde puanın güncellendiğini göster.

---

## 🚧 MVP kapsamı dışında

Dinamik fiyatlandırma ve talep tahmini orijinal kеys tanımında var ama bu sürümde bilinçli olarak
kapsam dışı bırakıldı. Gerçek e-posta doğrulama servisi yerine `@stud.urfu.ru` format kontrolü kullanılıyor.

---

## 🤝 Takım

Hata bildirimi, arayüz ve çeviri önerileri için: [CONTRIBUTING.md](CONTRIBUTING.md).

## Lisans

[MIT](LICENSE)
