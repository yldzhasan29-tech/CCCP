# Poputka AI — Hackathon Proje Planı (Güncellendi)

**Son Teslim Tarihi: 8 Eylül (Sunum da aynı gün yapılacak)**
**Çalışma Başlangıcı: Bugün, 4 Eylül**

---

## 1. Ne Yapıyoruz?

Hackathon PDF'indeki 10. vaka: UrFU (Ural Federal Üniversitesi) merkez kampüsü ile Novokoltsovsky kampüsü arasında öğrenciler için araç paylaşım (ride-sharing) sistemi. Sürücü öğrenciler düzenli rotalarını paylaşır, yolcu öğrenciler ise rota/zaman/puanlama kriterlerine göre yol arkadaşı bulur. Fiyat taksiden daha ucuzdur ancak sürücü için benzin masrafını karşılayacak düzeydedir.

**Hedef:** Jüriye yapay zeka kullanarak baştan sona gerçek bir yolculuk senaryosunu birkaç dakika içinde gösterebilecek, çalışan bir MVP (Minimum Uygulanabilir Ürün) ortaya koymak.

---

## 2. Format: Bot Değil, Web Uygulaması (React)

Başlangıçta bir Telegram botu planlamıştık ancak organizatörler botun çok basit bir çözüm olduğunu belirttiler. Bu yüzden **bağımsız bir web uygulamasına** geçiş yapıyoruz.

Zaten tasarlamış olduğumuz mantık ve tüm sunucu tarafı neredeyse hiç değişmeden kalıyor — sadece arayüz değişiyor:

| Olduğu Gibi Kalıyor | Değişiyor |
|---|---|
| Sentetik veriler (30–50 sürücü/yolcu) | Sohbet mesajı → Form/Ekran |
| Skorlama formülü (rota/zaman/puanlama/tercihler) | Satır içi (inline) buton → Normal HTML butonu |
| LLM entegrasyonu (Groq/Gemini, ücretsiz) | Bot kütüphanesi (aiogram) → React |
| Şablona göre "neden eşleşti" açıklaması | — |
| Gerçek bir backend/veri tabanı ve kimlik doğrulama yok | E-posta doğrulaması yerine → Basit bir "isminizi girin" ekranı |
| Fiyat formülü (mesafe × katsayı) | — |

---

## 3. Belirlenen Teknoloji Yığını (Stack)

- **React (Vite ile)** — Hızlıca kurulur, yeni başlayanlar için uygundur
- **Vercel/Netlify** — Tek tıkla ücretsiz canlıya alma (bağlantı, dizüstü bilgisayara bağımlı olmadan çalışır ve demo sırasındaki riskleri azaltır)
- **Groq API veya Google Gemini API** — Ücretsiz plan
- Gerçek backend/veri tabanı yok — Veriler React state / localStorage içinde saklanır

---

## 4. Kısıtlamalar

- Takım: 7 kişi, herkes başlangıç seviyesinde
- Bütçe: Sıfır, sadece ücretsiz planlar kullanılıyor
- Organizatörler tarafından herhangi bir API sağlanmadı — Kendi ücretsiz anahtarlarimizi kullanıyoruz
- Zaman: Bugün + ~3.5 günlük geliştirme süresi, 8 Eylül sunum günü
- Sunum süresi henüz bilinmiyor

---

## 5. Ne Yapıyoruz (Zorunlu) ve Ne Yapmıyoruz?

### Yapılacaklar (Zorunlu):
- Üç ekran: Ana ekran (rol seçimi + form), sonuç listesi, rezervasyon onayı
- Sentetik veriler (30–50 "sahte" kullanıcı)
- Skorlama: Rota %40, Zaman %30, Puanlama %15, Tercihler %15
- Tek bir LLM çağrısı: Serbest metni yapılandırılmış JSON biçimine dönüştürme
- Şablona göre "neden eşleşti" açıklaması — LLM olmadan
- Gerçek trafik verisi içermeyen basit fiyat formülü
- Net tasarıma sahip sonuç kartları + "Rezervasyon Yap" butonu

### YAPMIYORUZ:
- Gerçek kayıt / e-posta doğrulaması → Sadece "isminizi/kullanıcı adınızı girin" alanı
- Haritalarla gerçek entegrasyon → En fazla statik bir Leaflet (ücretsiz, anahtarsız) veya rotanın metinsel açıklaması
- Talep tahmini ve "Smart Crew" → Sunumda sadece "gelecek planları" olarak bahsedilecek
- Ayrı bir backend sunucusu ve gerçek veri tabanı

---

## 6. Günlük Plan

**1. Gün (4 Eylül, Bugün) — Kaybedilen zamanı telafi ediyoruz:**
- React + Vite kurulumu, GitHub deposu oluşturulması, Vercel bağlantısı (canlıya almanın çalıştığını hemen doğrulamak için boş bir "Hello World" bile olsa yayına alın)
- Üç ekranın iskeleti
- 3 alt grup: (1) Ekranlar/UI, (2) Sahte veriler + skorlama mantığı, (3) LLM entegrasyonu + bir entegratör

**2. Gün:**
- Nihai sentetik veriler ve skorlama formülü
- Yapay zeka olmadan, sabit kodlanmış (hardcoded) verilerle "ana ekran → sonuç listesi" akışının tamamlanması

**3. Gün:**
- LLM entegrasyonu: Serbest metin formu → JSON (demoda kullanılacak ifadeleri önceden test edin)
- Şablonlu "neden eşleşti" açıklaması + fiyat hesaplama + onay ekranı

**4. Gün:**
- UI cilalama (kartlar, renkler, ikonlar — jüri UX/UI'ı ayrı değerlendiriyor)
- (İsteğe bağlı) Leaflet ile basit harita
- En az 3 tam demo provası yapılması, Vercel bağlantısının gerçekten çalıştığının kontrol edilmesi; her ihtimale karşı yedek olarak ekran görüntüleri hazırlanması

**5. Gün (8 Eylül — Sunum Günü):**
- Sabah son kontrol ve prova
- Kısa demo versiyonu (3–4 dakika) ve genişletilmiş versiyon (5–7 dakika) — her ikisi de provalı

---

## 7. Sunum Yapısı

1. Problem — Öğrenciler kampüse giderken zaman ve para kaybediyor
2. Çözüm — Uygulama, öğrencileri rotalarına göre eşleştiriyor
3. Yapay Zeka — LLM, doğal dildeki talebi anlıyor ve eşleşmeleri açıklıyor
4. Demo — En önemli kısım
5. Etki (Impact) — Daha ucuz, araçlarda daha az boş koltuk
6. Gelecek — Talep tahmini, Smart Crew, üniversite entegrasyonu (sadece sözlü olarak bahsedilecek)

---

## 8. Netleştirilmesi Gerekenler
- Sunumun tam süresi
- Alt grupları dağıtmak için 7 kişiden kimlerin Python/JS bildiği
