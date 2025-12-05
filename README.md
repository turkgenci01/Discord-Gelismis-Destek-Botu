# Discord.js v14 Gelişmiş Destek Sistemi Botu

Modern ve kullanıcı dostu Discord destek botu. Kategori tabanlı ticket sistemi, geri bildirim özelliği ve otomatik log kayıtları ile donatılmıştır.

## 🚀 Özellikler

- **Otomatik Kurulum**: `/setup-destek` komutuyla tek tıkla kurulum
- **Kategori Sistemi**: Teknik Destek, Rapor, Satış İşlemi, Diğer
- **Geri Bildirim**: 5 yıldızlı puanlama ve yorum sistemi
- **Log Kayıtları**: Tüm ticket mesajları .txt dosyası olarak kaydedilir
- **İzin Yönetimi**: Kullanıcı başına tek ticket sınırı
- **Modern Arayüz**: Embed'ler, butonlar ve select menüler

## 📋 Kurulum

1. **Gereksinimler**:
   - Node.js v16.9.0 veya üzeri
   - Discord.js v14

2. **Bot Kurulumu**:
   ```bash
   npm install
   ```

3. **Konfigürasyon**:
   - `config.json` dosyasında `token` ve `clientId` alanlarını doldurun
   - Bot'u Discord Developer Portal'dan oluşturun
   - Gerekli izinleri verin (Manage Channels, Manage Roles, Send Messages, vb.)

4. **Başlatma**:
   ```bash
   npm start
   ```

## 🔧 Komutlar

### `/setup-destek`
- **Açıklama**: Destek sistemini kurar ve gerekli kanalları oluşturur
- **Yetkisi**: Yönetici
- **Oluşturulanlar**:
  - `Destek Ekibi` rolü
  - `ticket-category` kategorisi
  - `#destek` kanalı (ticket oluşturma)
  - `#geri-bildirim` kanalı
  - `#ticket-log` kanalı

### `/ticket-durum`
- **Açıklama**: Aktif ticket sayısını ve listesini gösterir
- **Yetkisi**: Herkes

## 🎟️ Ticket Süreci

1. **Ticket Oluşturma**:
   - Kullanıcı `#destek` kanalında kategori seçer
   - Otomatik olarak özel kanal oluşturulur
   - Sadece kullanıcı ve destek ekibi erişebilir

2. **Ticket Kapatma**:
   - Kullanıcı "Ticket'ı Kapat" butonuna basar
   - 1-5 yıldız arası puan verir
   - İsteğe bağlı yorum ekler
   - Tüm mesajlar .txt dosyası olarak kaydedilir
   - Kanal otomatik olarak silinir

## 📊 Veritabanı

JSON tabanlı basit veritabanı sistemi kullanılır:
- Sunucu ayarları
- Aktif ticket'lar
- Kanal ve rol ID'leri

## 🛠️ Dosya Yapısı

```
├── commands/           # Slash komutları
├── events/            # Bot event'leri
├── handlers/          # Command ve event handler'ları
├── utils/             # Yardımcı modüller
├── config.json        # Bot konfigürasyonu
├── database.json      # Veritabanı
└── package.json       # Proje ayarları
```

## 🎨 Özelleştirme

- `config.json` dosyasından renkler ve emoji'ler değiştirilebilir
- Ticket kategorileri `utils/ticketManager.js` dosyasından düzenlenebilir
- Embed tasarımları ve mesajlar özelleştirilebilir

## 📝 Notlar

- Bot'un sunucuda gerekli izinlere sahip olduğundan emin olun
- Kullanıcılar aynı anda sadece bir ticket açabilir
- Tüm ticket mesajları güvenli şekilde log kanalına kaydedilir
- Sistem tamamen Türkçe arayüze sahiptir

## 🔒 Güvenlik

- İzinler otomatik olarak ayarlanır
- Log kanalı sadece destek ekibine görünür
- Ticket kanalları sadece ilgili kullanıcı ve destek ekibine açık
- Tüm veriler yerel JSON dosyasında saklanır