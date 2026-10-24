/* ==========================================================================
   Marilyn Dela Cruz — portfolio behaviour
   --------------------------------------------------------------------------
   Plain JavaScript, no libraries. Each block is self-contained (most are
   wrapped in their own function) and they run in this order:

     1. Welcome intro: progress bar, greetings, skip button
     2. Page router: Home shows everything, other menu items open as their own page
     3. Download CV: keep the click from triggering the page router
     4. Light / dark toggle (remembers the choice)
     5. Contact form (Web3Forms, with FormSubmit as a fallback)
     6. Lyn's Assistant: auto-reply chat that answers from this page's own content
     7. Tools: always-moving rows and "View All"
     8. Tools: "View All" turns the category columns into tabs
     9. Cards: hover glow follows the cursor
    10. Cursor ring and sparkle trail
    11. Drifting background sparkles
    12. Work experience: career bar and scroll-in
    13. Hero photo orb
    14. Recommendations: fanned card deck (arrows, dots, keyboard, drag)
    15. Skills: rows and arches rise in on scroll
    16. Lyn's Assistant button: peek the label once on touch screens
    17. Installable app: register the service worker

   Three tiny scripts stay inline at the top of index.html because they must
   run before the page is drawn: the https redirect, the saved dark theme and
   the intro flag.
   ========================================================================== */


/* ==========================================================================
   1. Welcome intro: progress bar, greetings, skip button
   ========================================================================== */
(function () {
    var d = document.documentElement, el = document.getElementById('intro');
    if (!el) return;
    var reduced = d.classList.contains('intro-reduced');

    var fill = document.getElementById('introFill'), pctEl = document.getElementById('introPct'), skip = document.getElementById('introSkip');
    var greets = el.querySelectorAll('.g');
    var t0 = performance.now(), seqStart = null, base = 0, p = 0, lastPct = -1, done = false, ready = document.readyState === 'complete';
    var TARGET = reduced ? 3200 : 4300;               // <<< INTRO LENGTH: ms from page open until the curtain starts to open
    var SEQ = 3000;                                    // (worked out in begin() from TARGET)
    window.addEventListener('load', function () { ready = true; });

    function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
    function tick(now) {
        if (done && p >= 1) return;
        var target;
        if (seqStart === null) target = Math.min(.22, (now - t0) / 9000);            // slow creep while fonts load
        else {
            var k = Math.min(1, (now - seqStart) / SEQ);
            target = base + (ease(k) * (1 - base));                                     // carry on from wherever the creep got to, so it never jumps
            if (!ready && target > .96) target = .96;                                  // wait for the page, never lie at 100%
        }
        if (done) target = 1;
        p = Math.max(p, target);
        fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        var n = Math.round(p * 100);
        if (n !== lastPct) { lastPct = n; pctEl.textContent = n + '%'; }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    function finish() {
        if (done) return; done = true;
        document.removeEventListener('keydown', onKey);
        el.classList.add('p-exit');                                       // content fades, seam draws, curtain splits
        setTimeout(function () { d.classList.remove('intro-on'); }, 450);  // page content starts animating as the curtain opens
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1700);
    }
    function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter') finish(); }
    skip.addEventListener('click', finish);
    document.addEventListener('keydown', onKey);

    function begin() {
        if (done) return;
        seqStart = performance.now(); base = p;
        SEQ =Math.max(TARGET - (seqStart - t0), reduced ? 2400 : 3700) - 300;   // fonts loading late never shortens the welcome
        el.classList.add('is-live');
        if (reduced) {                                                    // calm version: straight to the welcome text
            el.classList.add('p-welcome');
        }
        var i = 0;
        function show(n) { greets[n].className = 'g show'; }
        if (!reduced) show(0);
        var iv = reduced ? null : setInterval(function () {
            if (done) { clearInterval(iv); return; }
            greets[i].className = 'g out';
            i++;
            if (i >= greets.length) { clearInterval(iv); return; }
            show(i);
        }, 570);                                                      // each greeting stays ~0.57s
        if (!reduced) setTimeout(function () { if (!done) el.classList.add('p-welcome'); }, 2400);
        setTimeout(function wait() {
            if (done) return;
            if (ready || performance.now() - t0 > 9000) finish(); else setTimeout(wait, 120);
        }, SEQ + 300);
    }

    // wait (max 1.6s) for the Google Fonts stylesheet + the 3 families, so the intro never flashes fallback fonts
    function sheetLoaded() {
        return new Promise(function (res) {
            var l = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
            if (!l || l.sheet) return setTimeout(res, 30);
            l.addEventListener('load', function () { setTimeout(res, 30); });
            l.addEventListener('error', function () { res(); });
        });
    }
    function fontsLoaded() {
        if (!document.fonts || !document.fonts.load) return Promise.resolve();
        return Promise.all([
            document.fonts.load('italic 700 40px "Cormorant Garamond"'),
            document.fonts.load('40px "Great Vibes"'),
            document.fonts.load('600 12px "Jost"')
        ]).catch(function () {});
    }
    Promise.race([
        sheetLoaded().then(fontsLoaded),
        new Promise(function (r) { setTimeout(r, 1600); })
    ]).then(begin);

    setTimeout(function () { if (!done) finish(); }, 15000);   // hard failsafe
})();


/* ==========================================================================
   2. Page router: Home shows everything, other menu items open as their own page
   ========================================================================== */
        // ===== PAGE ROUTER: Home shows everything, other menu items open as their own page =====
        const PAGE_IDS = ['home', 'about', 'skills', 'experience', 'tools', 'recommendations', 'contact'];
        const PAGE_TITLES = {
            home: 'Marilyn Dela Cruz | CX & Operations Specialist',
            about: 'About Me | Marilyn Dela Cruz',
            skills: 'Skills | Marilyn Dela Cruz',
            experience: 'Experience | Marilyn Dela Cruz',
            tools: 'Tools | Marilyn Dela Cruz',
            recommendations: 'Recommendations | Marilyn Dela Cruz',
            contact: 'Contact | Marilyn Dela Cruz'
        };

        let revealObserver = null;

        // Homepage: sections fade in as you scroll down
        function setupScrollReveal() {
            if (revealObserver) revealObserver.disconnect();
            const els = document.querySelectorAll('.reveal');
            els.forEach(el => {
                el.classList.remove('active');
                el.style.transitionDelay = (el.dataset.delay || '0') + 'ms';
            });
            if (!('IntersectionObserver' in window)) { els.forEach(playReveal); return; }
            revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    playReveal(entry.target);
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
            els.forEach(el => revealObserver.observe(el));
        }

        // show one element, then drop its stagger delay so hover effects stay snappy
        function playReveal(el) {
            el.classList.add('active');
            setTimeout(() => { el.style.transitionDelay = '0ms'; }, 1800);
        }

        function showPage(id) {
            if (!PAGE_IDS.includes(id)) id = 'home';
            const isHome = id === 'home';

            // Home = hero + all sections (scroll down to see everything)
            // Any other menu item = only that one page
            document.body.classList.toggle('mode-home', isHome);
            document.body.classList.toggle('mode-page', !isHome);
            document.querySelectorAll('[data-page]').forEach(sec => {
                sec.classList.toggle('page-hidden', !isHome && sec.id !== id);
            });

            // highlight the active menu item (desktop + mobile)
            document.querySelectorAll('[data-nav]').forEach(link => {
                link.classList.toggle('text-accent', link.dataset.nav === id);
            });

            document.title = PAGE_TITLES[id];
            closeMobileMenu();
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

            if (isHome) {
                setupScrollReveal();
            } else {
                if (revealObserver) revealObserver.disconnect();
                // replay the reveal animation for the page that was just opened
                const items = document.querySelectorAll('#' + id + ' .reveal');
                items.forEach(el => {
                    el.classList.remove('active');
                    el.style.transitionDelay = (el.dataset.delay || '0') + 'ms';
                });
                void document.body.offsetHeight; // force reflow so the animation restarts
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    items.forEach(playReveal);
                }));
            }
        }

        function currentPageFromHash() {
            return decodeURIComponent(window.location.hash.replace('#', '')) || 'home';
        }

        function closeMobileMenu() {
            const menu = document.getElementById('mobileMenu');
            const btn = document.getElementById('menuBtn');
            if (!menu || !btn) return;
            menu.classList.add('hidden');
            menu.classList.remove('flex');
            btn.setAttribute('aria-expanded', 'false');
            btn.innerHTML = '<i class="fas fa-bars"></i>';
        }

        function toggleMobileMenu() {
            const menu = document.getElementById('mobileMenu');
            const btn = document.getElementById('menuBtn');
            const opening = menu.classList.contains('hidden');
            menu.classList.toggle('hidden', !opening);
            menu.classList.toggle('flex', opening);
            btn.setAttribute('aria-expanded', String(opening));
            btn.innerHTML = opening ? '<i class="fas fa-xmark"></i>' : '<i class="fas fa-bars"></i>';
        }

        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('menuBtn').addEventListener('click', toggleMobileMenu);

            // Every in-page link (menu, logo, hero buttons) opens its page directly,
            // without the browser's default jump-to-anchor scrolling
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (!link) return;
                const id = decodeURIComponent(link.getAttribute('href').slice(1));
                if (!PAGE_IDS.includes(id)) return;
                e.preventDefault();
                if (currentPageFromHash() !== id) {
                    try { history.pushState(null, '', '#' + id); }
                    catch (err) { window.location.hash = id; return; }
                }
                showPage(id);
            });

            window.addEventListener('hashchange', () => showPage(currentPageFromHash()));
            showPage(currentPageFromHash());
        });


        // ===== twinkling stars in the background + scroll progress bar =====
        (function () {
            const deco = document.getElementById('bgDeco');
            const spots = window.matchMedia('(max-width:1023px)').matches ? [] : [[8,18],[22,70],[35,12],[48,82],[62,30],[74,88],[88,22],[92,64],[15,45],[55,55],[80,8],[40,92]];
            spots.forEach((p, i) => {
                const s = document.createElement('span');
                s.className = 'bg-star';
                s.textContent = '\u2726';
                s.style.left = p[0] + '%';
                s.style.top = p[1] + '%';
                s.style.fontSize = (10 + (i % 4) * 5) + 'px';
                s.style.animationDelay = (i * 0.9) + 's';
                s.style.animationDuration = (5 + (i % 3) * 2) + 's';
                deco.appendChild(s);
            });
            const bar = document.getElementById('scrollBar');
            bar.style.width = '100%';
            bar.style.transformOrigin = '0 50%';
            bar.style.transform = 'scaleX(0)';
            let barTick = false;
            const draw = () => {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
                barTick = false;
            };
            const update = () => { if (!barTick) { barTick = true; requestAnimationFrame(draw); } };
            window.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update);
            update();
        })();


        // ===== SCROLL ANIMATIONS: varied reveals, stagger, parallax, header shrink, back-to-top =====
        (function () {
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(max-width:1023px)').matches;

            // 1) give each reveal its own direction + stagger
            document.querySelectorAll('section:not(#home)').forEach((sec, s) => {
                const groups = new Map();
                sec.querySelectorAll('.reveal').forEach(el => {
                    if (!groups.has(el.parentElement)) groups.set(el.parentElement, []);
                    groups.get(el.parentElement).push(el);
                });
                groups.forEach(list => {
                    list.forEach((el, i) => {
                        let v = 'from-zoom';
                        if (list.length === 1) v = (s % 2 === 0) ? 'from-left' : 'from-right';
                        else if (list.length === 2) v = i === 0 ? 'from-left' : 'from-right';
                        el.classList.add(v);
                        el.dataset.delay = list.length > 1 ? String(i * 120) : '0';
                    });
                });
            });

            // 2) scroll-linked effects
            const header = document.querySelector('header');
            const toTop = document.getElementById('toTop');
            const blobs = document.querySelectorAll('#bgDeco > div.animate-blob');
            const heroText = document.querySelector('#home .animate-fade-in-up');
            const photo = document.querySelector('.photo-wrap');
            let ticking = false;

            function onScroll() {
                const y = window.scrollY;
                header.classList.toggle('scrolled', y > 40);
                toTop.classList.toggle('show', y > 500);
                if (!reduce) {
                    blobs.forEach((b, i) => { b.style.translate = '0 ' + (-y * (0.06 + i * 0.05)) + 'px'; });
                    const inHome = document.body.classList.contains('mode-home');
                    const p = inHome ? Math.min(y / (window.innerHeight * 0.9), 1) : 0;
                    if (heroText) heroText.style.translate = '0 ' + (-p * 50) + 'px';
                    if (photo) { photo.style.translate = '0 ' + (p * 40) + 'px'; photo.style.scale = String(1 - p * 0.06); }
                }
                ticking = false;
            }
            window.addEventListener('scroll', () => {
                if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
            }, { passive: true });
            toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            onScroll();
        })();

        function openModal(type) {
            const modal = document.getElementById('contactModal');
            const modalInner = document.getElementById('modalInner');
            const content = document.getElementById('modalContent');
            
            if (type === 'phone') {
                content.innerHTML = `
                    <div class="text-accent text-5xl mb-4"><i class="fas fa-phone"></i></div>
                    <h3 class="text-2xl font-poppins font-bold text-textmain">Phone Number</h3>
                    <p class="text-xl font-bold text-accent tracking-wider">+63 976 079 5952</p>
                    <p class="text-sm text-textmuted">Available for calls, SMS, and WhatsApp.</p>
                    <div class="flex flex-wrap gap-3 justify-center pt-4">
                        <button onclick="callNow()" class="bg-accent text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#9a4c2e] transition text-sm shadow-md hover:-translate-y-0.5 inline-block">Call Now</button>
                        <a href="https://wa.me/639760795952" target="_blank" rel="noopener noreferrer" class="border border-cardborder text-textmain font-semibold px-6 py-2.5 rounded-full hover:border-accent hover:text-accent transition text-sm inline-block">WhatsApp</a>
                    </div>
                    <p id="modalNote" class="text-sm text-accent font-semibold min-h-[1.25rem]"></p>
                `;
            } else if (type === 'email') {
                content.innerHTML = `
                    <div class="text-accent text-5xl mb-4"><i class="fas fa-envelope"></i></div>
                    <h3 class="text-2xl font-poppins font-bold text-textmain">Email Address</h3>
                    <p class="text-lg font-bold text-accent break-all">amberigudgurl@gmail.com</p>
                    <p class="text-sm text-textmuted">Send job offers or inquiries directly.</p>
                    <div class="flex flex-wrap gap-3 justify-center pt-4">
                        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=amberigudgurl@gmail.com" target="_blank" rel="noopener noreferrer" class="bg-accent text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#9a4c2e] transition text-sm shadow-md hover:-translate-y-0.5 inline-block">Send via Gmail</a>
                        <button onclick="copyToClipboard('amberigudgurl@gmail.com', this)" class="border border-cardborder text-textmain font-semibold px-6 py-2.5 rounded-full hover:border-accent hover:text-accent transition text-sm">Copy</button>
                    </div>
                `;
            } else if (type === 'location') {
                content.innerHTML = `
                    <div class="text-accent text-5xl mb-4"><i class="fas fa-location-dot"></i></div>
                    <h3 class="text-2xl font-poppins font-bold text-textmain">Location</h3>
                    <p class="text-lg font-bold text-accent">Philippines</p>
                    <p class="text-sm text-textmuted">Open for remote roles.</p>
                    <div class="pt-4">
                        <button onclick="closeModal()" class="bg-accent text-white font-bold px-8 py-2.5 rounded-full hover:bg-[#9a4c2e] transition text-sm shadow-md hover:-translate-y-0.5">Got It</button>
                    </div>
                `;
            }
            
            modal.classList.remove('hidden');
            setTimeout(() => {
                modalInner.classList.remove('scale-95', 'opacity-0');
                modalInner.classList.add('scale-100', 'opacity-100');
            }, 10);
        }

        // phones & tablets can call / open a mail app directly; desktop browsers get a popup instead
        function isPhoneOrTablet() {
            return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
                   !!(navigator.userAgentData && navigator.userAgentData.mobile) ||
                   (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
        }
        document.querySelectorAll('[data-contact]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();   // every device: show the contact popup (the tel:/mailto: href stays as a no-JS fallback)
                openModal(a.dataset.contact);
            });
        });

        function callNow() {
            const isMobile = isPhoneOrTablet();
            const note = document.getElementById('modalNote');
            if (isMobile) {
                window.location.href = 'tel:+639760795952';
            } else {
                const done = () => { if (note) note.textContent = 'Number copied! Dial it from your phone.'; };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText('+639760795952').then(done).catch(() => fallbackCopy('+639760795952', done));
                } else {
                    fallbackCopy('+639760795952', done);
                }
            }
        }

        function closeModal() { 
            const modal = document.getElementById('contactModal');
            const modalInner = document.getElementById('modalInner');
            modalInner.classList.remove('scale-100', 'opacity-100');
            modalInner.classList.add('scale-95', 'opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
        
        function copyToClipboard(text, btn) {
            const done = () => {
                const original = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = original; }, 1500);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
            } else {
                fallbackCopy(text, done);
            }
        }
        function fallbackCopy(text, done) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); done(); } catch (e) {}
            document.body.removeChild(ta);
        }
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
        window.onclick = function(event) { if (event.target === document.getElementById('contactModal')) closeModal(); }


/* ==========================================================================
   3. Download CV: keep the click from triggering the page router
   ========================================================================== */
document.querySelectorAll("[data-resume-dl]").forEach(a => a.addEventListener("click", e => e.stopPropagation()));


/* ==========================================================================
   4. Light / dark toggle (remembers the choice)
   ========================================================================== */
// ===== light / dark toggle (remembers the choice) =====
(function () {
    const root = document.documentElement, btn = document.getElementById('themeBtn');
    const bar = document.querySelector('meta[name="theme-color"]');
    function label() {
        const dark = root.getAttribute('data-theme') === 'dark';
        btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        if (bar) bar.setAttribute('content', dark ? '#0f1520' : '#f4f1e8');   // browser address bar follows the theme
    }
    label();
    btn.addEventListener('click', function () {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        if (next === 'dark') root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
        try { localStorage.setItem('theme', next); } catch (e) {}
        label();
    });
})();


/* ==========================================================================
   5. Contact form (Web3Forms, with FormSubmit as a fallback)
   ========================================================================== */
// contact form: sends straight to the inbox (Web3Forms if a key is set, otherwise FormSubmit).
// If that fails, the message is kept ready and the visitor can send it with Gmail, their email app or WhatsApp.
(function () {
    const f = document.getElementById('contactForm'); if (!f) return;
    const st = document.getElementById('formStatus'), el = f.elements, btn = f.querySelector('.c-send');
    const to = f.dataset.email, wa = f.dataset.wa, enc = encodeURIComponent;
    // pop-up message (replaces the plain red status line)
    function popup(type, title, html) {
        const old = document.querySelector('.cf-pop'); if (old) old.remove();
        const icon = type === 'success' ? '\u2713' : '!';
        const o = document.createElement('div'); o.className = 'cf-pop';
        o.innerHTML = '<div class="cf-card ' + type + '" role="dialog" aria-modal="true" aria-labelledby="cfTitle">' +
            '<div class="cf-ico">' + icon + '</div><h3 id="cfTitle">' + title + '</h3><div class="cf-msg">' + html + '</div>' +
            '<button type="button" class="cf-ok">OK</button></div>';
        document.body.appendChild(o);
        const ok = o.querySelector('.cf-ok');
        const close = () => { o.classList.add('out'); document.removeEventListener('keydown', onKey); setTimeout(() => { o.remove(); btn.focus({ preventScroll: true }); }, 220); };
        const onKey = ev => { if (ev.key === 'Escape') close(); };
        ok.addEventListener('click', close);
        o.addEventListener('click', ev => { if (ev.target === o) close(); });
        document.addEventListener('keydown', onKey);
        requestAnimationFrame(() => { o.classList.add('in'); ok.focus({ preventScroll: true }); });
    }
    function fallback(name, mail, msg, why) {
        const subj = 'Portfolio inquiry from ' + name, body = msg + '\n\n- ' + name + ' (' + mail + ')';
        st.innerHTML = 'I couldn’t send it automatically, but your message is ready. Pick how you’d like to send it:' +
            '<span class="c-alt">' +
            '<a target="_blank" rel="noopener noreferrer" href="https://mail.google.com/mail/?view=cm&fs=1&to=' + enc(to) + '&su=' + enc(subj) + '&body=' + enc(body) + '"><i class="fas fa-envelope"></i> Gmail</a>' +
            '<a href="mailto:' + to + '?subject=' + enc(subj) + '&body=' + enc(body) + '"><i class="fas fa-paper-plane"></i> Email app</a>' +
            (wa ? '<a target="_blank" rel="noopener noreferrer" href="https://wa.me/' + wa + '?text=' + enc(subj + '\n\n' + msg) + '"><i class="fab fa-whatsapp"></i> WhatsApp</a>' : '') +
            '</span>';
        if (why) { const n = document.createElement('small'); n.className = 'c-why'; n.textContent = 'Technical note: ' + why; st.appendChild(n); }
        popup('warn', 'Couldn’t send automatically', st.innerHTML); st.innerHTML = '';
    }
    // returns {ok:true} or {ok:false, reason:'...'}; throws only on network problems
    async function deliver(name, mail, msg) {
        const subject = 'Portfolio inquiry from ' + name;
        const key = (f.dataset.w3fKey || '').trim();
        let r;
        if (key) {
            // Web3Forms: plain form-data POST (no preflight request needed)
            const fd = new FormData();
            fd.append('access_key', key); fd.append('subject', subject); fd.append('from_name', 'Portfolio');
            fd.append('name', name); fd.append('email', mail); fd.append('message', msg);
            fd.append('botcheck', el['_honey'].value ? 'true' : '');
            r = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd });
        } else {
            const payload = { name: name, email: mail, message: msg, _replyto: mail, _subject: subject, _template: 'table', _captcha: 'false', _honey: el['_honey'].value };
            r = await fetch('https://formsubmit.co/ajax/' + to, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) });
        }
        let d = null; try { d = await r.json(); } catch (e) {}
        if (r.ok && d && (d.success === true || d.success === 'true')) return { ok: true };
        const reason = 'HTTP ' + r.status + (d && d.message ? ' - ' + d.message : '');
        console.warn('Contact form not sent:', reason, d);
        return { ok: false, reason: reason };
    }
    f.addEventListener('submit', async function (e) {
        e.preventDefault();
        const name = el['name'].value.trim(), mail = el['email'].value.trim(), msg = el['message'].value.trim();
        const ok = { name: !!name, email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail), message: !!msg };
        ['name', 'email', 'message'].forEach(k => el[k].parentElement.classList.toggle('invalid', !ok[k]));
        if (!ok.name || !ok.email || !ok.message) { popup('error', 'Missing details', 'Please add your name, a valid email and your message.'); return; }
        btn.disabled = true; st.textContent = ''; const btnHTML = btn.innerHTML; btn.textContent = 'Sending…';
        let res;
        try { res = await deliver(name, mail, msg); }
        catch (err) {
            console.warn('Contact form error:', err);
            res = { ok: false, reason: (location.protocol === 'file:' ? 'This page is opened as a local file, and browsers block sending from there. It works once the site is hosted online. ' : '') + (err && err.message ? '(' + err.message + ')' : 'Network error') };
        }
        if (res.ok) { popup('success', 'Message sent!', 'Thank you! Your message was sent. I’ll get back to you soon.'); f.reset(); }
        else fallback(name, mail, msg, res.reason);
        btn.innerHTML = btnHTML; btn.disabled = false;
    });
})();


/* ==========================================================================
   6. Lyn's Assistant: auto-reply chat that answers from this page's own content
   ========================================================================== */
// ===== Lyn’s Assistant: an auto-reply assistant. Every answer is read from this page's own content, so nothing is made up and it stays in sync when you edit the page. =====
(function () {
    const fab = document.getElementById('chatFab'), panel = document.getElementById('chatPanel'), body = document.getElementById('chatBody'),
          form = document.getElementById('chatForm'), input = document.getElementById('chatInput'), quick = document.getElementById('chatQuick'),
          nudge = document.getElementById('chatNudge'), ava = document.getElementById('chatAva');
    if (!fab || !panel) return;
    const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
    const txt = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fineHover = window.matchMedia('(pointer:fine)').matches;

    // avatar = the profile photo already on the page
    const photo = $('#profileImg');
    if (photo && photo.getAttribute('src') && !photo.classList.contains('hidden')) ava.src = photo.getAttribute('src'); else ava.style.display = 'none';

    // ---- knowledge: read live from the page ----
    const K = {
        role: () => txt($('#home h2')),
        intro: () => txt($('#home p')),
        name: () => txt($('#about h2 .text-accent')),
        about: () => txt($('#about .soft-shadow')),
        jobs: () => $$('#experience .cr').map(c => ({ t: txt($('h3', c)), p: txt($('p.text-accent', c)), w: txt($('.cr-when', c)), pts: $$('li strong', c).map(e => txt(e).replace(/:$/, '')) })),
        skills: () => $$('#skills .reveal').map(g => ({ h: txt($('h2', g)), items: $$('h3', g).map(txt) })).filter(g => g.items.length),
        tools: () => $$('#tools h3').map(h => ({ c: txt(h), items: $$('.tool-icon + div', h.parentElement).map(d => ({ n: txt(d.children[0]), d: txt(d.children[1]) })) })).filter(g => g.items.length),
        row: k => $('.c-row[data-contact="' + k + '"]'),
        place: () => { const r = $$('#contact .c-row').filter(x => !x.dataset.contact)[0]; return r ? { b: txt($('b', r)), s: txt($('small', r)) } : null; },
        link: sel => { const a = $(sel); return a ? a.getAttribute('href') : ''; }
    };

    // ---- helpers to build answers ----
    const chip = (label, o) => ({ label, ...o });
    const nav = (label, hash, icon) => chip(label, { href: hash, icon: icon || 'fa-arrow-right' });
    const ask = (label, topic, icon) => chip(label, { ask: topic, icon });
    const list = a => '<ul>' + a.map(x => '<li>' + x + '</li>').join('') + '</ul>';

    const TOPICS = {
        greet: () => ({ html: '<p>Hey! 👋 I’m Lyn’s assistant. Feel free to ask about her work, skills, tools, or anything else on the site.</p>' }),
        thanks: () => ({ html: '<p>You’re welcome! Anything else you’d like to know?</p>', acts: [nav('Contact Lyn', '#contact', 'fa-envelope')] }),
        about: () => {
            const a = K.about(), r = K.role();
            return { html: '<p><b>' + esc(K.name() || 'Lyn') + '</b>' + (r ? ' &middot; ' + esc(r) : '') + '</p><p>' + esc(a || K.intro()) + '</p>',
                     acts: [ask('Experience', 'experience'), ask('Skills', 'skills'), { label: 'Get the resume', act: 'resume', solid: true, icon: 'fa-download' }] };
        },
        experience: () => {
            const jobs = K.jobs();
            if (!jobs.length) return TOPICS.fallback();
            return { html: jobs.map(j => '<p><b>' + esc(j.t) + '</b><br><span class="chat-sub">' + esc([j.p, j.w].filter(Boolean).join(' · ')) + '</span>' + (j.pts.length ? list(j.pts.map(esc)) : '') + '</p>').join(''),
                     acts: [nav('See full experience', '#experience'), ask('Skills', 'skills'), ask('Tools', 'tools')] };
        },
        skills: () => {
            const g = K.skills();
            if (!g.length) return TOPICS.fallback();
            return { html: g.map(x => '<p><b>' + esc(x.h) + '</b></p>' + list(x.items.map(esc))).join(''), acts: [nav('See skills page', '#skills'), ask('Tools', 'tools'), ask('Experience', 'experience')] };
        },
        tools: q => {
            const t = K.tools();
            if (!t.length) return TOPICS.fallback();
            const lc = (q || '').toLowerCase();
            for (const g of t) for (const it of g.items) {
                if (it.n && lc.includes(it.n.toLowerCase())) return { html: '<p>Yes, <b>' + esc(it.n) + '</b> is on the list (' + esc(g.c) + ').</p>' + (it.d ? '<p class="chat-sub">' + esc(it.d) + '</p>' : ''), acts: [nav('See all tools', '#tools'), ask('Experience', 'experience')] };
            }
            return { html: t.map(g => '<p><b>' + esc(g.c) + '</b><br>' + esc(g.items.map(i => i.n).join(', ')) + '</p>').join(''), acts: [nav('See tools page', '#tools'), ask('Skills', 'skills')] };
        },
        resume: () => ({ html: '<p>Sure! You can download the resume right here.</p>', acts: [{ label: 'Download resume', act: 'resume', solid: true, icon: 'fa-download' }, ask('Contact', 'contact', 'fa-envelope')] }),
        contact: () => {
            const em = K.row('email'), ph = K.row('phone'), wa = (form_wa() || '');
            const lines = [];
            if (em) lines.push('Email: <b>' + esc(txt($('b', em))) + '</b>');
            if (ph) lines.push('Phone: <b>' + esc(txt($('b', ph))) + '</b>');
            const acts = [];
            if (em) acts.push({ label: 'Send an email', href: em.getAttribute('href'), icon: 'fa-envelope', solid: true });
            if (wa) acts.push({ label: 'WhatsApp', href: 'https://wa.me/' + wa, icon: 'fa-whatsapp', brand: true, ext: true });
            const li = K.link('#contact .social-card[href*="linkedin"]'); if (li) acts.push({ label: 'LinkedIn', href: li, icon: 'fa-linkedin-in', brand: true, ext: true });
            acts.push(nav('Contact form', '#contact', 'fa-paper-plane'));
            return { html: '<p>Here’s how to reach Lyn directly:</p>' + (lines.length ? list(lines) : ''), acts };
        },
        availability: () => {
            const p = K.place();
            return { html: p ? '<p><b>' + esc(p.b) + '</b></p><p>' + esc(p.s) + '</p>' : '<p>Please use the contact form to ask about availability.</p>', acts: [ask('Contact', 'contact', 'fa-envelope'), { label: 'Get the resume', act: 'resume', icon: 'fa-download' }] };
        },
        leadership: () => ({ html: '<p>Managers and team leads have shared their feedback about working with Lyn. You can read it on the recommendations page.</p>', acts: [nav('Read recommendations', '#recommendations', 'fa-quote-left'), ask('Experience', 'experience')] }),
        fallback: () => ({ html: '<p>Sorry, I’m not sure about that one. I can only answer questions about Lyn’s work, skills and tools.</p>' })
    };
    function form_wa() { const f = $('#contactForm'); return f ? (f.dataset.wa || '') : ''; }

    // keyword routing (English + a little Tagalog)
    const RULES = [
        ['thanks', /\b(thanks|thank you|thx|salamat|ty)\b/],
        ['resume', /\b(resume|cv|curriculum|download)\b/],
        ['availability', /\b(available|availability|remote|hybrid|on-?site|relocat\w*|location|located|based|where|philippines|start date|schedule)\b/],
        ['contact', /\b(contact|email|e-mail|mail|phone|number|call|reach|message|hire|hiring|whatsapp|linkedin|facebook|social|kontak)\b/],
        ['leadership', /\b(recommend\w*|reference\w*|testimon\w*|manager\w*|leadership|feedback|review\w*|endorse\w*)\b/],
        ['tools', /\b(tools?|software|platforms?|systems?|stack|zendesk|salesforce|five9|excel|sheets|slack|teams|notion|chatgpt|grammarly|aws|gcp|lightning|astra|word|drive|docs)\b/],
        ['skills', /\b(skills?|strengths?|expertise|good at|abilit\w*|talents?|kaya|competenc\w*)\b/],
        ['experience', /\b(experience|work(ed|ing)?|jobs?|career|history|roles?|employ\w*|years?|trabaho|karanasan|bpo|cx|support)\b/],
        ['about', /\b(who|about|introduce|yourself|background|profile|sino|lyn|marilyn)\b/],
        ['greet', /\b(hi|hello|hey|hiya|kumusta|musta|good (morning|afternoon|evening))\b/]
    ];
    function route(q) {
        const s = q.toLowerCase();
        for (const [k, re] of RULES) if (re.test(s)) return k;
        return 'fallback';
    }

    // ---- UI ----
    const QUICK = [['About', 'about'], ['Experience', 'experience'], ['Skills', 'skills'], ['Tools', 'tools'], ['Resume', 'resume'], ['Contact', 'contact'], ['Availability', 'availability']];
    QUICK.forEach(([l, t]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chat-chip'; b.textContent = l; b.dataset.ask = t; quick.appendChild(b); });

    function scrollDown() { body.scrollTop = body.scrollHeight; }
    function bubble(kind, html) { const d = document.createElement('div'); d.className = 'chat-msg ' + kind; d.innerHTML = html; body.appendChild(d); scrollDown(); return d; }
    function actsHtml(acts) {
        return '<div class="chat-acts">' + acts.map(a => {
            const ic = a.icon ? '<i class="' + (a.brand ? 'fab' : 'fas') + ' ' + a.icon + '" aria-hidden="true"></i>' : '';
            const cls = 'chat-chip' + (a.solid ? ' solid' : '');
            if (a.ask) return '<button type="button" class="' + cls + '" data-ask="' + esc(a.ask) + '">' + ic + esc(a.label) + '</button>';
            if (a.act) return '<button type="button" class="' + cls + '" data-act="' + esc(a.act) + '">' + ic + esc(a.label) + '</button>';
            return '<a class="' + cls + '" href="' + esc(a.href) + '"' + (a.ext ? ' target="_blank" rel="noopener noreferrer"' : '') + (a.href.charAt(0) === '#' ? ' data-chat-nav' : '') + '>' + ic + esc(a.label) + '</a>';
        }).join('') + '</div>';
    }
    function reply(topic, q) {
        const typing = document.createElement('div'); typing.className = 'chat-typing'; typing.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(typing); scrollDown();
        const wait = reduce ? 150 : 550 + Math.random() * 450;
        setTimeout(() => {
            typing.remove();
            let r; try { r = (TOPICS[topic] || TOPICS.fallback)(q); } catch (e) { r = TOPICS.fallback(); }
            bubble('bot', r.html + (r.acts && r.acts.length ? actsHtml(r.acts) : ''));
            pushHist('assistant', plain(r.html));
        }, wait);
    }
    const LABELS = { about: 'About Lyn', experience: 'Experience', skills: 'Skills', tools: 'Tools', resume: 'Resume', contact: 'Contact', availability: 'Availability', leadership: 'Recommendations' };
    // ===== REAL AI MODE =====
    // Paste your Cloudflare Worker URL below (see chat-worker.js). Leave it empty and the chat keeps using the built-in quick answers.
    const AI_ENDPOINT = 'https://lyn-chat.famadorchristian.workers.dev';
    const AI_ON = /^https:\/\//.test(AI_ENDPOINT);
    const hist = []; let busy = false;
    const plain = html => { const d = document.createElement('div'); d.innerHTML = html; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
    function pushHist(role, content) { if (!content) return; hist.push({ role, content: content.slice(0, 600) }); if (hist.length > 16) hist.splice(0, hist.length - 16); }
    function cleanHist() {
        const out = [];
        hist.forEach(m => { const last = out[out.length - 1]; if (last && last.role === m.role) last.content += '\n' + m.content; else out.push({ role: m.role, content: m.content }); });
        while (out.length && out[0].role !== 'user') out.shift();
        while (out.length && out[out.length - 1].role !== 'user') out.pop();
        return out;
    }
    // the AI reads this page's own text, so it always matches whatever you edit above
    function buildContext() {
        return ['home', 'about', 'skills', 'experience', 'tools', 'recommendations', 'contact']
            .map(id => { const el = document.getElementById(id); if (!el) return ''; const c = el.cloneNode(true); c.querySelectorAll('.tm-marquee').forEach(n => n.remove()); return '## ' + id.toUpperCase() + '\n' + txt(c); })
            .filter(Boolean).join('\n\n').slice(0, 9000);
    }
    // who the assistant is: Lyn's helper, never Lyn herself (also sent as its own field in case the worker reads it)
    const PERSONA = 'ASSISTANT ROLE (follow strictly): You are the AI assistant of Lyn Dela Cruz\'s portfolio website. You are NOT Lyn and must never speak as her or claim to be her. ' +
        'Always talk about Lyn in the third person: "Lyn", "she/her" (in Tagalog/Taglish: "si Lyn", "niya", "ang work ni Lyn"). ' +
        'Never use "I", "my", "me", "ako", "ko" or "akin" for Lyn\'s experience, skills, tools or personal life; say "Lyn has...", "her experience...", "ang experience ni Lyn...". ' +
        'You may call yourself "Lyn\'s assistant". Reply in the same language the visitor uses (English, Tagalog or Taglish) and keep a friendly, helpful tone.';
    const inl = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    function toHtml(t) {
        return t.trim().split(/\n{2,}/).map(par => {
            const lines = par.split('\n');
            if (lines.every(l => /^\s*[-•*]\s+/.test(l))) return '<ul>' + lines.map(l => '<li>' + inl(l.replace(/^\s*[-•*]\s+/, '')) + '</li>').join('') + '</ul>';
            return '<p>' + lines.map(inl).join('<br>') + '</p>';
        }).join('');
    }
    const ACT_MAP = {
        resume: { label: 'Get the resume', act: 'resume', solid: true, icon: 'fa-download' },
        contact: { label: 'Open contact form', href: '#contact', icon: 'fa-paper-plane' },
        experience: { label: 'See experience', href: '#experience', icon: 'fa-arrow-right' },
        skills: { label: 'See skills', href: '#skills', icon: 'fa-arrow-right' },
        tools: { label: 'See tools', href: '#tools', icon: 'fa-arrow-right' },
        about: { label: 'About Lyn', href: '#about', icon: 'fa-arrow-right' },
        recommendations: { label: 'Read recommendations', href: '#recommendations', icon: 'fa-quote-left' }
    };
    function parseActs(t) {
        const acts = [], seen = {};
        const text = t.replace(/\[\[\s*(\w+)\s*\]\]/g, (m, k) => { k = k.toLowerCase(); if (ACT_MAP[k] && !seen[k] && acts.length < 2) { seen[k] = 1; acts.push(ACT_MAP[k]); } return ''; }).trim();
        return { text, acts };
    }
    async function askAI(text) {
        busy = true;
        const typing = document.createElement('div'); typing.className = 'chat-typing'; typing.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(typing); scrollDown();
        const t0 = Date.now(), ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 20000);
        try {
            const res = await fetch(AI_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
                body: JSON.stringify({ messages: cleanHist(), context: PERSONA + '\n\n' + buildContext(), persona: PERSONA }) });
            clearTimeout(to);
            if (!res.ok) throw new Error('http ' + res.status);
            const data = await res.json();
            if (!data || !data.reply) throw new Error('empty');
            const parsed = parseActs(String(data.reply));
            if (!parsed.text) throw new Error('empty');
            setTimeout(() => {
                typing.remove(); busy = false;
                pushHist('assistant', parsed.text);
                bubble('bot', toHtml(parsed.text));
            }, reduce ? 0 : Math.max(0, 450 - (Date.now() - t0)));
        } catch (e) {
            clearTimeout(to); typing.remove(); busy = false;
            console.warn('Chat AI unavailable:', e);
            reply(route(text), text);   // AI unreachable: fall back to the built-in answers
        }
    }
    function send(text, topic) {
        text = (text || '').trim(); if (!text || busy) return;
        bubble('me', esc(text));
        pushHist('user', text);
        if (topic || !AI_ON) return reply(topic || route(text), text);
        askAI(text);
    }
    if (AI_ON) {
        TOPICS.greet = () => ({ html: '<p>Hey! 👋 I’m Lyn’s AI assistant. Feel free to ask about her experience, skills, tools, or anything else on the site.</p>' });
        input.maxLength = 500;
    }

    let started = false;
    function open() {
        panel.classList.add('open'); fab.classList.remove('has-new'); nudge.classList.remove('show');
        fab.setAttribute('aria-expanded', 'true');
        try { sessionStorage.setItem('chatSeen', '1'); } catch (e) {}
        if (!started) { started = true; bubble('bot', TOPICS.greet().html); }
        if (fineHover) setTimeout(() => input.focus({ preventScroll: true }), 260);
    }
    function close() {
        panel.classList.remove('open'); fab.setAttribute('aria-expanded', 'false');
    }
    fab.addEventListener('click', () => panel.classList.contains('open') ? close() : open());
    document.getElementById('chatClose').addEventListener('click', () => { close(); fab.focus(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) { close(); fab.focus(); } });
    nudge.addEventListener('click', open);
    // click on any blank area outside the chat closes it (so the icon doesn't have to be pressed again)
    let downInChat = false;
    document.addEventListener('pointerdown', e => { downInChat = !!(e.target.closest && e.target.closest('#chatPanel, #chatFab, #chatNudge')); }, true);
    document.addEventListener('click', e => {
        if (!panel.classList.contains('open') || downInChat) return;
        if (e.target.closest && e.target.closest('#chatPanel, #chatFab, #chatNudge')) return;
        close();
    });

    form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; send(v); });
    panel.addEventListener('click', e => {
        const t = e.target.closest('[data-ask],[data-act],[data-chat-nav]'); if (!t) return;
        if (t.dataset.ask) { send(LABELS[t.dataset.ask] || t.textContent, t.dataset.ask); }
        else if (t.dataset.act === 'resume') {
            const a = $('[data-resume-dl]'); if (a) a.click();
            reply('thanks_dl');
        } else if (t.hasAttribute('data-chat-nav') && window.innerWidth < 640) { close(); }
    });
    TOPICS.thanks_dl = () => ({ html: '<p>Your download should start now. If it doesn’t, the “Download CV” button on the home page works too.</p>' });

    // small one-time nudge
    let seen = false; try { seen = sessionStorage.getItem('chatSeen') === '1'; } catch (e) {}
    if (seen) fab.classList.remove('has-new');
    else {
        let tries = 0;
        (function later() {
            setTimeout(() => {
                if (panel.classList.contains('open')) return;
                if (document.documentElement.classList.contains('intro-on') && tries++ < 6) return later();
                nudge.classList.add('show'); setTimeout(() => nudge.classList.remove('show'), 7000);
            }, tries ? 3000 : 8000);
        })();
    }
})();


/* ==========================================================================
   7. Tools: always-moving rows and "View All"
   ========================================================================== */
// ===== Tools marquee: always-moving rows + "View All" expands the rows =====
(function () {
    const wrap = document.getElementById('tmMarquee'); if (!wrap) return;
    const rows = Array.from(wrap.querySelectorAll('.tm-row'));
    function build(row) {
        const track = row.querySelector('.tm-track'), first = track.querySelector('.tm-set');
        Array.from(track.querySelectorAll('.tm-set')).slice(1).forEach(s => s.remove());
        first.querySelectorAll('[data-clone]').forEach(n => n.remove());
        const w = row.clientWidth; if (!w) return;
        const orig = Array.from(first.children); let guard = 0;
        while (first.scrollWidth < w + 60 && guard++ < 12) orig.forEach(c => {
            const n = c.cloneNode(true); n.dataset.clone = '1'; n.setAttribute('aria-hidden', 'true'); first.appendChild(n);
        });
        const second = first.cloneNode(true); second.setAttribute('aria-hidden', 'true'); track.appendChild(second);
        track.style.setProperty('--dur', (first.scrollWidth / (+row.dataset.speed || 36)).toFixed(1) + 's');
    }
    let raf = 0, lastW = -1;
    const rebuild = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
        if (wrap.clientWidth === lastW) return;
        lastW = wrap.clientWidth; rows.forEach(build);
    }); };
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(wrap); else { rebuild(); addEventListener('resize', rebuild); }

    const btn = document.getElementById('tmToggle'), label = document.getElementById('tmToggleText'),
          fold = document.getElementById('tmFold'), all = document.getElementById('toolsAll');
    btn.addEventListener('click', () => {
        btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
        const open = !all.classList.contains('open');
        if (open) { all.removeAttribute('inert'); all.querySelectorAll('.reveal').forEach(e => e.classList.add('active')); }
        else all.setAttribute('inert', '');
        all.classList.toggle('open', open);
        fold.classList.toggle('folded', open);
        fold.toggleAttribute('inert', open);
        btn.setAttribute('aria-expanded', open);
        label.textContent = open ? 'Show Less' : 'View All';
    });
})();


/* ==========================================================================
   8. Tools: "View All" turns the category columns into tabs
   ========================================================================== */
// ===== Tools "View All": turn the category columns into tabs so the list stays short =====
(function () {
    const all = document.getElementById('toolsAll'); if (!all) return;
    const grid = all.querySelector('.tm-all-inner > .grid'); if (!grid) return;
    const groups = Array.from(grid.querySelectorAll('.tools-col > .reveal')).filter(g => g.querySelector('h3'));
    if (groups.length < 2) return;

    const bar = document.createElement('div'), glide = document.createElement('span');
    bar.className = 'tt-bar'; bar.setAttribute('role', 'tablist'); bar.setAttribute('aria-label', 'Tool categories');
    glide.className = 'tt-glide'; glide.setAttribute('aria-hidden', 'true'); bar.appendChild(glide);
    const tabs = groups.map((g, k) => {
        const h = g.querySelector('h3'), list = h.nextElementSibling, ico = h.querySelector('i');
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'tt-tab'; b.id = 'ttTab' + k; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'ttPanel' + k);
        if (ico) { const i = document.createElement('i'); i.className = ico.className.replace(/\bmr-\d\b/, '').trim(); i.setAttribute('aria-hidden', 'true'); b.appendChild(i); }
        const s = document.createElement('span'); s.textContent = h.textContent.trim(); b.appendChild(s);
        const count = list ? list.children.length : 0;
        const n = document.createElement('b'); n.textContent = count; n.setAttribute('aria-hidden', 'true'); b.appendChild(n);
        h.dataset.count = count + (count === 1 ? ' tool' : ' tools');
        b.setAttribute('aria-label', s.textContent); b.title = s.textContent;           // phones show only the icon
        g.id = 'ttPanel' + k; g.classList.add('tt-panel'); g.setAttribute('role', 'tabpanel'); g.setAttribute('aria-labelledby', b.id);
        if (list) Array.from(list.children).forEach((c, i) => c.style.setProperty('--i', i));
        bar.appendChild(b); return b;
    });
    grid.parentNode.insertBefore(bar, grid);
    all.classList.add('tt-on');
    const cnt = document.getElementById('tmCount');
    if (cnt) cnt.textContent = all.querySelectorAll('.tool-icon').length;   // tool count on the View All button

    let cur = -1;
    function place() {
        const b = tabs[cur]; if (!b || !b.offsetWidth) return;
        glide.style.width = b.offsetWidth + 'px'; glide.style.height = b.offsetHeight + 'px';
        glide.style.top = b.offsetTop + 'px'; glide.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    }
    function edge() { bar.classList.toggle('at-end', bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 4); }
    function select(k, focus) {
        if (k === cur) return;
        const b = tabs[k];
        cur = k;
        tabs.forEach((t, i) => { const on = i === k; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
        groups.forEach((g, i) => { const off = i !== k; g.classList.toggle('tt-off', off); g.toggleAttribute('inert', off); g.setAttribute('aria-hidden', off); });
        const g = groups[k]; g.classList.remove('tt-in'); void g.offsetWidth; g.classList.add('tt-in');
        place();
        if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: b.offsetLeft - (bar.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' });
        if (focus) b.focus({ preventScroll: true });
    }
    bar.addEventListener('click', e => { const b = e.target.closest('.tt-tab'); if (b) select(tabs.indexOf(b)); });
    bar.addEventListener('keydown', e => {
        const m = { ArrowRight: cur + 1, ArrowLeft: cur - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (m == null) return; e.preventDefault(); select((m + tabs.length) % tabs.length, true);
    });
    bar.addEventListener('scroll', edge, { passive: true });
    select(0);
    if ('ResizeObserver' in window) new ResizeObserver(() => { place(); edge(); }).observe(bar); else addEventListener('resize', place);
    const toggle = document.getElementById('tmToggle');
    if (toggle) toggle.addEventListener('click', () => [60, 400, 700].forEach(t => setTimeout(() => { place(); edge(); }, t)));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
})();


/* ==========================================================================
   9. Cards: hover glow follows the cursor
   ========================================================================== */
// card hover glow follows the cursor
document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest('.soft-shadow'); if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
}, { passive: true });


/* ==========================================================================
   10. Cursor ring and sparkle trail
   ========================================================================== */
(function(){
  try{
    var d=document.documentElement;
    
    var glyphs=['✦','✧','✦','·'],last=0,mx=-99,my=-99,rx=-99,ry=-99;

    addEventListener('mousemove',function(e){
      mx=e.clientX;my=e.clientY;
      // blobs drift gently against the cursor
      var px=(e.clientX/innerWidth-.5),py=(e.clientY/innerHeight-.5);
      document.querySelectorAll('.animate-blob').forEach(function(b,i){var k=(i+1)*4;b.style.setProperty('--px',(-px*k)+'px');b.style.setProperty('--py',(-py*k)+'px')});
    },{passive:true});
        (function loop(){requestAnimationFrame(loop)})();


    // magnetic buttons
    var mags='.btn-primary,.btn-secondary,.hire-btn,.back-home';
    document.addEventListener('mousemove',function(e){
      document.querySelectorAll(mags).forEach(function(b){
        var r=b.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy;
        if(Math.abs(dx)<r.width/2+40&&Math.abs(dy)<r.height/2+40){b.style.setProperty('--mgx',(dx*.18)+'px');b.style.setProperty('--mgy',(dy*.28)+'px')}
        else{b.style.removeProperty('--mgx');b.style.removeProperty('--mgy')}
      });
    },{passive:true});
  }catch(err){}
})();


/* ==========================================================================
   11. Drifting background sparkles
   ========================================================================== */
(function(){
  try{
    var box=document.createElement('div');box.className='fx-drift';box.setAttribute('aria-hidden','true');
    var g=['✦','✧','✦','·','✦'];
    var cols=innerWidth<700?3:4,rows=innerWidth<700?2:3;
    for(var i=0;i<cols*rows;i++){
      var s=document.createElement('i');s.textContent=g[i%g.length];
      var cx=i%cols,cy=(i/cols)|0;
      s.style.cssText='left:'+((cx+.15+Math.random()*.7)/cols*100)+'%;top:'+((cy+.15+Math.random()*.7)/rows*100)+'%;font-size:'+(8+Math.random()*8)+'px;--g:'+(5+Math.random()*4)+'s;--w:-'+(Math.random()*8)+'s';
      box.appendChild(s);
    }
    document.body.appendChild(box);
    var hs=document.querySelectorAll('h2.text-3xl');
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('fx-in');io.unobserve(e.target)}})},{threshold:.6});
      hs.forEach(function(h){io.observe(h)});
    }else hs.forEach(function(h){h.classList.add('fx-in')});
  }catch(err){}
})();


/* ==========================================================================
   12. Work experience: career bar and scroll-in
   ========================================================================== */
// ===== Work Experience: career bar (sizes, year ticks, hover/tap linking) + scroll-in =====
(function () {
    try {
        var wrap = document.getElementById('crWrap'); if (!wrap) return;
        var bar = document.getElementById('cbBar'), ticks = document.getElementById('cbTicks');
        var segs = [].slice.call(bar.querySelectorAll('.cb-seg'));
        var cards = {}; [].forEach.call(wrap.querySelectorAll('.cr-card[data-k]'), function (c) { cards[c.dataset.k] = c; });
        function m(s) { if (s === 'now') { var d = new Date(); return d.getFullYear() * 12 + d.getMonth(); } var p = s.split('-'); return +p[0] * 12 + (+p[1] - 1); }
        // size each segment by its real length; the current one keeps growing with today's date
        var start = m(segs[0].dataset.from), end = m('now'), total = end - start;
        segs.forEach(function (s, i) { s.style.setProperty('--g', Math.max(1, m(s.dataset.to) - m(s.dataset.from))); s.style.setProperty('--i', i); });
        function drawTicks() {
            var step = bar.clientWidth < 420 ? 3 : bar.clientWidth < 640 ? 2 : 1, html = '<span style="left:0">' + segs[0].dataset.from.slice(0, 4) + '</span>';
            var y0 = Math.floor(start / 12) + 1, y1 = Math.floor(end / 12);
            for (var y = y0; y <= y1; y++) {
                var x = (y * 12 - start) / total * 100;
                if ((y - y0 + 1) % step || x > 90) continue;
                html += '<span style="left:' + x.toFixed(2) + '%">' + y + '</span>';
            }
            ticks.innerHTML = html + '<span style="left:100%">Now</span>';
        }
        drawTicks();
        if ('ResizeObserver' in window) new ResizeObserver(drawTicks).observe(bar); else addEventListener('resize', drawTicks);

        // link bar segments and cards both ways
        function hl(k, on) { var c = cards[k]; if (c) c.classList.toggle('hl', on); segs.forEach(function (s) { if (s.dataset.k === k) s.classList.toggle('hl', on); }); }
        segs.forEach(function (s) {
            s.addEventListener('mouseenter', function () { hl(s.dataset.k, true); });
            s.addEventListener('mouseleave', function () { hl(s.dataset.k, false); });
            s.addEventListener('click', function () {
                var c = cards[s.dataset.k]; if (!c) return;
                c.scrollIntoView({ behavior: 'smooth', block: 'center' });
                c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash');
            });
        });
        Object.keys(cards).forEach(function (k) {
            cards[k].addEventListener('mouseenter', function () { hl(k, true); });
            cards[k].addEventListener('mouseleave', function () { hl(k, false); });
        });

        if (!('IntersectionObserver' in window)) return;
        [].forEach.call(wrap.querySelectorAll('.cr'), function (r) { [].forEach.call(r.querySelectorAll('.cr-card'), function (c, i) { c.style.setProperty('--i', i); }); });
        document.getElementById('experience').classList.add('cr-js');
        function whenReady(fn) {
            if (document.documentElement.classList.contains('intro-on')) { setTimeout(function () { whenReady(fn); }, 250); return; }
            fn();
        }
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (en) {
                if (en.isIntersecting) { whenReady(function () { en.target.classList.add('in'); }); io.unobserve(en.target); }
            });
        }, { threshold: .15 });
        io.observe(wrap.querySelector('.cb'));
        [].forEach.call(wrap.querySelectorAll('.cr'), function (r) { io.observe(r); });
    } catch (err) {}
})();


/* ==========================================================================
   13. Hero photo orb
   ========================================================================== */
(function(){
  try{
    var ph=document.querySelector('#home .h2-photo');if(!ph||ph.parentNode.classList.contains('h2-wrap'))return;
    var wrap=document.createElement('div');wrap.className='h2-wrap';
    ph.parentNode.insertBefore(wrap,ph);wrap.appendChild(ph);
    var o=document.createElement('div');o.className='orb';o.setAttribute('aria-hidden','true');
    o.innerHTML='<div class="orb-ring"><i>✦</i><i>✦</i><i>✧</i></div><div class="orb-ring r2"><i>✦</i><i>·</i></div>';
    wrap.appendChild(o);
    wrap.addEventListener('mousemove',function(e){
      var r=wrap.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      ph.style.setProperty('--ty',(x*10)+'deg');ph.style.setProperty('--tx',(-y*10)+'deg');
    });
    wrap.addEventListener('mouseleave',function(){ph.style.setProperty('--ty','0deg');ph.style.setProperty('--tx','0deg')});
  }catch(err){}
})();


/* ==========================================================================
   14. Recommendations: fanned card deck (arrows, dots, keyboard, drag)
   ========================================================================== */
// ===== Recommendations: a fanned hand of cards. Arrows, dots, the name list, keyboard and drag all run the same shuffle =====
(function () {
    var deck = document.getElementById('recDeck'), ui = document.getElementById('recDeckUi');
    if (!deck || !ui) return;
    var cards = Array.prototype.slice.call(deck.querySelectorAll('.pc')), N = cards.length;
    if (N < 2) return;
    var dots = Array.prototype.slice.call(ui.querySelectorAll('.deck-dot'));
    var listBtns = Array.prototype.slice.call(document.querySelectorAll('#recList button'));
    var live = document.getElementById('recDeckLive');
    var hint = ui.querySelector('.deck-hint'); if (hint) hint.textContent = 'Drag the top card away to shuffle';
    var rm = window.matchMedia('(prefers-reduced-motion: reduce)');

    // ---- build the table ----
    var scene = document.createElement('div'), stage = document.createElement('div');
    scene.className = 'pr-scene'; stage.className = 'pr-stage';
    scene.tabIndex = 0; scene.setAttribute('role', 'group'); scene.setAttribute('aria-roledescription', 'carousel'); scene.setAttribute('aria-label', 'Management recommendations');
    cards.forEach(function (c, k) {
        c.setAttribute('role', 'group'); c.setAttribute('aria-roledescription', 'card');
        c.setAttribute('aria-label', 'Recommendation ' + (k + 1) + ' of ' + N);
        var sn = document.createElement('i'); sn.className = 'pr-sheen'; sn.setAttribute('aria-hidden', 'true'); c.appendChild(sn);
        stage.appendChild(c);
    });
    scene.appendChild(stage); deck.appendChild(scene);
    deck.classList.add('deck-on'); ui.classList.add('deck-on');

    // ---- state: order[0] is the top card; every card is a little spring-driven body ----
    var order = cards.map(function (_, i) { return i; });
    var S = cards.map(function () { return { x: 0, y: 0, r: 0, s: 1, vx: 0, vy: 0, vr: 0, vs: 0, tx: 0, ty: 0, tr: 0, ts: 1, z: 1, held: false }; });
    var K = rm.matches ? 300 : 190, Cd = rm.matches ? 34 : 21;
    var W = 480, raf = 0, last = 0, gen = 0, busy = false, queue = [], idx = -1, used = false, entered = false, drag = null, timers = [];

    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function slot(p) { return { x: 0, y: 0, r: -5 * p, s: 1 }; }
    function aim(i, t) { var s = S[i]; if (t.x != null) s.tx = t.x; if (t.y != null) s.ty = t.y; if (t.r != null) s.tr = t.r; if (t.s != null) s.ts = t.s; kick(); }
    function snap(i, t) { var s = S[i]; s.x = s.tx = t.x; s.y = s.ty = t.y; s.r = s.tr = t.r; s.s = s.ts = t.s; s.vx = s.vy = s.vr = s.vs = 0; }
    function fanOut() { order.forEach(function (ci, p) { var t = slot(p); aim(ci, t); S[ci].z = N - p; }); }

    function paint() {
        for (var i = 0; i < N; i++) {
            var s = S[i], c = cards[i];
            c.style.setProperty('transform', 'translate3d(' + s.x.toFixed(2) + 'px,' + s.y.toFixed(2) + 'px,0) rotate(' + s.r.toFixed(3) + 'deg) scale(' + s.s.toFixed(4) + ')', 'important');
            c.style.zIndex = s.z;
        }
    }
    function tick(now) {
        var dt = Math.min(.034, (now - last) / 1000 || .016), moving = false; last = now;
        S.forEach(function (s) {
            if (s.held) return;
            ['x', 'y', 'r', 's'].forEach(function (k) {
                var v = 'v' + k, t = 't' + k, kk = k === 's' ? K * 2 : K;
                s[v] += (kk * (s[t] - s[k]) - Cd * s[v]) * dt; s[k] += s[v] * dt;
                if (Math.abs(s[t] - s[k]) > .02 || Math.abs(s[v]) > .05) moving = true;
            });
        });
        paint();
        if (moving) raf = requestAnimationFrame(tick); else raf = 0;
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }

    function sync() {
        var i = order[0]; if (i === idx) return;
        var first = idx < 0; idx = i;
        cards.forEach(function (c, k) {
            var f = k === i;
            c.classList.toggle('is-front', f);
            c.setAttribute('aria-hidden', f ? 'false' : 'true');
            if (f) c.removeAttribute('inert'); else c.setAttribute('inert', '');
        });
        dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
        listBtns.forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
        if (live && !first) { var n = cards[i].querySelector('.font-bold'); live.textContent = 'Recommendation ' + (i + 1) + ' of ' + N + (n ? ': ' + n.textContent : ''); }
    }
    function touched() { if (!used) { used = true; ui.classList.add('used'); } }

    // ---- the moves ----
    // next: the top card is pulled out to the side, swung round and tucked in underneath while the rest fan forward
    // prev: the bottom card is slid out from under the pile and laid on top
    function mkNext(side, fast) {
        return function (done) {
            var c = order[0], T = fast ? 170 : 250, g = gen;
            S[c].z = N + 3;
            aim(c, rm.matches ? { x: side * 30, y: -8, r: 0 } : { x: side * W * .56, y: -34, r: side * 15 });
            later(function () {
                if (g !== gen) return;
                order.push(order.shift()); sync();
                S[c].z = 1;                                           // slips under the others
                order.forEach(function (ci, p) { if (ci !== c) S[ci].z = N - p + 1; });
                fanOut(); S[c].z = 1;
                later(done, fast ? 120 : 190);
            }, T);
        };
    }
    function mkPrev(side, fast) {
        return function (done) {
            var c = order[N - 1], T = fast ? 170 : 250, g = gen;
            aim(c, rm.matches ? { x: side * 30, y: -8, r: 0 } : { x: side * W * .56, y: -12, r: side * -13 });
            later(function () { if (g === gen) S[c].z = N + 3; }, T * .55);
            later(function () {
                if (g !== gen) return;
                order.unshift(order.pop()); sync(); fanOut(); S[c].z = N + 3;
                later(function () { if (g === gen) S[c].z = N; }, 260);
                later(done, fast ? 120 : 190);
            }, T);
        };
    }
    function pump() {
        if (busy || !queue.length) return;
        busy = true;
        queue.shift()(function () { busy = false; pump(); });
    }
    function enqueue(op) { if (queue.length < 4) { queue.push(op); pump(); } }
    function next() { touched(); enqueue(mkNext(1)); }
    function prev() { touched(); enqueue(mkPrev(-1)); }
    function goTo(k) {
        touched();
        var p = order.indexOf(k) , before = queue.length; if (p <= 0 && !busy && !queue.length) return;
        if (busy || queue.length) return;                             // let the current shuffle finish first
        if (p <= N / 2) for (var i = 0; i < p; i++) enqueue(mkNext(i % 2 ? -1 : 1, true));
        else for (var j = 0; j < N - p; j++) enqueue(mkPrev(j % 2 ? 1 : -1, true));
    }

    // ---- fit to content ----
    function layout() {
        var w = scene.clientWidth; if (!w) return;
        W = w;
        var h = 0;
        cards.forEach(function (c) { c.style.bottom = 'auto'; h = Math.max(h, c.offsetHeight); c.style.bottom = ''; });
        scene.style.height = '';
        var min = parseFloat(getComputedStyle(scene).minHeight) || 0;
        scene.style.height = Math.max(min, h + 4) + 'px';
    }
    var lastW = 0;
    if (window.ResizeObserver) new ResizeObserver(function () { var w = scene.clientWidth; if (w && w !== lastW) { lastW = w; layout(); } }).observe(scene);
    else window.addEventListener('resize', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

    // ---- phones / tablets: a light version. No per-frame spring physics and no riffle; cards just take a
    //      position (front / behind / far behind) and CSS transitions move them, which stays smooth on low-end phones
    if (window.matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)').matches) {
        scene.classList.add('pr-lite');
        if (hint) hint.textContent = 'Swipe the card or tap the arrows';
        var lbusy = false;
        function setPos(ci, p) { cards[ci].setAttribute('data-pos', typeof p === 'number' ? (p < 3 ? p : 'h') : p); }
        function posAll() { order.forEach(function (ci, p) { setPos(ci, p); }); }
        function lnext(side) {
            touched(); if (lbusy) return; lbusy = true;
            var c = order[0];
            setPos(c, side < 0 ? 'out-l' : 'out-r');                                    // front card flies off...
            order.push(order.shift()); sync();
            order.forEach(function (ci, p) { if (ci !== c) setPos(ci, p); });           // ...the rest step forward
            setTimeout(function () { setPos(c, order.indexOf(c)); lbusy = false; }, 300); // and it tucks in at the back
        }
        function lprev() {
            touched(); if (lbusy) return; lbusy = true;
            var c = order[N - 1];
            setPos(c, 'under');                                                          // back card slides out from under...
            setTimeout(function () { order.unshift(order.pop()); sync(); posAll(); lbusy = false; }, 240); // ...and lands on top
        }
        function ljump(k) {
            touched(); if (lbusy || order[0] === k) return;
            while (order[0] !== k) order.push(order.shift());
            sync(); posAll();
        }
        var sx = null, sy = 0, dxl = 0, lock = null, fc = null;
        scene.addEventListener('pointerdown', function (e) {
            if (lbusy || (e.pointerType === 'mouse' && e.button !== 0)) return;
            sx = e.clientX; sy = e.clientY; dxl = 0; lock = null; fc = cards[order[0]];
        });
        scene.addEventListener('pointermove', function (e) {
            if (sx === null) return;
            var dx = e.clientX - sx, dy = e.clientY - sy;
            if (lock === null) {
                if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
                lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
                if (lock === 'y') { sx = null; return; }
                fc.classList.add('pr-drag');
            }
            dxl = dx;
            fc.style.setProperty('transform', 'translateX(' + dx + 'px) rotate(' + (dx / 25).toFixed(2) + 'deg)', 'important');
        });
        function lend() {
            if (sx === null) return; sx = null;
            if (lock !== 'x') return;
            fc.classList.remove('pr-drag'); fc.style.removeProperty('transform');
            if (Math.abs(dxl) > 60) lnext(dxl < 0 ? -1 : 1);
        }
        scene.addEventListener('pointerup', lend);
        scene.addEventListener('pointercancel', lend);
        scene.addEventListener('dragstart', function (e) { e.preventDefault(); });
        scene.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') { e.preventDefault(); lnext(1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); lprev(); }
        });
        ui.addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return;
            if (b.dataset.deck === 'next') lnext(1);
            else if (b.dataset.deck === 'prev') lprev();
            else if (b.dataset.i != null) ljump(parseInt(b.dataset.i, 10));
        });
        listBtns.forEach(function (b) { b.addEventListener('click', function () { ljump(parseInt(b.dataset.i, 10)); }); });
        sync(); posAll(); entered = true;
        if ('IntersectionObserver' in window) {
            var lt = 0;
            new IntersectionObserver(function (es) {
                var r = es[0].intersectionRatio;
                if (r >= .2 && !scene.classList.contains('shown')) whenReady(function () {
                    scene.classList.add('entering', 'shown');
                    clearTimeout(lt); lt = setTimeout(function () { scene.classList.remove('entering'); }, 1500);
                });
                else if (r === 0 && !lbusy) { clearTimeout(lt); scene.classList.remove('entering', 'shown'); }   // replays next time it scrolls in
            }, { threshold: [0, .2] }).observe(scene);
        } else scene.classList.add('shown');
        return;
    }

    // ---- drag the top card away; it flies off, then slips in at the back ----
    scene.addEventListener('pointerdown', function (e) {
        if (busy || queue.length || !entered) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lock: null, v: 0, lx: e.clientX, lt: performance.now(), dx: 0, c: order[0] };
    });
    scene.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (drag.lock === null) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
            if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
            drag.lock = 'x'; touched(); scene.classList.add('grabbing');
            S[drag.c].held = true; S[drag.c].z = N + 3;
            try { scene.setPointerCapture(e.pointerId); } catch (err) {}
        }
        var now = performance.now(), s = S[drag.c];
        drag.v = .6 * drag.v + .4 * ((e.clientX - drag.lx) / Math.max(1, now - drag.lt));
        drag.lx = e.clientX; drag.lt = now; drag.dx = dx;
        s.x = dx; s.y = -Math.min(Math.abs(dx) * .07, 18); s.r = Math.max(-18, Math.min(18, dx / 12)); s.vx = s.vy = s.vr = 0;
        s.tx = s.x; s.ty = s.y; s.tr = s.r;
        paint();
    });
    function release(e, cancel) {
        if (!drag || e.pointerId !== drag.id) return;
        var d = drag; drag = null;
        try { scene.releasePointerCapture(e.pointerId); } catch (err) {}
        scene.classList.remove('grabbing');
        if (d.lock !== 'x') return;
        var s = S[d.c]; s.held = false;
        var thr = Math.min(90, W * .22);
        if (!cancel && (Math.abs(d.dx) > thr || (Math.abs(d.v) > .6 && Math.abs(d.dx) > 24))) {
            var side = d.dx < 0 ? -1 : 1, g = gen;
            busy = true;
            aim(d.c, { x: side * W * .95, y: -40, r: side * 22 });
            later(function () {
                if (g !== gen) return;
                order.push(order.shift()); sync();
                order.forEach(function (ci, p) { S[ci].z = N - p + 1; });
                fanOut(); S[d.c].z = 1;
                later(function () { busy = false; pump(); }, 200);
            }, 190);
        } else { aim(d.c, slot(0)); later(function () { S[d.c].z = N; }, 250); }
    }
    scene.addEventListener('pointerup', function (e) { release(e, false); });
    scene.addEventListener('pointercancel', function (e) { release(e, true); });
    scene.addEventListener('dragstart', function (e) { e.preventDefault(); });
    scene.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });

    // ---- controls: arrows, dots and the names on the left ----
    ui.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.deck === 'next') next();
        else if (b.dataset.deck === 'prev') prev();
        else if (b.dataset.i != null) goTo(parseInt(b.dataset.i, 10));
    });
    listBtns.forEach(function (b) { b.addEventListener('click', function () { goTo(parseInt(b.dataset.i, 10)); }); });

    // ---- the shuffle: the pile is cut, riffled and fanned out each time the section scrolls into view ----
    function pile() {
        order.forEach(function (ci, p) { snap(ci, { x: 0, y: 26, r: [-7, 5, -2][p % 3], s: .9 }); S[ci].z = N - p; });
        paint();
    }
    function entrance() {
        if (entered) return; entered = true; scene.classList.add('shown');
        if (rm.matches) { fanOut(); paint(); return; }
        busy = true;
        later(function () {
            var g = gen, k = 0;
            // riffle: the pile splits and the halves pass through each other, then the hand opens up
            order.forEach(function (ci, p) { aim(ci, { x: (p % 2 ? 1 : -1) * 36, y: 8, r: (p % 2 ? 1 : -1) * 6, s: .96 }); });
            later(function () {
                if (g !== gen) return;
                order.forEach(function (ci, p) { aim(ci, { x: (p % 2 ? -1 : 1) * 30, y: 14, r: (p % 2 ? -1 : 1) * 4, s: .96 }); });
                later(function () {
                    if (g !== gen) return;
                    busy = false; fanOut();
                    // one overhand pass (every card once, so the order ends where it began)
                    for (var n = 0; n < N; n++) enqueue(mkPrev(n % 2 ? 1 : -1, true));
                    pump();
                }, 200);
            }, 230);
        }, 260);
    }
    function reset() {
        if (!entered) return;
        entered = false; gen++; timers.forEach(clearTimeout); timers = []; queue = []; busy = false;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        order = cards.map(function (_, i) { return i; }); idx = -1; sync();
        scene.classList.remove('shown'); pile();
    }
    function whenReady(fn) {
        if (document.documentElement.classList.contains('intro-on')) { setTimeout(function () { whenReady(fn); }, 250); return; }
        fn();
    }
    sync(); pile();
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
            es.forEach(function (en) {
                if (en.intersectionRatio >= .25) whenReady(entrance);
                else if (en.intersectionRatio === 0) reset();
            });
        }, { threshold: [0, .25] }).observe(scene);
    } else { entered = true; scene.classList.add('shown'); fanOut(); paint(); }
})();


/* ==========================================================================
   15. Skills: rows and arches rise in on scroll
   ========================================================================== */
// ===== Skills: rows and arches rise in each time they scroll into view =====
(function () {
    try {
        var sec = document.getElementById('skills'), els = [document.getElementById('exList'), document.getElementById('stArches')];
        if (!sec || !els[0] || !els[1]) return;
        if (!('IntersectionObserver' in window)) return;
        sec.classList.add('sk-js');
        function whenReady(fn) {
            if (document.documentElement.classList.contains('intro-on')) { setTimeout(function () { whenReady(fn); }, 250); return; }
            fn();
        }
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (en) {
                var el = en.target;
                if (en.intersectionRatio >= .2) whenReady(function () { el.classList.add('in'); });
                else if (en.intersectionRatio === 0) el.classList.remove('in');
            });
        }, { threshold: [0, .2] });
        els.forEach(function (el) { io.observe(el); });
    } catch (err) {}
})();


/* ==========================================================================
   16. Lyn's Assistant button: peek the label once on touch screens
   ========================================================================== */
// Lyn's Assistant icon: on touch screens (no hover) peek the label once, then collapse it
(function () {
    var fab = document.getElementById('chatFab');
    if (!fab || !window.matchMedia('(hover: none)').matches) return;
    function go() {
        if (document.documentElement.classList.contains('intro-on')) { setTimeout(go, 300); return; }
        setTimeout(function () {
            if (fab.getAttribute('aria-expanded') === 'true') return;
            fab.classList.add('peek');
            setTimeout(function () { fab.classList.remove('peek'); }, 3200);
        }, 1800);
    }
    go();
    fab.addEventListener('click', function () { fab.classList.remove('peek'); });
})();


/* ==========================================================================
   17. Installable app: register the service worker
   ========================================================================== */
// installable app: register the service worker (https only; skipped when the file is opened straight from disk)
if ('serviceWorker' in navigator && location.protocol === 'https:') {
    addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
