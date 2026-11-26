# عقد إعادة التصميم الثانية

المرجع: `/home/ubuntu/seif-repo`، خصوصًا Hero / Identity / scenes.ts / featured-scene.ts. English-first وعناوين عربية طبيعية، لا Japanese، ألوان المسارات الأصلية، Night/Paper/Sky بدل charcoal/emerald؛ radius بسيط 8–20px. وظائف CMS/Auth لا تتغير. لا اتصال بيانات إنتاجية.

## حدود الملفات

UI: `app/page.tsx`, `app/globals.css`, `src/components/site/SiteUI.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx`, `CommunityDirectory.tsx`, `SkillsMarquee.tsx`, `app/tracks/page.tsx`, `app/community/page.tsx`. لا تعديل SiteMotion أو مجلدات motion/visuals.
GSAP: `src/components/site/SiteMotion.tsx`, `src/components/site/motion/*`. لا تعديل UI/CSS.
Three.js: `src/components/site/visuals/ClubNetwork.tsx`, `lib/visuals/club-network-*.ts`. لا تعديل package/lock أو UI.

## DOM selectors

Hero: `[data-hero]` (يمكن إبقاء data-site-hero)، inner `[data-hero-content]`, `[data-hero-title-line]` داخل overflow mask، `[data-hero-role]`, `[data-hero-copy]`, `[data-hero-actions]`, `[data-hero-portrait]`, `[data-hero-portrait-reveal]`, `[data-hero-bg]`, `[data-hero-bg-inner]`, `[data-hero-card]`, `[data-hero-meta]`, `[data-hero-shade]`.
Paper intro: `[data-club-about]`, `[data-about-line]`, `[data-about-art]`, `[data-about-art-img]`, `[data-about-statement]` كلماتها `[data-word]`.
Identity: `[data-club-identity] > [data-identity-pin]`, `[data-identity-heading]`, `[data-identity-half="a"]`, `[data-identity-half="b"]`, `[data-identity-copy="a"]`, `[data-identity-copy="b"]`, `[data-identity-visual]` يحتوي `<ClubNetwork />`.
Showcase: `[data-showcase] > [data-showcase-viewport] > [data-showcase-track] > [data-showcase-card]`. اختياريا `[data-showcase-progress]`, `[data-showcase-current]` لتتبع التقدم. Cards تضم الأسماء والقدرات الموثقة والألوان العربية/English.
Other routes: `[data-reveal]` و`[data-line-heading]` (SplitText إذا لزم). روابط/أزرار magnetic تحمل `[data-magnetic]`.

## React / CSS enhancement

`ClubNetwork` named export، props `{ className?: string }`. حجمه من الأب وCSS module خاص به، fallback مشهد ساكن ظاهر بدون JS. زخرفي فقط aria-hidden. GSAP يرسل `window.dispatchEvent(new CustomEvent('club:network', {detail:{progress:number}}))`; progress بين 0 و1 من Identity timeline. React يتعامل مع الحدث ويمرره لـhandle مشهد Three.js. pointer اختياري داخل renderer.

GSAP يضع `data-sequence="pinned"` على Identity فقط في `(min-width:1024px) and (min-height:760px)` والحركة مسموحة. CSS في تلك الحالة يعرض stage بارتفاع viewport مع visual مركزية وhalves على الجانبين؛ بدونها المحتوى يتدفق عموديًا. إزالة flag وcontext عند التغيير/unmount. Showcase يضع `data-showcase-mode="horizontal"` على section في desktop فقط وCSS يحوّل track إلى flex nowrap/cards viewport fraction؛ بدون flag البطاقات grid/stack. لا تخفِ محتوى قبل التهيئة. على reduced-motion لا pin ولا marquee loop ولا follow cursor.

## دليل الألوان

ملف `lib/ui/track-theme.ts` يُعده المنسق من `tracks-data.ts`، ويصدر `getTrackTheme(slugOrName)` لإرجاع `{ color, ink, rgb, arabic, short }`. UI يضع `--track-color`/`--track-rgb` و`--track-ink` لكل track وفلتر/عضو. لا تغييرات على schema CMS؛ الألوان مرجع ثابت من تعريفات المسارات الأصلية.
