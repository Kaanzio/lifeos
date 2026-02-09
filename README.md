# 🚀 LifeOS Portable
Kurulum · Senkronizasyon · Mobil & PWA Rehberi

LifeOS artık taşınabilir, mobil uyumlu ve veri senkronizasyonu destekli bir kişisel yaşam işletim sistemidir.
Web sitesi gibi değil, gerçek bir uygulama gibi çalışır.

Canlı Demo:
https://kaanzio.github.io/lifeos

---

## 📱 PWA – Telefona Uygulama Gibi Kurulum

LifeOS, Progressive Web App (PWA) olarak çalışır.

### iPhone (iOS)
1. Safari’de siteyi açın
2. Paylaş butonuna dokunun
3. Ana Ekrana Ekle seçeneğini seçin

### Android
1. Chrome’da siteyi açın
2. Sağ üst menüden:
   - Uygulamayı Yükle
   - veya Ana Ekrana Ekle

Kurulumdan sonra LifeOS, normal bir mobil uygulama gibi çalışır.

---

## 🔄 Veri Taşıma & Yedekleme (Hibrit Sistem)

LifeOS verileri sunucuya değil, cihazınızın tarayıcısına kaydeder.
Senkronizasyon tamamen sizin kontrolünüzdedir.

---

### 🔹 Yöntem A: Manuel Yedekleme (Hızlı & Basit)

Kurulum gerektirmez.

1. Profil sayfasına gidin
2. ⬇️ Yedeği İndir butonuna basın
3. Oluşan `.json` dosyasını başka cihaza gönderin
   - WhatsApp
   - Telegram
   - Email
4. Yeni cihazda LifeOS’u açın
5. Profil → ⬆️ Yedeği Yükle
6. Dosyayı seçin

Tüm verileriniz birebir geri yüklenir.

---

### 🔹 Yöntem B: Google Drive Senkronizasyonu (Otomatik)

Dosya taşıma ile uğraşmak istemeyenler için.

1. Google Cloud üzerinden bir Client ID oluşturun
2. LifeOS → Profil sayfasına gidin
3. Google Drive Senkronizasyon alanına Client ID’yi yapıştırın
4. Kaydet deyin

Artık:
- 📤 Drive’a Gönder
- 📥 Drive’dan Al

butonları ile tek tık senkronizasyon yapabilirsiniz.

---

## 🔐 Gizlilik & Güvenlik

- Site adresi herkese açıktır
- Başkaları sizin verilerinizi göremez
- Tüm veriler:
  - Notlar
  - Görevler
  - Ayarlar

yalnızca sizin tarayıcınızda (Local Storage) saklanır.

Başka biri siteye girdiğinde:
- Kendi boş LifeOS uygulamasını görür
- Sizin verilerinize erişemez

`.json` yedek dosyasını kimseyle paylaşmadığınız sürece verileriniz güvendedir.

---

## ✨ Yenilikler

### 📦 Sürüm 9.0
- Profil sayfası tek, büyük, yuvarlatılmış bir ana blok (Canvas) içinde toplandı
- 2 sütunlu simetrik yapı korundu
- İç kartlar daha belirgin kontrast ile sunuldu

---

### 📲 Sürüm 10.0 – Mobil & PWA

Round 13: PWA & GitHub Ready (Active)

- PWA desteği (manifest.json, service-worker.js)
- Çevrimdışı çalışma desteği
- Ana ekrana eklenebilir mobil uygulama
- Yeni uygulama ikonları
- GitHub’a yüklemeye hazır final dosyalar

---

## 🧠 Özet

- LifeOS kişisel, offline-first bir yaşam sistemidir
- Sunucu yok
- Hesap yok
- Takip yok
- Kontrol tamamen sizdedir
