# Builds the four tab sections of site/index.html and site/ar/index.html from one source, so both
# languages keep the same structure. Run: python3 tools/content.py  (rewrites the <section> blocks in place)
import re, os
ROOT = os.path.join(os.path.dirname(__file__), '..', 'site')
ARROW = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 14 14" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10L10 4M5 4h5v5"/></svg>'
ARROW16 = '<svg class="arrow" aria-hidden="true" width="16" height="16" viewBox="0 0 14 14" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10L10 4M5 4h5v5"/></svg>'
MAIL = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="14" height="10" rx="2"/><path d="M2.5 5l6.5 5 6.5-5"/></svg>'

def item(title, sub, inner, cls='it'):
    return (f'    <article class="{cls}"><button class="t" type="button" aria-expanded="false">{title}</button><p class="sub">{sub}</p>\n'
            f'      <div class="panel"><div><div class="in">\n{inner}\n      </div></div></div></article>')

def body(t): return f'        <p class="body">{t}</p>'
def meta(rows): return '        <dl class="meta">' + ''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in rows) + '</dl>'
def dashes(items): return '        <ul class="dash">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'
def steps(items): return '        <ol class="steps">' + ''.join(f'<li><b>{a}</b><span>{b}</span></li>' for a, b in items) + '</ol>'
def go(href, label): return f'        <a class="go" href="{href}" target="_blank" rel="noopener">{label} {ARROW}</a>'
def group(t): return f'    <p class="group">{t}</p>'
def plate(seed, tint): return f'        <wadi-plate class="vis" seed="{seed}" style="background:var({tint})"></wadi-plate>'

L = {
'en': dict(
  work_label='Selected work', services_label='What we do', about_label='About', contact_label='Get in touch',
  role='Role', year='Year', built='Built with', typical='Typical', includes='Includes',
  work=[
    ('The Little Theory', 'Online store · 2026',
     ['        <a class="vis" href="https://thelittletheory.com" target="_blank" rel="noopener" aria-label="Visit The Little Theory" style="background:var(--w5)"><img src="/img/little-theory.jpg" alt="" loading="lazy" decoding="async" width="1200" height="660"></a>',
      body('A curated concept store for children aged 0 to 12: clothing, toys, books and gift boxes from independent brands.'),
      ('meta', [('Role', 'Design, build'), ('Year', '2026'), ('Built with', 'Shopify')]),
      go('https://thelittletheory.com', 'Visit the store')]),
    ('Dune Coffee', 'Café website · 2026',
     [plate('Dune Coffee', '--w2'),
      body('A one-page site for a specialty café: the menu, opening hours and pickup orders over WhatsApp. Most visitors arrive from Google Maps, so it opens in under a second.'),
      ('meta', [('Role', 'Design, build'), ('Year', '2026'), ('Built with', 'Static site')])]),
    ('Sprout Siege', 'Game · 2026',
     ['        <a class="vis" href="https://sprout-siege.netlify.app" target="_blank" rel="noopener" aria-label="Play Sprout Siege" data-embed="https://sprout-siege.netlify.app" style="background:var(--w1)"></a>',
      body('Pixel-art tower defense, playable in the browser.'),
      ('meta', [('Role', 'Game design, code'), ('Year', '2026'), ('Built with', 'JavaScript')]),
      go('https://sprout-siege.netlify.app', 'Play the game')]),
    ('Clinic Queue', 'Booking tool · 2026',
     [plate('Clinic Queue', '--w3'),
      body('Online booking and reminders for a small dental clinic. Patients pick a time; the front desk sees the whole day at a glance, and fewer appointments are missed.'),
      ('meta', [('Role', 'Product, build'), ('Year', '2026'), ('Built with', 'Web app, SMS')])]),
    ('Lantern Nights', 'Ramadan campaign · 2025',
     [plate('Lantern Nights', '--w5'),
      body('A seasonal campaign for a local bakery: light one lantern each night, and the last one opens a gift. Made to be shared between friends.'),
      ('meta', [('Role', 'Concept, build'), ('Year', '2025'), ('Built with', 'Canvas, JavaScript')])]),
    ('Sun-Path Study', '3D / Spatial · 2026',
     ['        <a class="vis" href="https://backyard-sun.netlify.app/" target="_blank" rel="noopener" aria-label="Open Sun-Path Study" data-embed="https://backyard-sun.netlify.app/" style="background:var(--w3)"></a>',
      body('Sun and shade across a backyard through the year.'),
      ('meta', [('Role', 'Design, code'), ('Year', '2026'), ('Built with', 'Three.js')]),
      go('https://backyard-sun.netlify.app/', 'Open the study')]),
    ('Invoice Helper', 'Automation · 2025',
     [plate('Invoice Helper', '--w1'),
      body('Reads supplier invoices as they arrive and keeps one tidy spreadsheet up to date. It gives a shop owner back an hour every morning.'),
      ('meta', [('Role', 'Automation'), ('Year', '2025'), ('Built with', 'AI, Google Sheets')])]),
  ],
  services=[
    ('Websites', 'Clear, fast, mobile first',
     [body('Sites that turn visitors into enquiries. Easy for you to update after launch.'),
      ('incl', ['Design and build', 'Arabic and English', 'Edit text and photos yourself', 'Hosting and domain set up']),
      ('meta', [('Typical', '3 to 6 weeks')])]),
    ('Tools + automation', 'Less repetitive work',
     [body('Small AI-powered tools and workflows built around how your team already works.'),
      ('incl', ['A short look at how you work today', 'One tool or automation that saves real time', 'A walkthrough for your team']),
      ('meta', [('Typical', '2 to 4 weeks')])]),
    ('Interactive + games', 'Things people remember',
     ['        <wadi-scratch hint="Scratch to reveal" again="Scratch again"><div class="prize"><span class="big">20% off</span><span class="small">your first order</span><span class="foot">Sample campaign · your business here</span></div></wadi-scratch>',
      body('Playable pieces and interactive campaigns that people remember and share.'),
      ('incl', ['A campaign idea', 'The playable piece, on every phone', 'Simple results: plays, shares, codes used']),
      ('meta', [('Typical', '2 to 5 weeks')])]),
    ('Care + support', 'After launch, we stay close',
     [body('We keep your site and tools healthy after launch: updates, backups, small changes and a quick reply when something comes up.'),
      ('incl', ['Monthly updates and backups', 'Small changes each month', 'Replies within one working day']),
      ('meta', [('Typical', 'Monthly')])]),
  ],
  questions_label='Questions',
  questions=[
    ('What does a project cost?', 'A fixed quote, agreed first', 'After a short call we send a fixed quote, so you know the full cost before anything starts. Small sites and tools are usually the quickest to agree.'),
    ('How long does it take?', 'Usually two to six weeks', 'Most projects take two to six weeks. You see a working draft in the first week, then we refine it together.'),
    ('Arabic and English?', 'Both, from the first draft', 'Yes. Everything we build works in both languages, right to left and left to right, from the first draft.'),
    ('Can I update it myself?', 'Yes, and we show you how', 'We set things up so you can change text, prices and photos on your own, and walk you through it before launch.'),
  ],
  about=[
    ('Our story', 'Two partners, one studio', [body("We're two people from different fields who kept noticing the same thing: small businesses deserve better tools. So we joined forces to build them, together.")]),
    ('Background', 'Fintech, legal, AI', [body('Between us: years in fintech, a grounding in law, and a habit of automating anything repetitive. A useful mix for businesses that want things done properly.')]),
    ('Approach', 'Talk, build, launch',
     [body('Simple steps, no surprises.'),
      ('steps', [('Talk', 'A short call to understand your business and what would help most.'),
                 ('Draft', 'A working first version within a week, on your phone.'),
                 ('Refine', 'Small rounds together until it feels right.'),
                 ('Launch', 'We go live, show you around, and stay close after.')])]),
    ('Principles', 'What we hold to',
     [('incl', ['Clear over clever', 'Fast on every phone', 'Yours to keep and change', 'Arabic and English as equals'])]),
  ],
  brief=dict(title='Start a project', sub='A few taps, then send', need='What do you need?',
             needs=['Website', 'Tool or automation', 'Interactive', 'Not sure yet'],
             when='When would you like to start?', whens=['This month', 'In 1 to 3 months', 'Just exploring'],
             about='A line about your project', ph='We run a café in Jeddah and want…', send='Send the brief',
             note='Opens your email app with the brief filled in.'),
  contact=[('mailto:hello@wadi.studio', 'Email', 'hello@wadi.studio', 'mail'),
           ('#contact', 'WhatsApp', '+966 5X XXX XXXX', 'arrow'),
           ('mailto:hello@wadi.studio?subject=Book%20a%20call', 'Book a call', 'Email us a time that suits you', 'arrow'),
           ('#contact', 'Instagram', '@wadi.studio', 'arrow')],
  where='Jeddah, Saudi Arabia · local time <span id="clock">--:--</span><br>Sunday to Thursday, 9:00 to 18:00',
),
'ar': dict(
  work_label='أعمال مختارة', services_label='خدماتنا', about_label='من نحن', contact_label='تواصل معنا',
  work=[
    ('ذا ليتل ثيوري', 'متجر إلكتروني · 2026',
     ['        <a class="vis" href="https://thelittletheory.com" target="_blank" rel="noopener" aria-label="زيارة متجر ذا ليتل ثيوري" style="background:var(--w5)"><img src="/img/little-theory.jpg" alt="" loading="lazy" decoding="async" width="1200" height="660"></a>',
      body('متجر منتقى للأطفال من عمر يوم حتى 12 سنة: ملابس وألعاب وكتب وصناديق هدايا من علامات تجارية مستقلة.'),
      ('meta', [('دورنا', 'تصميم وبرمجة'), ('السنة', '2026'), ('التقنية', 'شوبيفاي')]),
      go('https://thelittletheory.com', 'زيارة المتجر')]),
    ('دون كوفي', 'موقع مقهى · 2026',
     [plate('Dune Coffee', '--w2'),
      body('موقع من صفحة واحدة لمقهى مختص: القائمة وأوقات العمل وطلبات الاستلام عبر واتساب. معظم الزوار يصلون من خرائط جوجل، لذلك يفتح في أقل من ثانية.'),
      ('meta', [('دورنا', 'تصميم وبرمجة'), ('السنة', '2026'), ('التقنية', 'موقع ثابت')])]),
    ('سبراوت سيج', 'لعبة · 2026',
     ['        <a class="vis" href="https://sprout-siege.netlify.app" target="_blank" rel="noopener" aria-label="العب سبراوت سيج" data-embed="https://sprout-siege.netlify.app" style="background:var(--w1)"></a>',
      body('لعبة دفاع عن الأبراج بأسلوب البكسل، تُلعب مباشرة في المتصفح.'),
      ('meta', [('دورنا', 'تصميم اللعبة وبرمجتها'), ('السنة', '2026'), ('التقنية', 'جافاسكربت')]),
      go('https://sprout-siege.netlify.app', 'العب الآن')]),
    ('كلينك كيو', 'أداة حجز · 2026',
     [plate('Clinic Queue', '--w3'),
      body('حجز وتذكير بالمواعيد لعيادة أسنان صغيرة. يختار المريض الوقت المناسب، ويرى موظف الاستقبال اليوم كاملًا بنظرة واحدة، وتقل المواعيد الفائتة.'),
      ('meta', [('دورنا', 'المنتج والبرمجة'), ('السنة', '2026'), ('التقنية', 'تطبيق ويب، رسائل نصية')])]),
    ('ليالي الفوانيس', 'حملة رمضانية · 2025',
     [plate('Lantern Nights', '--w5'),
      body('حملة موسمية لمخبز محلي: أضئ فانوسًا كل ليلة، والفانوس الأخير يكشف عن هدية. صُممت لتُشارك بين الأصدقاء.'),
      ('meta', [('دورنا', 'الفكرة والبرمجة'), ('السنة', '2025'), ('التقنية', 'كانفاس، جافاسكربت')])]),
    ('دراسة مسار الشمس', 'ثلاثي الأبعاد · 2026',
     ['        <a class="vis" href="https://backyard-sun.netlify.app/" target="_blank" rel="noopener" aria-label="افتح دراسة مسار الشمس" data-embed="https://backyard-sun.netlify.app/" style="background:var(--w3)"></a>',
      body('الشمس والظل في فناء منزل على مدار العام.'),
      ('meta', [('دورنا', 'تصميم وبرمجة'), ('السنة', '2026'), ('التقنية', 'Three.js')]),
      go('https://backyard-sun.netlify.app/', 'افتح الدراسة')]),
    ('مساعد الفواتير', 'أتمتة · 2025',
     [plate('Invoice Helper', '--w1'),
      body('يقرأ فواتير الموردين فور وصولها ويحدّث جدول بيانات واحدًا مرتبًا. يوفّر على صاحب المتجر ساعة كل صباح.'),
      ('meta', [('دورنا', 'أتمتة'), ('السنة', '2025'), ('التقنية', 'ذكاء اصطناعي، جداول جوجل')])]),
  ],
  services=[
    ('مواقع إلكترونية', 'واضحة وسريعة ومصممة للجوال أولًا',
     [body('مواقع تحوّل الزوار إلى استفسارات حقيقية، ويسهل عليك تحديثها بعد الإطلاق.'),
      ('incl', ['التصميم والبرمجة', 'بالعربية والإنجليزية', 'تعديل النصوص والصور بنفسك', 'إعداد الاستضافة والنطاق']),
      ('meta', [('المدة المعتادة', 'من 3 إلى 6 أسابيع')])]),
    ('أدوات + أتمتة', 'عمل متكرر أقل',
     [body('أدوات وسير عمل صغيرة مدعومة بالذكاء الاصطناعي، مبنية حول طريقة عمل فريقك الحالية.'),
      ('incl', ['نظرة سريعة على طريقة عملكم اليوم', 'أداة أو أتمتة واحدة توفّر وقتًا حقيقيًا', 'شرح عملي لفريقك']),
      ('meta', [('المدة المعتادة', 'من 2 إلى 4 أسابيع')])]),
    ('تجارب تفاعلية + ألعاب', 'أشياء يتذكرها الناس',
     ['        <wadi-scratch hint="امسح لتكشف المفاجأة" again="امسح مرة أخرى"><div class="prize"><span class="big">خصم 20%</span><span class="small">على طلبك الأول</span><span class="foot">حملة تجريبية · لنشاطك التجاري</span></div></wadi-scratch>',
      body('قطع قابلة للعب وحملات تفاعلية يتذكرها الناس ويشاركونها.'),
      ('incl', ['فكرة الحملة', 'التجربة التفاعلية، على كل جوال', 'نتائج واضحة: مرات اللعب والمشاركة والأكواد المستخدمة']),
      ('meta', [('المدة المعتادة', 'من 2 إلى 5 أسابيع')])]),
    ('رعاية + دعم', 'بعد الإطلاق، نبقى قريبين',
     [body('نحافظ على موقعك وأدواتك بعد الإطلاق: تحديثات ونسخ احتياطية وتعديلات صغيرة، وردّ سريع متى احتجت.'),
      ('incl', ['تحديثات ونسخ احتياطية شهرية', 'تعديلات صغيرة كل شهر', 'ردّ خلال يوم عمل واحد']),
      ('meta', [('المدة المعتادة', 'شهريًا')])]),
  ],
  questions_label='أسئلة شائعة',
  questions=[
    ('كم تكلفة المشروع؟', 'عرض سعر ثابت نتفق عليه أولًا', 'بعد مكالمة قصيرة نرسل لك عرض سعر ثابتًا، فتعرف التكلفة كاملة قبل أن نبدأ. المواقع والأدوات الصغيرة هي الأسرع عادةً.'),
    ('كم يستغرق؟', 'عادةً من أسبوعين إلى ستة', 'معظم المشاريع تستغرق من أسبوعين إلى ستة أسابيع. ترى نسخة أولية تعمل في الأسبوع الأول، ثم نحسّنها معًا.'),
    ('بالعربية والإنجليزية؟', 'باللغتين، من النسخة الأولى', 'نعم. كل ما نبنيه يعمل باللغتين، من اليمين إلى اليسار ومن اليسار إلى اليمين، منذ النسخة الأولى.'),
    ('هل أستطيع التعديل بنفسي؟', 'نعم، ونريك كيف', 'نجهّز كل شيء لتعدّل النصوص والأسعار والصور بنفسك، ونشرح لك ذلك قبل الإطلاق.'),
  ],
  about=[
    ('قصتنا', 'شريكان، استوديو واحد', [body('نحن شخصان من مجالين مختلفين، لاحظنا الشيء نفسه مرارًا: المشاريع الصغيرة تستحق أدوات أفضل. فاجتمعنا لنبنيها معًا.')]),
    ('خلفيتنا', 'تقنية مالية، قانون، ذكاء اصطناعي', [body('بيننا سنوات من الخبرة في التقنية المالية، وأساس في القانون، وعادة أتمتة كل ما يتكرر. مزيج مفيد للأعمال التي تريد إنجاز الأمور كما يجب.')]),
    ('طريقتنا', 'نتحدث، نبني، نُطلق',
     [body('خطوات بسيطة، بلا مفاجآت.'),
      ('steps', [('نتحدث', 'مكالمة قصيرة لنفهم عملك وما الذي سيفيدك أكثر.'),
                 ('نجهّز', 'نسخة أولى تعمل خلال أسبوع، على جوالك.'),
                 ('نحسّن', 'جولات قصيرة معًا حتى يصبح كما تريد.'),
                 ('نُطلق', 'ننشره، ونريك كيف يعمل، ونبقى قريبين بعدها.')])]),
    ('مبادئنا', 'ما نلتزم به',
     [('incl', ['الوضوح قبل التعقيد', 'سريع على كل جوال', 'ملكك، تحتفظ به وتعدّله', 'العربية والإنجليزية بالقدر نفسه'])]),
  ],
  brief=dict(title='ابدأ مشروعًا', sub='بضع نقرات، ثم أرسل', need='ماذا تحتاج؟',
             needs=['موقع إلكتروني', 'أداة أو أتمتة', 'تجربة تفاعلية', 'لست متأكدًا بعد'],
             when='متى تودّ أن تبدأ؟', whens=['هذا الشهر', 'خلال شهر إلى ثلاثة', 'أستكشف فقط'],
             about='سطر عن مشروعك', ph='لدينا مقهى في جدة ونريد…', send='أرسل الطلب',
             note='يفتح تطبيق البريد مع تفاصيل طلبك.'),
  contact=[('mailto:hello@wadi.studio', 'البريد الإلكتروني', 'hello@wadi.studio', 'mail'),
           ('#contact', 'واتساب', '+966 5X XXX XXXX', 'arrow'),
           ('mailto:hello@wadi.studio?subject=%D8%AD%D8%AC%D8%B2%20%D9%85%D9%83%D8%A7%D9%84%D9%85%D8%A9', 'احجز مكالمة', 'أرسل لنا الوقت الذي يناسبك', 'arrow'),
           ('#contact', 'إنستغرام', '@wadi.studio', 'arrow')],
  where='جدة، المملكة العربية السعودية · التوقيت المحلي <span id="clock" dir="ltr">--:--</span><br>من الأحد إلى الخميس، 9:00 حتى 18:00',
),
}

def parts(lst):
    out = []
    for p in lst:
        if isinstance(p, str): out.append(p)
        elif p[0] == 'meta': out.append(meta(p[1]))
        elif p[0] == 'incl': out.append(dashes(p[1]))
        elif p[0] == 'steps': out.append(steps(p[1]))
    return '\n'.join(out)

def opts(name, labels, multi):
    return (f'          <div class="opts" role="group" data-name="{name}"{" data-multi" if multi else ""}>' +
            ''.join(f'<button type="button" class="opt" aria-pressed="false">{x}</button>' for x in labels) + '</div>')

def build(d, lang):
    ltr = ' dir="ltr"' if lang == 'ar' else ''
    work = '\n'.join(item(t, s, parts(p)) for t, s, p in d['work'])
    services = '\n'.join(item(t, s, parts(p)) for t, s, p in d['services'])
    services += '\n' + group(d['questions_label']) + '\n' + '\n'.join(item(q, s, body(a), 'it qa') for q, s, a in d['questions'])
    about = '\n'.join(item(t, s, parts(p)) for t, s, p in d['about'])
    b = d['brief']
    form = (f'        <form class="brief" novalidate>\n'
            f'          <p class="q">{b["need"]}</p>\n{opts("need", b["needs"], True)}\n'
            f'          <p class="q">{b["when"]}</p>\n{opts("when", b["whens"], False)}\n'
            f'          <label class="q" for="brief-note-{lang}">{b["about"]}</label>\n'
            f'          <textarea id="brief-note-{lang}" rows="3" placeholder="{b["ph"]}"></textarea>\n'
            f'          <button class="go send" type="submit">{b["send"]} <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>\n'
            f'          <p class="note">{b["note"]}</p>\n'
            f'        </form>')
    contact = item(b['title'], b['sub'], form, 'it brief-it') + '\n'
    for href, nm, hd, icon in d['contact']:
        hd_attr = ltr if hd.startswith(('+', '@', 'hello')) else ''
        svg = MAIL if icon == 'mail' else ARROW16
        contact += (f'    <a class="ch it" href="{href}"><span><span class="nm">{nm}</span><span class="hd"{hd_attr}>{hd}</span></span>\n      {svg}</a>\n')
    contact += f'    <p class="where">{d["where"]}</p>'
    return {'work': (d['work_label'], work), 'services': (d['services_label'], services),
            'about': (d['about_label'], about), 'contact': (d['contact_label'], contact)}

for lang, f in (('en', 'index.html'), ('ar', 'ar/index.html')):
    path = os.path.join(ROOT, f); s = open(path, encoding='utf-8').read()
    for key, (label, inner) in build(L[lang], lang).items():
        pat = re.compile(r'(  <section class="view" id="v-%s"[^>]*>\n).*?(\n  </section>)' % key, re.S)
        assert pat.search(s), key
        s = pat.sub(lambda m: m.group(1) + inner + m.group(2), s)
    if 'wadi-plate.js' not in s:
        s = s.replace('<script src="/widgets/wadi-scratch.js" defer></script>', '<script src="/widgets/wadi-scratch.js" defer></script>\n<script src="/widgets/wadi-plate.js" defer></script>')
    open(path, 'w', encoding='utf-8').write(s)
print('built')
