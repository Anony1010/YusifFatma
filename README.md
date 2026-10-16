# Yusif & Fatma — Foto kataloqu

Yusif və Fatma üçün Azərbaycan dilində hazırlanmış, responsiv foto qalereyası. İsti ivory, blush, muted rose və champagne tonları, ilk ziyarətdə göstərilən zərif ad/ürək açılışı və tam ekran foto baxışı ilə.

## Fayllar

- `public/index.html` — göndərilmiş posterlə tam ekran giriş, foto divarı, böyük foto baxışı və gizli audio elementi.
- `public/images/cover.png` — girişdə istifadə edilən orijinal poster.
- `public/audio/incebellim.mp3` — istifadəçinin göndərdiyi fon musiqisi; ilk toxunuşdan sonra başlayır, görünən player yoxdur.
- `public/styles.css` — romantik palitra, responsiv editorial masonry qalereya, açılış animasiyası və tam ekran lightbox üslubları.
- `public/js/main.js` — foto qalereyası, tam ekran baxış, kitab səhifəsi çevirmə animasiyası (düymə, sürüşdürmə, klaviatura), ilk toxunuşda fon musiqisi və açılış animasiyasının idarəsi.
- `public/js/photos-data.js` — 457 foto siyahısı (`scripts/build_photos_js.py` ilə `photos.json`-dan yaradılır); sayt fayl kimi açılanda da işləsin deyə.
- `public/data/photos.json` — arxivdəki 477 faylın məlumatları; 20 fayl təkrardır.
- `public/photos/` — optimallaşdırılmış WebP fotoşəkillər.
- `scripts/prepare_gallery.py` — ZIP arxivindən WebP şəkillər və kataloq məlumatı hazırlayır.

Sayt statik fayllardan ibarətdir; poster və musiqi də layihənin içində olduğuna görə ZIP müstəqil işləyir. Açılış animasiyası ilk ziyarətdə bir dəfə göstərilir və `prefers-reduced-motion` aktivdirsə buraxılır. Musiqi brauzerin autoplay qaydalarına uyğun olaraq ilk toxunuşda və ya klaviatura qarşılıqlı əlaqəsində səslənir.
