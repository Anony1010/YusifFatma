# Yusif & Fatma — Foto kataloqu

Yusif və Fatma üçün Azərbaycan dilində hazırlanmış, sadə və responsiv foto kataloqu.

## Fayllar

- `public/index.html` — göndərilmiş posterlə tam ekran giriş, foto divarı, böyük foto baxışı və gizli audio elementi.
- `public/images/cover.png` — girişdə istifadə edilən orijinal poster.
- `public/audio/incebellim.mp3` — istifadəçinin göndərdiyi fon musiqisi; ilk toxunuşdan sonra başlayır, görünən player yoxdur.
- `public/styles.css` — posterə uyğun teal fon, responsiv düzülüş və minimal lightbox.
- `public/js/main.js` — 457 fərqli foto, tənbəl şəkil yüklənməsi, klaviatura ilə foto naviqasiyası və ilk istifadəçi qarşılıqlı əlaqəsində musiqi başlatma.
- `public/data/photos.json` — arxivdəki 477 faylın məlumatları; 20 fayl təkrardır.
- `public/photos/` — optimallaşdırılmış WebP fotoşəkillər.
- `scripts/prepare_gallery.py` — ZIP arxivindən WebP şəkillər və kataloq məlumatı hazırlayır.

Sayt statik fayllardan ibarətdir; poster və musiqi də layihənin içində olduğuna görə ZIP müstəqil işləyir. Musiqi brauzerin autoplay qaydalarına uyğun olaraq ilk toxunuşda və ya klaviatura qarşılıqlı əlaqəsində səslənir.
