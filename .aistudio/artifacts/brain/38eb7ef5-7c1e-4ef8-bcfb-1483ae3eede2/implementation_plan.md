# ARGON F1 — Ultimate Formula 1 Team Principal, Management & Racing Simulator

ARGON F1, bir Formula 1 takımının pist üstü yarış stratejisinden fabrika Ar-Ge süreçlerine, pilot/personel sözleşme müzakerelerinden yönetim kurulu politikalarına, FIA mali/teknik denetimlerinden 2B/3B canlı yayın simülasyonuna kadar tüm ekosistemini simüle eden kapsamlı bir takım patronu ve yarış yönetim simülatörüdür.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Kullanıcı Onayı ile Kesinleşen Mimari ve Kapsam Kararları**
> Aşağıdaki tercihler doğrultusunda ilk sürümde temel mimariyle sınırlı kalınmayıp, **Faz 1–6 tam oynanabilir yönetim ve yarış motoru + 3B Görselleştirme + Takım Tasarım Stüdyosu** uçtan uca entegre şekilde inşa edilecektir.

- **Kapsam & Teslimat (Onaylandı)**: Faz 1–6 tam oynanabilir simülasyon (Kariyer/Kurulum, Takım/Pilot/Personel Yönetimi, Finans & Sponsorluk, Bağımsız AI Rakip Takımlar, Ar-Ge & Araç Geliştirme, Canlı Yarış Simülasyonu) + Three.js tabanlı 3B Pist/Araç Görünümü ve Yaratıcı Takım Tasarım Stüdyosu (Logo, Livery, Kask, Tulum, Garaj).
- **Veritabanı & Tarihsel Sezonlar (Onaylandı)**: 2026 güncel regülasyon ve grid veritabanı varsayılan olarak sunulacak; ayrıca 2000–2025 arası ikonik tarihsel sezonlar (V10 dönemi 2004, Brawn GP 2009, Hibrit başlangıcı 2014, 2021 şampiyonluk mücadelesi vb.) döneme özgü puanlama, lastik, bütçe sınırı ve teknik kurallarıyla seçilebilir olacak.
- **Yarış Hafta Sonu & Canlı Yayın Deneyimi (Onaylandı)**: Gerçek zamanlı 2B/3B pist telemetrisi, F1 TV tarzı canlı zamanlama kulesi (Timing Tower), sektör renkleri, lastik aşınma/sıcaklık fizikleri, hava durumu geçişleri, Safety Car/VSC/Kırmızı Bayrak prosedürleri ve anlık strateji/telsiz komutları.
- **Sözleşme Müzakereleri & Takım Telsizi (Onaylandı)**: Hem stratejik çoktan seçmeli diyalog opsiyonları hem de oyuncunun kendi cümlelerini yazabildiği serbest metin (ve Web Speech API sesli okuma/komut) destekli dinamik müzakere ve telsiz motoru.

---

## 1. Overview & Core Concept

- **Ne Yapar?**: Oyuncuya mevcut bir Formula 1 takımını yönetme veya varsayılan olarak **Senin Takımın** (tamamen özelleştirilebilir) adıyla sıfırdan bir takım kurma imkanı verir. Takım Sahibi (Team Owner), Takım Patronu (Team Principal), Sandbox, Senaryo ve Tarihsel Sezon (2000–2026) modlarını içerir.
- **Hedef Kitle & Deneyim**: Derin strateji, motor sporları mühendisliği, iş dünyası simülasyonu ve canlı yarış yönetimini profesyonel bir yayın arayüzünde deneyimlemek isteyen oyuncular. Varsayılan dil eksiksiz **Türkçe** olup, anlık **İngilizce** dil geçişi desteklenir.
- **Temel Değer Önerisi**: Görsel tasarım ile mühendislik performansını birbirinden ayıran gerçekçi simülasyon; kendi kararlarını veren bağımsız AI rakip takımlar; tüm veriyi çevrimdışı (offline-first) olarak **IndexedDB** üzerinde çoklu kayıt slotu ve JSON yedekleme/geri yükleme ile saklayan kalıcı dünya.

---

## 2. User Experience & Visual Design

- **Temel Kullanıcı Akışları**:
  1. **Oyun Kabuğu & Başlangıç Ekranı (Title Screen)**: Tam ekran sinematik 3B garaj/araç sahnesi üzerinde özel SVG ARGON F1 logosu, hızlı devam et / yeni kariyer / kayıt yükle aksiyonları ve ses/tema/dil kontrolleri.
  2. **Oyun Modu & Sezon Seçimi**: Takım Sahibi Kariyeri, Takım Patronu Kariyeri, Tarihsel Sezonlar (2000–2026), Senaryo Modu (6 özel mücadele) ve Sandbox Modu.
  3. **Takım Seçimi & "Senin Takımın" Tasarım Stüdyosu**: Mevcut bir takımı devralma veya özel takım oluşturma; interaktif SVG Logo Editörü, 2B/3B Araç Livery Editörü, Pilot Kaskı, Yarış Tulumu ve Garaj/Karargah özelleştirme.
  4. **Karargah (HQ) & Yönetim Merkezi**: Organizasyon şeması (Teknik Direktör, Baş Aerodinamist, Yarış Mühendisleri, Pit Ekibi, Akademi), Pilot profilleri (sağlık/kondisyon, moral, kişilik, roller), İnteraktif Sözleşme Müzakere Odası, Transfer Pazarı, Finans & Cost Cap Denetimi, Tesis İnşası, Ar-Ge & Parça Üretimi, Yönetim Kurulu & Medya/Basın Toplantıları.
  5. **Yarış Hafta Sonu & Canlı Yarış Yayını (Broadcast HUD)**: Antrenman (kurulum ve alışma), Sıralama Turları ve Canlı Yarış. Sol kenarda canlı zamanlama kulesi, merkezde %85+ engelsiz 2B/3B pist ve çoklu kamera görünümü (Broadcast, Onboard, Cockpit, Nose, Helicopter, Pit Lane), alt kenarda daraltılabilir (collapsible) Pit Duvarı Strateji ve Telsiz Dock'u.

- **Görsel Kimlik & Tema**:
  - *Estetik Yönelim*: Profesyonel motor sporları telemetri ve yayın arayüzü. Koyu modda (`dark`) derin karbon/obsidyen zeminler (`#090D16`, `#111827`), açık modda (`light`) teknik platin/gümüş yüzeyler (`#F8FAFC`, `#FFFFFF`).
  - *Renk Paleti & Durum Sinyalleri*:
    - 60% Nötr Karbon/Platin Zemin, 30% Yapısal Paneller (`1px solid` ince teknik sınırlar), 10% Argon Yarış Kırmızısı (`#E11D48` / `#EF4444`) ve Telemetri Camgöbeği (`#06B6D4`).
    - Sektör & Lastik Renkleri: Mor (`#A855F7` - En Hızlı Sektör), Yeşil (`#22C55E` - Kişisel En İyi), Sarı (`#EAB308` - Yavaşlama/Sarı Bayrak), Yumuşak Lastik (Kırmızı), Orta (Sarı), Sert (Beyaz), Geçiş/İnter (Yeşil), Yağmur/Wet (Mavi).
  - *Tipografi & Hiyerarşi*:
    - Başlıklar ve Hız/Sıralama Göstergeleri: `Chakra Petch` / `Oswald` (sportif, keskin geometrik).
    - Gövde ve Yönetim Metinleri: `Plus Jakarta Sans` (yüksek okunabilirlik).
    - Telemetri, Tur Zamanları ve Finansal Tablolar: `JetBrains Mono` (`tabular-nums` zorunlu dikey hizalama).

---

## 3. Key Product Decisions & Trade-Offs

- **Karar 1: IndexedDB Tabanlı Offline-First Kayıt ve Yedekleme Mimarisi**
  - *Seçilen Yaklaşım*: Tüm kariyer durumu, tarihsel istatistikler, özel takım logoları ve 3B livery tasarımları tarayıcı içi IndexedDB veritabanında çoklu slot, otomatik kayıt (autosave) ve `.json` dışa/içe aktarma (export/import) desteğiyle tutulur.
  - *Neden*: `localStorage` 5MB sınırına takılır ve büyük sezon/tasarım verilerinde bozulmaya yol açar. IndexedDB sınırsız çevrimdışı güvenilirlik sağlar.
- **Karar 2: Görsel Tasarım ile Mühendislik Performansının Kesin Ayrımı**
  - *Seçilen Yaklaşım*: Tasarım Stüdyosundaki renk, kaplama (mat/metalik/karbon) ve çıkartmalar yalnızca görsel kimliği ve sponsor görünürlüğünü etkiler. Araç hızı ise Ar-Ge departmanında geliştirilen 11 ana parçanın (Ön/Arka Kanat, Taban, Difüzör, Sidepod, Süspansiyon, Soğutma, Güç Ünitesi, ERS, Şanzıman, Şasi) aerodinamik verimlilik, yere basma gücü (downforce), sürtünme (drag), ağırlık ve dayanıklılık parametrelerinden hesaplanır.
  - *Neden*: Gerçek bir mühendislik simülasyonu hissi vermek ve her Ar-Ge kararının (ör. yüksek downforce vs. yüksek sürtünme) pist tipine göre gerçek sonuçlar doğurmasını sağlamak.
- **Karar 3: İzole Three.js 3B Sahnesi + 2B Telemetri Geçişi ve Yazılım WebGL Koruması**
  - *Seçilen Yaklaşım*: 3B modda prosedürel çok parçalı F1 araç modelleri (`THREE.Group`: şasi, burun, ön/arka kanat, halo, sidepod, döner tekerlekler ve yağmur/kıvılcım efektleri) ve pist ortamı `useRef` ile izole edilmiş bir WebGL tuvalinde çalışır. Donanım ivmesi olmayan cihazlar otomatik algılanarak (`isSoftwareGl`) piksel oranı ve gölge maliyeti optimize edilir, ayrıca her an 2B Taktik Harita moduna kesintisiz geçiş yapılabilir.
  - *Neden*: Hem üst düzey görsel atmosfer hem de 60fps akıcı telemetri/strateji kontrolü sunar.

---

## 4. Technical Architecture & Data Strategy

### Sistem ve Bileşen Mimarisi

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ARGON F1 — UYGULAMA KABUĞU (UI)                       │
│  ┌────────────────────┐  ┌─────────────────────────┐  ┌───────────────────┐  │
│  │ Başlangıç & Modlar │  │ Karargah (HQ) & Yönetim │  │ Yarış & Yayın HUD │  │
│  │ • Kariyer / Sahip  │  │ • Pilot & Personel İK   │  │ • 2B Taktik Pist  │  │
│  │ • Tarihsel (00-26) │  │ • Müzakere & Transfer   │  │ • 3B Three.js     │  │
│  │ • Senaryo & Sandbox│  │ • Ar-Ge & Tasarım Stüd. │  │ • Telsiz & Pit    │  │
│  └─────────┬──────────┘  └────────────┬────────────┘  └─────────┬─────────┘  │
└────────────┼──────────────────────────┼─────────────────────────┼────────────┘
             │                          │                         │
             ▼                          ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    MERKEZİ SİMÜLASYON & OYUN MOTORU (CORE)                   │
│                                                                              │
│  ┌────────────────────────┐   ┌────────────────────────┐   ┌──────────────┐  │
│  │  Takım & Ekonomi Motoru│◄─►│ Bağımsız AI Takımlar   │◄─►│ FIA & Kurallar│  │
│  │  • Bütçe & Cost Cap    │   │ • AI Bütçe & Ar-Ge     │   │ • Ceza/İnceleme│ │
│  │  • Sponsor & Yönetim K.│   │ • AI Transfer & Teklif │   │ • Sezon Reg. │  │
│  └───────────┬────────────┘   └───────────┬────────────┘   └──────┬───────┘  │
│              │                            │                       │          │
│              ▼                            ▼                       ▼          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                 CANLI YARIŞ & FİZİK SİMÜLASYON MOTORU                  │  │
│  │  • Sektör/Tur Zamanı Hesaplayıcı (Aero + Mekanik + Güç + Pilot + Pist) │  │
│  │  • Lastik Aşınma/Sıcaklık, Yakıt, ERS, DRS, Kirli Hava & Geçiş Fiziği  │  │
│  │  • Dinamik Hava Durumu, Safety Car / VSC / Kırmızı Bayrak & Pit Stop   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                 VERİ KATMANI & KALICILIK (PERSISTENCE LAYER)                 │
│  • IndexedDB Kayıt Motoru (Otomatik Kayıt, Çoklu Slot, JSON Yedek/İçe Aktar) │
│  • 2000–2026 Sezon, Pist, Takım, Pilot, Personel ve Kural Veritabanı         │
│  • Web Audio API Prosedürel Motor/Telsiz Sesi & Web Speech API Türkçe Sentez │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Veri Modeli ve Durum Yönetimi
- **`CareerState`**: Seçili oyun modu (`owner` | `principal` | `historical` | `scenario` | `sandbox`), aktif sezon yılı (`2000`–`2026`), mevcut hafta/takvim sırası, oyuncu takım ID'si, yönetim kurulu güveni, finansal defter, aktif olaylar/politikalar ve mesaj kutusu.
- **`TeamEntity`**: Kimlik, bütçe, Cost Cap harcaması, itibar, tesis seviyeleri (Fabrika, Rüzgar Tüneli, CFD, Simülatör, Pit Eğitim, Tıp Merkezi), araç konsepti, 11 teknik bileşen durumu, görsel tasarım paketi (`LogoDesign`, `LiveryDesign`, `UniformDesign`, `GarageDesign`), sponsor sözleşmeleri ve AI strateji profili.
- **`DriverEntity` & `StaffEntity`**: Yaş, uyruk, 10+ teknik yetenek (Hız, Yarış Zekası, Sıralama, Yağmur, Lastik Koruma, İstikrar, Geri Bildirim, Kondisyon), sağlık durumu (`Sağlıklı`, `Yorgun`, `Hafif Sakatlık`, `Yarışamaz`), moral, kişilik özellikleri, rol (`Birinci Pilot`, `İkinci Pilot`, `Eşit`, `Yedek`, `Akademi`) ve detaylı sözleşme maddeleri.
- **`RaceSessionState`**: Pist verisi (uzunluk, viraj sayısı, DRS bölgeleri, aşındırıcılık, geçiş zorluğu), anlık hava durumu ve tahmin doğruluğu, pist durumu (`Yeşil`, `Sarı`, `VSC`, `Safety Car`, `Kırmızı Bayrak`), 20 aracın anlık pist konumu, sektör zamanları, lastik hamuru/yaşı/sıcaklığı, ERS/Yakıt modu, pit penceresi, FIA incelemeleri ve canlı takım telsizi akışı.

### Etkileşimli Bileşen ve Durum Eşleşmesi
- **Sözleşme ve Transfer Müzakereleri**: Oyuncu maaş, süre, imza/şampiyonluk primi, takım içi statü ve çıkış maddesini ayarlar veya serbest metinle vaatlerde bulunur -> Müzakere motoru pilotun hırs, sadakat, takım itibarı ve rakip tekliflerini tartarak anında kabul, karşı teklif veya red yanıtı üretir.
- **Ar-Ge ve Tasarım Stüdyosu**: Görsel editörde yapılan SVG logo ve 3B araç boyama değişiklikleri anında Three.js showroom aracına ve tüm UI rozetlerine yansır. Mühendislik panelinde başlatılan parça tasarımları ise rüzgar tüneli/CFD saatlerini ve bütçeyi kullanarak üretim kuyruğuna girer.
- **Canlı Yarış Yönetimi**: Yarış sırasında hız çarpanı (`1x`, `2x`, `5x`, `Duraklat`), kamera açısı (`Broadcast`, `Onboard`, `Cockpit`, `Helicopter`, `2B Harita`), sürüş temposu, ERS kullanımı, pit çağrısı ve serbest/hazır telsiz komutları anlık olarak fizik motorunu etkiler; pilot kişiliğine göre telsizden Türkçe sesli/altyazılı yanıt verir.
