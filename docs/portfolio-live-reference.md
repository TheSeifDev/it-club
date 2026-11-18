# المرجع الحي — مراجعة 18 نوفمبر 2026

المصدر الذي حدده المستخدم: https://theseif.vercel.app/ . عُوين مباشرة في المتصفح، وملف النص الكامل الناتج في `/home/ubuntu/page_texts/theseif.vercel.app_.md`. المرجع المحلي للكود `/home/ubuntu/seif-repo`.

Hero يستخدم عنوانًا ضخمًا من سطرين وportrait خارج الإطار وتكوين full-bleed، وليس صندوق صور جانبيًا. خلفية اليابان تخص portfolio فقط ولا تُنقل للنادي. لوح About فاتح بطباعة قوية وصورة editorial، مع انتقال التمرير من Hero. Identity يفتح مشهد 3D بين شطري العبارة.

Featured projects: لوح Paper عريض داخل حقل Night مع radius ناعم، وشريط أفقي pinned. الكرت واسع بنسب متوازنة: منطقة media كبيرة ومنطقة معلومات منفصلة، ويعكس ترتيب media/copy في كل كرت ثانٍ. الكروت Night2 على اللوح الفاتح، border sheen وsurface glow يتبعان مؤشر الفأرة، تكبير الوسائط طفيف، وأزرار سهم تدور عند hover. توجد counter/progress/scroll hint. المصدر المحلي `components/home/featured-projects.tsx` و`components/motion/featured-scene.ts` و`components/system/project-media.tsx`.

المستخدم طلب هذا الأسلوب للكروت والاستعراض وتناسق كامل، لكنه عدّل accent النادي إلى درجة teal الخضراء-السماوية في اللوجو بدل Light Blue، مع بقاء ألوان tracks الأصلية. طلب Hero أقوى وشعار كبير خلف الأشخاص، بدون background أو border، مع shadow وhover glow. طلب إزالة backdrop المستطيل حول 3D، وإعادة تركيب THE CLUB, IN PRACTICE وتغيير صورة spotlight.

لا تُنقل المشاريع الشخصية أو سنوات الخبرة أو رموز اليابان أو إحصاءات portfolio إلى النادي. المحتوى العام المنشور وحقائق اللجان مصدر المضمون؛ استعارة التكوين والحركة فقط.
