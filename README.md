# Yusif & Fatma — Foto kataloqu

Yusif və Fatma üçün Azərbaycan dilində hazırlanmış, responsiv foto qalereyası. İsti ivory, blush, muted rose və champagne tonları, hər səhifə girişində göstərilən zərif ad/ürək açılışı və tam ekran foto baxışı ilə.

## Fayllar

- `public/index.html` — göndərilmiş posterlə tam ekran giriş, foto divarı, böyük foto baxışı və gizli audio elementi.
- `public/images/cover.png` — girişdə istifadə edilən orijinal poster.
- `public/audio/incebellim.mp3` — istifadəçinin göndərdiyi fon musiqisi; ilk toxunuşdan sonra başlayır, görünən player yoxdur.
- `public/styles.css` — romantik palitra, responsiv editorial masonry qalereya, tam ekran baxış və PC üçün işıq izi ilə foto açılma keçidləri.
- `public/intro/intro.css` və `public/intro/intro.js` — toxunuşla başlayan fotolu kinematik giriş; ilkin ekranda xüsusi SVG ürək düyməsi, ürək konturu, polaroid xatirələr və əlçatan hərəkətsiz variant.
- `public/js/main.js` — foto qalereyası, tam ekran baxış, kitab səhifəsi çevirmə animasiyası (düymə, sürüşdürmə, klaviatura), ilk toxunuşda fon musiqisi və açılış animasiyasının idarəsi.
- `public/js/photos-data.js` — 457 foto siyahısı (`scripts/build_photos_js.py` ilə `photos.json`-dan yaradılır); sayt fayl kimi açılanda da işləsin deyə.
- `public/data/photos.json` — arxivdəki 477 faylın məlumatları; 20 fayl təkrardır.
- `public/photos/` — optimallaşdırılmış WebP fotoşəkillər.
- `scripts/prepare_gallery.py` — ZIP arxivindən WebP şəkillər və kataloq məlumatı hazırlayır.

Sayt statik fayllardan ibarətdir; poster və musiqi də layihənin içində olduğuna görə ZIP müstəqil işləyir. Hər səhifə girişində əvvəlcə mərkəzdə yalnız döyünən ürək düyməsi görünür; toxunuş və ya klaviatura ilə aktivləşdirmə kinematik intronu başladır, intro bitəndə əsas məzmun açılır. `prefers-reduced-motion` aktivdirsə sakit variant işləyir. Xəttatlıq şrifti Google Fonts-dan yüklənir, bağlantı olmadıqda sistem şriftlərinə keçir. Musiqi brauzerin autoplay qaydalarına uyğun olaraq ilk toxunuşda və ya klaviatura qarşılıqlı əlaqəsində səslənir.
