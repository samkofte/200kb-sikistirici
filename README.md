# 200kb-sikistirici

Bu web uygulaması, yüklenen görselleri otomatik olarak 200KB boyutuna sıkıştırır. Görsel kalitesini mümkün olduğunca koruyarak boyutu küçültür.

Site Linki -> https://two00kb-sikistirici.onrender.com

## Özellikler

- Sürükle-bırak ile kolay görsel yükleme
- Otomatik 200KB boyutuna sıkıştırma
- Orijinal ve sıkıştırılmış boyut gösterimi
- Görsel önizleme
- Otomatik rastgele dosya adı oluşturma
- Tek tıkla indirme
- Gelişmiş güvenlik kontrolleri

## Güvenlik Özellikleri

- Dosya tipi kontrolü (sadece resim dosyaları)
- Dosya boyutu sınırlaması (max 20MB)
- Görsel boyutları kontrolü (min 50x50px, max 8000x8000px)
- Dosya adı sanitizasyonu
- XSS koruması
- Hata yönetimi ve kullanıcı bildirimleri

## Nasıl Kullanılır

1. Görseli sürükleyip bırakın veya "Görsel Seç" butonuna tıklayın
2. Görsel otomatik olarak sıkıştırılacak ve önizlemesi gösterilecektir
3. Orijinal ve yeni boyutları görebilirsiniz
4. "Sıkıştırılmış Görseli İndir" butonuna tıklayarak sıkıştırılmış görseli indirebilirsiniz
5. İndirme işlemi sırasında orijinal dosya adına rastgele 4 karakterli bir string eklenir (örn: "resim-Ax7B.jpg")

## Teknik Detaylar

- Görsel sıkıştırma işlemi tarayıcı üzerinde gerçekleştirilir
- Görseller JPEG formatında sıkıştırılır
- Binary search algoritması kullanılarak optimal sıkıştırma kalitesi bulunur
- Maksimum 10 deneme ile en iyi sonuç elde edilmeye çalışılır

## Gereksinimler

- Modern bir web tarayıcısı (Chrome, Firefox, Safari, Edge)
- JavaScript desteği

## Kurulum

1. Dosyaları bilgisayarınıza indirin
2. `index.html` dosyasını bir web tarayıcısında açın

## Not

Bu uygulama tamamen istemci tarafında çalışır ve görselleriniz sunucuya yüklenmez. Tüm işlemler tarayıcınızda gerçekleştirilir.
