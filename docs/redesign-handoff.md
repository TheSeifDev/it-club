# IT Club — تسليم إعادة التصميم والـrefactor

## النسخة

تنفيذ مبني على المستودع `TheSeifDev/it-club` عند `bf6d21491221a9bf8c51e0408571b9382eac100a`. الموافقة على الخطة تمت في 18 نوفمبر 2026. هذا تسليم للمعاينة والفرع؛ ليس إطلاقًا إنتاجيًا.

## ما تغير

الموقع العام أصبح هوية رئيسية للنادي بدل حملة مقابلات: Home وAbout وCommunity والأعضاء وTracks وEvents وSponsors وAlumni وContact. بناءً على تصحيح المستخدم في 18 نوفمبر 2026، يعاد استخدام تكوين portfolio مباشرة مع Night/Paper/Logo Teal وradius بسيط وGSAP choreography وThree.js حقيقي، بدل اتجاه charcoal/emerald الموحد في النسخة الأولى. ألوان المسارات الستة الأصلية محفوظة، والإنجليزية أساسية مع عناوين عربية طبيعية داخل المحتوى، دون نسخة عربية منفصلة أو رموز يابانية. يعرض الهيكل المعتمد من الكود ويستبعد Head PR من العرض العام.

بوابة الموظفين وواجهات المقابلات انتقلت إلى `/interview/...`، بما فيها `/interview/login`. مسار `/login` وواجهات العمليات القديمة تحت `/admin/...` لها تحويلات انتقائية. لم تتغير `/api/admin/...` ولا وجهة الـcron. المسار `/admin` أصبح Content Studio جديدًا للـowner فقط؛ تسجيل دخوله عبر `/interview/login?mode=content`. لا تمنح قيمة `next` صلاحيات CMS ولا يُوثق دور في metadata العميل.

CMS يملك نماذج محددة للأشخاص والـboards والمسارات والفعاليات والرعاة والإعلانات والصفحات. حفظ تعديل لا يبدل snapshot الجمهور إلا عند Publish؛ توجد حالة archive وrestore لمسودة، نوافذ ظهور، وحماية من تعارض revisions. صفحات CMS المنشورة تظهر تحت `/pages/[slug]`. القراءة العامة والجلسات وsitemap تحدث وقت الطلب، ولا تتجمد بيانات المعاينة في build بدون مفاتيح.

تحسينات الأمان تشمل اعتمادات موظفين مؤقتة فريدة بدل كلمة مرور مشتركة، إخفاء الرقم القومي الكامل وحقول المراجعة عن الطالب، تضييق نطاق اللجنة، والتحقق من حالة المرشح وQR عند التقييم. سياسة RLS الجديدة منفصلة وتحتاج تطبيقًا ومراجعة في قاعدة تطوير قبل اعتمادها.

## الوضع المثبت محليًا

| الفحص | النتيجة |
|---|---|
| اختبارات auth/routing وCMS والمحتوى العام والألوان/العربية المعزولة | 29 اختبارًا ناجحًا؛ استخدم `npm run test:pure` |
| TypeScript وESLint للمصدر الجديد | ناجحان |
| Next.js production build | ناجح بعد تفعيل SSR؛ كل صفحات المحتوى والجلسات وsitemap ديناميكية |
| صفحات النادي في HTTP المحلي | 200 مع عناوين حقيقية لكل صفحة |
| ملف شخصي معروف `/community/seif-ayman` | 200 مع metadata خاصة بالشخص |
| `/pages/not-published` | 404 حقيقي |
| `/admin` دون جلسة | 307 إلى `/interview/login?mode=content` |
| `/interview` دون جلسة | 307 إلى `/interview/login` |
| `/admin/applications` القديم | 307 إلى `/interview/applications` |
| `manus-routes.json` | 29 صفحة من شجرة App Router الفعلية |

الـsuite القديم الكامل احتوى 390 اختبارًا: نجح 340 وفشل 50 في هذه البيئة. الفشل يشمل توقعات تعتمد على إعداد Supabase وSMTP غير الموجود وبعض assertions القديمة؛ ليس إثبات نجاح تدفقات البيانات. لا نغير رد 503 الصحيح لخدمة غير مهيأة إلى نجاح وهمي لإرضاء الاختبارات. بعد المراجعة، أضيف حارس HTTP يمنع الاتصالات الخارجية افتراضيًا. لا تشغل اختبارات التكامل إلا مع `RUN_SUPABASE_INTEGRATION_TESTS=true` ومتغيرات `SUPABASE_INTEGRATION_TEST_*` لمشروع اختبار معزول، لا الإنتاج.

## ما يلزم قبل الإطلاق

أدخل إعداد Supabase لمشروع تطوير معزول عبر إدخال الأسرار المحمي، ثم راجع وطَبّق migrations الجديدة فيه: `202611180001_staff_committee_rls.sql` و`20261118173840_site_content_cms.sql`. تحقق من سياسات الموظفين والـowner والأعضاء والـstorage على المخطط الفعلي؛ لم تُطبق هذه migrations أثناء التنفيذ.

استورد المرجع من CMS بإجراء الـowner الصريح، ثم راجع البيانات. الأسماء والصور والأدوار المؤكدة مرئية في المعاينة غير المهيأة مع وصف مهمة اللجنة فقط؛ الأعضاء المستوردون يظلون مسودات حتى إضافة المسؤوليات الفردية الفعلية. لا تُنشر أحداث قديمة أو مواعيد أو أرقام غير معتمدة.

التواصل والشراكة يحفظان الاستفسار في `site_inquiries` عند نجاح الخادم فقط؛ لا يوجد ادعاء أنه أُرسل بالإيميل. لا توجد شاشة inbox للـowner أو إعداد بريد إضافي ضمن هذا التسليم؛ المتابعة حاليًا عبر سجل الاستفسارات في قاعدة البيانات. الرفع يحتاج bucket وسياساته قبل العمل.

تظل مراجعة owner لمسؤوليات الأشخاص، فحوص CRUD/RLS والتسجيل والتفعيل والمقابلات على قاعدة التطوير، ثم الدمج والإطلاق خطوات منفصلة. لا يوجد تعديل تلقائي لـGitHub main أو للدومين الحي.

## مواقع الحركة والتصميم الثانية

`src/components/site/motion/scenes.ts` يملك GSAP Hero masked entrance، تداخل Paper، كشف خطوط About بدون تبهت النص المقروء، Identity pin/scroll، وShowcase أفقي محسوب من العرض الحقيقي مع تنظيف كامل عند تغيير المسار/viewport. `motion/filter-motion.ts` يملك GSAP Flip لفلاتر المجتمع. `SkillsMarquee.tsx` يعرض قدرات اللجان الموثقة مع Pause، وإيقاف hover/focus وreduced-motion.

`src/components/site/visuals/ClubNetwork.tsx` و`lib/visuals/club-network-scene.ts` يملكان Three.js WebGLRenderer الحقيقي. حدث `club:network` ينقل progress من GSAP إلى الدوران والعمق والخامات. مشهد شبكي مضاء مع core ثلاثي الأبعاد وعناقيد بالألوان الستة، لا صورة تدعي أنها 3D. التحميل قريب الشاشة، والرسم فقط عند الظهور الفعلي؛ DPR1 للأجهزة المتوسطة وحتى1.5 لغيرها. الأجهزة منخفضة الموارد أو reduced-motion أو WebGL failure ترى fallback، مع disposal لكل مورد.

`lib/ui/track-theme.ts` يحفظ الألوان والعناوين العربية الأصلية من `tracks-data.ts` ويشتق درجة النص المقروءة على Paper. عناوين/فلاتر المسارات لا تعتمد على اللون وحده. صور Hero الافتراضية تستخدم cutouts الأصلية؛ صورة CMS المخصصة المعتمدة لها الأولوية. الإنجليزية أساسية والعربية جزء طبيعي من المحتوى، لا نسخة منفصلة.

المراجعة المستقلة رصدت وصُححت: selector الهوية المثبتة، layout غير المثبت في document flow، فصل preload عن render visibility، منع reveal timelines متنافسة، تباين labels على ألوان المسارات، بقايا الأخضر في Hero، وتنسيق newline. إصلاح allowedDevOrigins يعالج حجب HMR في المعاينة، دون تغيير حراس المصادقة أو CSP الإنتاجية.

في فحص المتصفح للنسخة المصححة: Identity مُثبت والعرض الأفقي مُفعل، وحدث `club:network` حمل progress≈0.525 أثناء التمرير. ظهر `data-webgl=ready` وcanvas578×578/DPR1 فعليًا على جهاز deviceMemory4/cores6؛ يُخفض DPR على الأجهزة المتوسطة بدل حذف المشهد. هذه ملاحظة تشغيل وليست benchmark أداء.

## إعادة ضبط Hero وPractice والكروت — ملاحظات المستخدم الأخيرة

`HomeHero.tsx` يفصل Hero عن صفحة البيانات، مع شعار النادي الأصلي ذي alpha كبيرًا خلف الأشخاص، دون دائرة أو لوح خلف الشعار أو إطار مجموعة مستطيل. glow وdrop-shadow عند hover/focus، وpointer spotlight عبر `motion/spotlight.ts`. لوحة العرض الأولى تحافظ على صور CMS المخصصة وأسماء/أدوار المنشور.

`ClubPractice.tsx` يستخدم عنوانًا متوازنًا ونصوصًا داكنة مقروءة وصورة workbench تقنية جديدة بدل spotlight-stage. الصورة editorial مولدة وليست توثيقًا لحدث أو صورة أعضاء؛ الملف الحقيقي WEBP1920×1440 بحجم163134 بايت، في `public/manus-storage/async-images/sRVj1Lb2UBtRXgo0s9Dro9/image-1.webp`. مساره النسبي الرسمي كما عاد من Managed Storage محفوظ؛ أدرج الأصل أيضًا في public لعمل فرع GitHub/Vercel دون الاعتماد على بوابة Manus. لا توجد صورة توليد placeholder في الفرع.

`TrackShowcase.tsx` يتبع featured cards في مرجع https://theseif.vercel.app/ : Paper panel، كروت Night2 عريضة، media/copy يتبادلان الجانب، capabilities موثقة، أسهم وspotlight وprogress فعلي في الوضع الأفقي فقط. لا يعرض 01/00 عند غياب tracks منشورة. التابلت/touch والـreduced-motion يحتفظون بقائمة قراءة متتابعة بدون pin مضلل.

Logo Teal `#28cdb7` وTeal Ink `#087969` يحلان محل Light Blue في الواجهة والمشهد. درجة النص على Paper تباينها4.83:1. الشعار نفسه هو الأصل، لم تُرسم هوية بديلة؛ درجة accent اختيرت أكثر خضرة وفق الطلب لا كادعاء تطابق كل بكسل. ألوان المسارات الستة لم تتغير.

الـ3D ذو alpha يبقى مرتبطًا بـGSAP، مع إزالة الـroot background والـpseudo backdrops المستطيلة وإعادة تلوين الخامات المحايدة والضوء إلى teal. النظافة وDPR والـoffscreen stop وfallback كما هي. لا يتضمن هذا التعديل أي تغيير مصادقة أو API أو migration أو كتابة قاعدة بيانات أو إطلاق إنتاجي.


في التحقيق المرئي المحدد لملاحظات المستخدم: شعار Hero له background شفاف وborder0؛ فعال spotlight مع إحداثيات المؤشر. Identity فعّل pin ووصل WebGL إلى ready مع خلفية host/canvas rgba(0,0,0,0) وتقدم0.525 تقريبًا. Showcase مثبت بارتفاع1100px في viewport1100px وكرت570px مع counter يتغير أثناء التمرير. بقي progressbar داخل الشاشة، وصُحح تحديث aria-valuenow إلى عنصر role الصحيح. أزيل blur كامل بعرض header فوق Paper مع بقاء blur الكبسولات. لا تُقدّم هذه الملاحظات كقياس FPS.


## تحديث About / Tracks / layouts — الإصدار الرابع

- About في Header/Footer أصبح /#about مع section فعلي في Home؛ /about القديم يحول إلى Home ولا يظهر صفحة مستقلة في sitemap.
- Home tracks أصبح full-width stacked sections بمشهد GSAP منفصل، لا slider أفقي. يصعد كل لوح فوق السابق ويتراجع السابق قليلاً، مع العداد والتقدم الأصليين. hook العداد منفصل عن حالة اللوح، والاختيار يتبع timeline الفعلية حتى مع scrub؛ keyboard jumps تهبط بعد اكتمال ظهور اللوح. الفوكس ينتقل إلى stage مستقرة قبل جعل اللوح السابق inert، ولا يُسرق عند scroll إذا كان خارج اللوح.
- unpinned/reduced-motion/compact flow يملك height فعلية لكل الأقسام؛ لا تتراكب عليه Skills/الصفحات التالية. pin يبدأ تحت Nav بمسافة96px.
- /tracks معرض SSR rich مع jump index، هوية ومشاهد HR/PR/SM/OC/IT/R&D، قدرات ومسؤوليات منشورة تسبق المرجع الثابت وروابط أفراد منشورين فقط؛ لا صور أحداث أو screenshots أو إنجازات مختلقة.
- Nav يحتفظ بالكبسولات، height52px، padding متوازن، خلفيات opaque دون backdrop-filter، mobile menu وEscape وحلقة focus؛ لا طبقة blur تتغير أثناء scroll.
- مراجعات قراءة مستقلة لـCommunity/Profiles/Events/Sponsors/Alumni/Contact أصلحت header offset/أعمدة الصور المفقودة/tablet stacking/title wrap/back-link spacing/سهم الراعي غير المرتبط، مع إزالة hairline/border decoration. حقول Contact تبقى واضحة بسطح وخلفية وفوكس، ولا تتغير APIs/auth/CMS/المقابلات.
- نجحت29/29 فحوص pure، وTypeScript وESLint. نجح البناء النهائي بعد دمج هذه الإصلاحات؛ تُحفظ النسخة على نفس فرع العمل. لا يوجد نشر أو كتابة إنتاجية.


الدليل المرئي النهائي: عند viewport1280×1100، Header computed backdrop-filter=none، height52px، top16px؛ stage pinned يبدأ96px ويبلغ720px، العداد04/06 يطابق لوح OC الظاهر، وCTA والنص ينتهيان داخل حدود اللوح. overflow89px ناتج عن الرقم الزخرفي المقصوص عمدًا، لا عن قص النص. progressbar42 يتبع timeline المعروضة؛ هذه ليست دعوى FPS أو اختبارات أجهزة حقيقية.


## Community وTracks — الإصدار الخامس

`CommunityPersonCard.tsx` بطاقة صور مشتركة للقيادة والدليل، بأسماء كاملة وأدوار ولجنة وTEAM FOCUS من المصدر المعتمد وروابط profiles؛ الصورة الحقيقية أو initials عند غيابها. `.leadershipGrid` يتكيف مع عدد القادة الفعلي على desktop، و`.directoryGrid` يعرض4/3 أعمدة على desktop، عمودين على tablet، وعمودًا مقروءًا على الجوال الصغير. البحث وفلاتر اللجان العربية والإنجليزية والعدد وaria-pressed وGSAP Flip محفوظة، ولا تُستخدم `.site-member-row` التي كانت تحول الأشخاص إلى صفوف تحت بعض. لا يُحذف عضو أو يُخترع منصب أو وجه جديد.

`public-design.css` مرجع Night/Paper/Logo Teal/RGB والطباعة والـgutter1400px والـradius المشترك، scoped عبر `.site-root[data-design="club"]`. HomeHero وCommunity وTracks يستخدمونه، بدل قيم Tracks القديمة#121413/#f0eee5. صفحة Tracks تحتفظ بالاستعراض والوسائط وقدرات المسارات والروابط الستة وروابط أفراد منشورين، لكن بتكوين Home وPaper panels وmixed-case typography؛ النص يظهر كاملًا بعد GSAP entrance بدل scrub fade المستمر. الـmotion teardown محدود بسياق الصفحة ولا يقتل مشاهد أخرى.

مراجعة مستقلة والتصحيح المرئي أغلقت: missing2-column tablet rule، RGB slash syntax مع tokens comma-separated، تباين activefilter على اللون الخام، خطوط boards/labels الزخرفية، والخلفيات القديمة داخل Hero. في viewport1280×1100 ظهر الدليل24 بطاقة/4 أعمدة وأول أربع بطاقات على نفسY؛ بحثSamir رجع1 ثم no-match0 ثم عاد24 بعد مسح البحث. لا توجد legacyRows. الألوان المقرؤة من DOM: Night#05070a/Paper#f3f4f6/Teal#28cdb7/max1400px؛ مشهدIT حافظ على الـanchor وcopy opacity1 وNav blur=none وبدون overflow أفقي. هذه ملاحظات تشغيل وليست قياسFPS أو فحص أجهزة حقيقية. فحوص29/29 pure وTypeScript وESLint ناجحة؛ نجح أيضًا Next.js production build النهائي لهذا الإصدار من دون خدمة dev متزامنة. لا تعديلAPI/Auth/CMS أو migration أو كتابة قاعدة بيانات أو نشر إنتاجي ضمن هذا الإصدار.


تأكيد آخر قبل الحفظ: عُدّلت26 قاعدةRGB في Tracks إلىrgba(var(--site-*-rgb),alpha) الصحيحة. مشهدIT الفعلي له backgroundrgb(243,244,246)، textInk rgb(10,13,18)، radius12px، وmediaNight3 rgb(17,21,27). لا تعتمد الهوية على fallback غير مُطبق، والـglow/text alpha يعملان بمرجع واحد. قياسات desktop والبحث فعلية؛ قواعد tablet/mobile/reduced-motion مراجعة في الكود دون ادعاء جهاز حقيقي.
