<!DOCTYPE html>
<html lang="ru">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-844LP3WRP4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-844LP3WRP4');
</script>

<meta name="google-site-verification" content="p7FB9ajHqFNSniaR-6a4eyQv5qBuHSaoXpx-qpFeBXU" />
<meta name="yandex-verification" content="2125869cf8889694" />
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Елена Мишарина — Сайты под заявки</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'Inter', sans-serif; background: #0D0D14; color: #F0F0F5; font-size: 16px; line-height: 1.6; }

/* NAV */
nav { background: #0D0D14; border-bottom: 1px solid #1E1E2E; padding: 16px 40px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
.nav-logo { font-size: 16px; font-weight: 700; color: #F0F0F5; text-decoration: none; }
.nav-links { display: flex; gap: 24px; }
.nav-links a { font-size: 14px; color: #8B8B9E; text-decoration: none; transition: color 0.2s; }
.nav-links a:hover { color: #F0F0F5; }
.nav-cta { background: linear-gradient(135deg, #7C3AED, #A855F7); color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; }

/* HERO */
.hero { padding: 80px 40px 72px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; max-width: 1200px; margin: 0 auto; }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; background: #1A1030; border: 1px solid #3D2A6E; border-radius: 20px; padding: 6px 14px; font-size: 12px; color: #A78BFA; margin-bottom: 24px; }
.hero-badge-dot { width: 7px; height: 7px; background: #7C3AED; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.hero h1 { font-size: 52px; font-weight: 800; line-height: 1.15; margin-bottom: 20px; }
.hero h1 span { background: linear-gradient(135deg, #7C3AED, #A855F7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.hero-sub { font-size: 17px; color: #8B8B9E; line-height: 1.7; margin-bottom: 32px; }
.hero-btns { display: flex; gap: 14px; flex-wrap: wrap; }
.btn-primary { background: linear-gradient(135deg, #7C3AED, #A855F7); color: #fff; border: none; border-radius: 12px; padding: 14px 28px; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; transition: opacity 0.2s, transform 0.2s; }
.btn-primary:hover { opacity: 0.9; transform: translateY(-2px); }
.btn-ghost { background: transparent; color: #A78BFA; border: 1px solid #3D2A6E; border-radius: 12px; padding: 14px 28px; font-size: 15px; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.2s; }
.btn-ghost:hover { background: #1A1030; }
.hero-stats { display: flex; gap: 32px; margin-top: 36px; }
.stat-num { font-size: 26px; font-weight: 800; color: #A78BFA; }
.stat-label { font-size: 12px; color: #8B8B9E; margin-top: 2px; }
.hero-visual { background: #13131E; border: 1px solid #1E1E2E; border-radius: 16px; padding: 24px; }
.browser-bar { display: flex; gap: 6px; margin-bottom: 16px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.browser-url { flex: 1; background: #0D0D14; border-radius: 6px; height: 10px; margin-left: 8px; }
.browser-screen { background: #0D0D14; border-radius: 10px; padding: 20px; }
.mock-heading { height: 10px; background: #2A1F4E; border-radius: 5px; width: 65%; margin-bottom: 10px; }
.mock-text { height: 6px; background: #1E1E2E; border-radius: 3px; margin-bottom: 6px; }
.mock-btn { height: 32px; background: linear-gradient(135deg, #7C3AED, #A855F7); border-radius: 8px; width: 48%; margin-top: 14px; }
.mock-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
.mock-card { background: #13131E; border: 1px solid #1E1E2E; border-radius: 8px; padding: 12px; }
.mock-icon { width: 22px; height: 22px; background: #2A1F4E; border-radius: 5px; margin-bottom: 8px; }
.mock-icon.accent { background: #7C3AED; }
.mock-line { height: 5px; background: #1E1E2E; border-radius: 3px; margin-bottom: 5px; }

/* SECTIONS */
section { padding: 72px 40px; }
.container { max-width: 1200px; margin: 0 auto; }
.section-alt { background: #10101A; }
.section-label { font-size: 11px; color: #7C3AED; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px; }
.section-title { font-size: 36px; font-weight: 700; margin-bottom: 12px; }
.section-sub { font-size: 16px; color: #8B8B9E; line-height: 1.7; max-width: 540px; margin-bottom: 40px; }

/* PAIN */
.pain-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.pain-card { background: #13131E; border: 1px solid #1E1E2E; border-radius: 14px; padding: 24px; transition: border-color 0.2s; }
.pain-card:hover { border-color: #3D2A6E; }
.pain-icon { width: 44px; height: 44px; background: #1A1030; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 22px; }
.pain-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.pain-text { font-size: 14px; color: #8B8B9E; line-height: 1.6; }

/* BENEFITS */
.benefits-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.benefit-item { display: flex; gap: 16px; align-items: flex-start; background: #13131E; border: 1px solid #1E1E2E; border-radius: 12px; padding: 20px; transition: border-color 0.2s; }
.benefit-item:hover { border-color: #3D2A6E; }
.benefit-icon { width: 40px; height: 40px; background: #1A1030; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.benefit-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
.benefit-text { font-size: 13px; color: #8B8B9E; line-height: 1.6; }

/* PROCESS + INCLUDES */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }
.process-steps { display: flex; flex-direction: column; }
.process-step { display: grid; grid-template-columns: 52px 1fr; gap: 18px; padding: 22px 0; border-bottom: 1px solid #1E1E2E; }
.process-step:last-child { border-bottom: none; }
.step-num { width: 40px; height: 40px; background: linear-gradient(135deg, #7C3AED, #A855F7); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: #fff; flex-shrink: 0; }
.step-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
.step-text { font-size: 13px; color: #8B8B9E; line-height: 1.6; }
.includes-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.include-item { display: flex; gap: 14px; align-items: flex-start; padding: 16px; background: #13131E; border: 1px solid #1E1E2E; border-radius: 12px; }
.include-check { color: #7C3AED; font-size: 20px; flex-shrink: 0; margin-top: 2px; }
.include-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.include-text { font-size: 12px; color: #8B8B9E; line-height: 1.5; }

/* NEURO */
.neuro-flow { display: flex; align-items: center; gap: 10px; justify-content: center; margin: 32px 0; flex-wrap: wrap; }
.neuro-node { background: #13131E; border: 1px solid #3D2A6E; border-radius: 12px; padding: 14px 22px; font-size: 14px; font-weight: 600; color: #A78BFA; }
.neuro-node.active { background: linear-gradient(135deg, #7C3AED, #A855F7); border-color: transparent; color: #fff; }
.neuro-arrow { color: #3D2A6E; font-size: 22px; }
.neuro-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.neuro-card { background: #13131E; border: 1px solid #1E1E2E; border-radius: 12px; padding: 20px; text-align: center; }
.neuro-card-icon { font-size: 28px; margin-bottom: 12px; }
.neuro-card-title { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
.neuro-card-text { font-size: 13px; color: #8B8B9E; line-height: 1.6; }

/* ABOUT */
.about-wrap { display: grid; grid-template-columns: 220px 1fr; gap: 40px; align-items: start; }
.about-photo { width: 200px; height: 250px; border: 2px solid #3D2A6E; border-radius: 16px; overflow: hidden; }
.about-photo img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
.about-name { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
.about-role { font-size: 15px; color: #7C3AED; font-weight: 500; margin-bottom: 18px; }
.about-text { font-size: 15px; color: #8B8B9E; line-height: 1.8; }
.about-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 20px; }
.about-tag { background: #1A1030; border: 1px solid #3D2A6E; border-radius: 20px; padding: 5px 14px; font-size: 12px; color: #A78BFA; }

/* GUARANTEE */
.guarantee-box { background: #13131E; border: 1px solid #3D2A6E; border-radius: 18px; padding: 36px 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
.guarantee-icon { font-size: 28px; margin-bottom: 12px; }
.guarantee-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.guarantee-text { font-size: 14px; color: #8B8B9E; line-height: 1.7; }
.guarantee-note { grid-column: 1 / -1; background: #1A1030; border: 1px solid #3D2A6E; border-radius: 12px; padding: 18px 22px; font-size: 14px; color: #A78BFA; line-height: 1.7; }

/* PRICES */
.prices-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; }
.price-card { background: #13131E; border: 1px solid #1E1E2E; border-radius: 16px; padding: 28px; position: relative; transition: transform 0.2s; }
.price-card:hover { transform: translateY(-4px); }
.price-card.featured { border-color: #7C3AED; }
.price-badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #7C3AED, #A855F7); color: #fff; font-size: 11px; font-weight: 700; padding: 4px 16px; border-radius: 20px; white-space: nowrap; }
.price-name { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.price-old { font-size: 14px; color: #8B8B9E; text-decoration: line-through; margin-bottom: 4px; }
.price-new { font-size: 34px; font-weight: 800; color: #A78BFA; margin-bottom: 4px; }
.price-period { font-size: 12px; color: #8B8B9E; margin-bottom: 20px; }
.price-divider { height: 1px; background: #1E1E2E; margin-bottom: 18px; }
.price-feature { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; font-size: 14px; color: #8B8B9E; }
.price-check { color: #7C3AED; flex-shrink: 0; font-weight: 700; }
.price-btn { width: 100%; margin-top: 20px; background: transparent; border: 1px solid #3D2A6E; color: #A78BFA; border-radius: 10px; padding: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; text-decoration: none; display: block; text-align: center; }
.price-btn:hover { background: #1A1030; }
.price-btn.featured-btn { background: linear-gradient(135deg, #7C3AED, #A855F7); border: none; color: #fff; }
.price-btn.featured-btn:hover { opacity: 0.9; }
.price-promo { text-align: center; margin-top: 24px; font-size: 14px; color: #8B8B9E; }
.price-promo span { color: #A78BFA; font-weight: 600; }

/* FAQ */
.faq-list { display: flex; flex-direction: column; gap: 10px; margin-top: 32px; }
.faq-item { background: #13131E; border: 1px solid #1E1E2E; border-radius: 12px; overflow: hidden; cursor: pointer; transition: border-color 0.2s; }
.faq-item.open { border-color: #3D2A6E; }
.faq-q { font-size: 15px; font-weight: 600; padding: 20px 22px; display: flex; justify-content: space-between; align-items: center; gap: 16px; user-select: none; }
.faq-toggle { color: #7C3AED; font-size: 24px; font-weight: 300; flex-shrink: 0; line-height: 1; transition: transform 0.25s; }
.faq-item.open .faq-toggle { transform: rotate(45deg); }
.faq-a { font-size: 14px; color: #8B8B9E; line-height: 1.7; padding: 0 22px 20px; display: none; }
.faq-item.open .faq-a { display: block; }

/* CTA */
.cta-section { background: #13131E; border-top: 1px solid #1E1E2E; padding: 80px 40px; text-align: center; }
.cta-title { font-size: 38px; font-weight: 800; margin-bottom: 14px; }
.cta-sub { font-size: 16px; color: #8B8B9E; margin-bottom: 40px; line-height: 1.7; }
.cta-form { max-width: 480px; margin: 0 auto; }
.cta-input { width: 100%; background: #0D0D14; border: 1px solid #1E1E2E; border-radius: 12px; padding: 14px 18px; color: #F0F0F5; font-size: 15px; margin-bottom: 12px; outline: none; font-family: inherit; transition: border-color 0.2s; }
.cta-input::placeholder { color: #8B8B9E; }
.cta-input:focus { border-color: #7C3AED; }
.cta-btn { width: 100%; background: linear-gradient(135deg, #7C3AED, #A855F7); color: #fff; border: none; border-radius: 12px; padding: 16px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; margin-top: 4px; transition: opacity 0.2s, transform 0.2s; }
.cta-btn:hover { opacity: 0.9; transform: translateY(-2px); }
.cta-divider { display: flex; align-items: center; gap: 14px; max-width: 480px; margin: 24px auto; }
.cta-divider-line { flex: 1; height: 1px; background: #1E1E2E; }
.cta-divider-text { font-size: 13px; color: #8B8B9E; white-space: nowrap; }
.cta-socials { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.social-link { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #A78BFA; background: #1A1030; border: 1px solid #3D2A6E; border-radius: 10px; padding: 11px 20px; text-decoration: none; transition: background 0.2s; }
.social-link:hover { background: #231545; }

/* FOOTER */
footer { padding: 24px 40px; border-top: 1px solid #1E1E2E; display: flex; justify-content: space-between; align-items: center; }
.footer-copy { font-size: 13px; color: #8B8B9E; }
.footer-link { font-size: 13px; color: #8B8B9E; text-decoration: none; }
.footer-link:hover { color: #A78BFA; }

/* RESPONSIVE */
@media (max-width: 768px) {
  nav { padding: 14px 20px; }
  .nav-links { display: none; }
  section { padding: 48px 20px; }
  .hero { grid-template-columns: 1fr; padding: 48px 20px; gap: 32px; }
  .hero h1 { font-size: 36px; }
  .hero-visual { display: none; }
  .pain-grid, .neuro-cards, .prices-grid { grid-template-columns: 1fr; }
  .benefits-grid, .two-col, .about-wrap, .guarantee-box { grid-template-columns: 1fr; }
  .section-title { font-size: 26px; }
  .cta-title { font-size: 28px; }
  footer { flex-direction: column; gap: 8px; text-align: center; }
}
</style>
</head>
<body>

<nav>
  <a class="nav-logo" href="#">Елена Мишарина</a>
  <div class="nav-links">
    <a href="#services">Услуги</a>
    <a href="#process">Процесс</a>
    <a href="#prices">Цены</a>
    <a href="#faq">FAQ</a>
  </div>
  <a class="nav-cta" href="#contact">Получить сайт</a>
</nav>

<!-- HERO -->
<section style="padding: 80px 40px 72px; background: #0D0D14;">
  <div class="hero container" style="padding: 0;">
    <div>
      <div class="hero-badge"><div class="hero-badge-dot"></div>Запуск за 7–14 дней</div>
      <h1>Создаю сайты, которые приводят <span>клиентов</span></h1>
      <p class="hero-sub">Простые и понятные сайты под заявки. Telegram, WhatsApp, VK, email — и любой удобный вам канал.</p>
      <div class="hero-btns">
        <a class="btn-primary" href="#contact">Получить сайт под заявки</a>
        <a class="btn-ghost" href="#prices">Узнать стоимость</a>
      </div>
      <div class="hero-stats">
        <div><div class="stat-num">7–14</div><div class="stat-label">дней до запуска</div></div>
        <div><div class="stat-num">Бесплатно</div><div class="stat-label">анализ конкурентов</div></div>
        <div><div class="stat-num">5</div><div class="stat-label">мест по акции</div></div>
      </div>
    </div>
    <div class="hero-visual">
      <div class="browser-bar">
        <div class="dot" style="background:#3D2A6E"></div>
        <div class="dot" style="background:#3D2A6E"></div>
        <div class="dot" style="background:#7C3AED"></div>
        <div class="browser-url"></div>
      </div>
      <div class="browser-screen">
        <div class="mock-heading"></div>
        <div class="mock-text" style="width:88%"></div>
        <div class="mock-text" style="width:72%"></div>
        <div class="mock-btn"></div>
        <div class="mock-cards">
          <div class="mock-card"><div class="mock-icon"></div><div class="mock-line"></div><div class="mock-line" style="width:60%"></div></div>
          <div class="mock-card"><div class="mock-icon accent"></div><div class="mock-line"></div><div class="mock-line" style="width:60%"></div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PAIN -->
<section class="section-alt" id="services">
  <div class="container">
    <div class="section-label">Узнаёшь себя?</div>
    <div class="section-title">Сайт есть — клиентов нет</div>
    <p class="section-sub">Три ситуации, с которых обычно начинается наш разговор</p>
    <div class="pain-grid">
      <div class="pain-card">
        <div class="pain-icon">📉</div>
        <div class="pain-title">Реклама идёт, заявок нет</div>
        <p class="pain-text">Тратишь бюджет на рекламу, но сайт не конвертирует. Люди заходят и уходят.</p>
      </div>
      <div class="pain-card">
        <div class="pain-icon">😐</div>
        <div class="pain-title">Сайт на конструкторе</div>
        <p class="pain-text">Выглядит как шаблон. Клиенты это чувствуют — и выбирают конкурента.</p>
      </div>
      <div class="pain-card">
        <div class="pain-icon">📭</div>
        <div class="pain-title">Заявки теряются</div>
        <p class="pain-text">Клиент написал в директ или на почту — и пропал. Нет системы приёма заявок.</p>
      </div>
    </div>
  </div>
</section>

<!-- BENEFITS -->
<section>
  <div class="container">
    <div class="section-label">Что вы получите</div>
    <div class="section-title">Сайт, заточенный под результат</div>
    <p class="section-sub">Не просто красиво — понятно, быстро, с формой заявки которая работает</p>
    <div class="benefits-grid">
      <div class="benefit-item"><div class="benefit-icon">🎯</div><div><div class="benefit-title">Структура под заявки</div><p class="benefit-text">Каждый блок ведёт клиента к одному действию — оставить контакт</p></div></div>
      <div class="benefit-item"><div class="benefit-icon">✈️</div><div><div class="benefit-title">Заявки в Telegram, VK или email</div><p class="benefit-text">Подключаю тот канал, который удобен вам</p></div></div>
      <div class="benefit-item"><div class="benefit-icon">📱</div><div><div class="benefit-title">Мобильная версия</div><p class="benefit-text">53% клиентов заходят со смартфона. Сайт работает везде одинаково</p></div></div>
      <div class="benefit-item"><div class="benefit-icon">🚀</div><div><div class="benefit-title">Запуск за 7–14 дней</div><p class="benefit-text">Не месяц ожидания — через две недели сайт принимает заявки</p></div></div>
    </div>
  </div>
</section>

<!-- PROCESS + INCLUDES -->
<section class="section-alt" id="process">
  <div class="container">
    <div class="two-col">
      <div>
        <div class="section-label">Как я работаю</div>
        <div class="section-title">4 шага до готового сайта</div>
        <div class="process-steps">
          <div class="process-step"><div class="step-num">1</div><div><div class="step-title">Анализ задачи</div><p class="step-text">Изучаю нишу, конкурентов и целевую аудиторию. Большинство сайтов не работают именно потому, что этот шаг пропускают.</p></div></div>
          <div class="process-step"><div class="step-num">2</div><div><div class="step-title">Структура под заявки</div><p class="step-text">Проектирую логику страницы: что видит клиент, куда смотрит, где оставляет заявку.</p></div></div>
          <div class="process-step"><div class="step-num">3</div><div><div class="step-title">Разработка и дизайн</div><p class="step-text">Профессиональный вид на любом устройстве. Дизайн не ради красоты — ради конверсии.</p></div></div>
          <div class="process-step"><div class="step-num">4</div><div><div class="step-title">Запуск и настройка</div><p class="step-text">Подключаю формы, Telegram, аналитику. Сайт готов принимать заявки с первого дня.</p></div></div>
        </div>
      </div>
      <div>
        <div class="section-label">Что входит</div>
        <div class="section-title">В каждый сайт включено</div>
        <div class="includes-list">
          <div class="include-item"><div class="include-check">✦</div><div><div class="include-title">Анализ конкурентов и ниши</div><p class="include-text">Смотрю как работают сайты в вашей теме и делаю структуру лучше</p></div></div>
          <div class="include-item"><div class="include-check">✦</div><div><div class="include-title">Дизайн под конверсию</div><p class="include-text">Не просто красиво — клиент видит оффер и знает куда нажать</p></div></div>
          <div class="include-item"><div class="include-check">✦</div><div><div class="include-title">Адаптация под мобильные</div><p class="include-text">Сайт работает идеально на смартфоне, планшете и десктопе</p></div></div>
          <div class="include-item"><div class="include-check">✦</div><div><div class="include-title">Базовое SEO</div><p class="include-text">Сайт виден поисковикам с первого дня после запуска</p></div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- NEURO -->
<section>
  <div class="container">
    <div class="section-label">Уровень PRO</div>
    <div class="section-title">Система привлечения клиентов</div>
    <p class="section-sub">Для бизнеса, где важно не только получать заявки — но и не терять их</p>
    <div class="neuro-flow">
      <div class="neuro-node">🌐 Сайт</div>
      <div class="neuro-arrow">→</div>
      <div class="neuro-node">📋 Заявка</div>
      <div class="neuro-arrow">→</div>
      <div class="neuro-node">🤖 Автоответ</div>
      <div class="neuro-arrow">→</div>
      <div class="neuro-node">🔍 Квалификация</div>
      <div class="neuro-arrow">→</div>
      <div class="neuro-node active">💰 Сделка</div>
    </div>
    <div class="neuro-cards">
      <div class="neuro-card"><div class="neuro-card-icon">🤖</div><div class="neuro-card-title">Автоответ 24/7</div><p class="neuro-card-text">Клиент не ждёт. Нейросотрудник отвечает мгновенно в любое время суток</p></div>
      <div class="neuro-card"><div class="neuro-card-icon">👥</div><div class="neuro-card-title">Квалификация лидов</div><p class="neuro-card-text">Отделяет горячих клиентов от холодных. Вы тратите время только на тех, кто готов купить</p></div>
      <div class="neuro-card"><div class="neuro-card-icon">✈️</div><div class="neuro-card-title">Рассылка по каналам</div><p class="neuro-card-text">Telegram, VK, WhatsApp, Instagram — заявки не теряются ни в одном канале</p></div>
    </div>
  </div>
</section>

<!-- ABOUT -->
<section class="section-alt">
  <div class="container">
    <div class="section-label">Об исполнителе</div>
    <div class="about-wrap">
      <div class="about-photo">
        <img src="data:image/png;base64,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" alt="Елена Мишарина">
      </div>
      <div>
        <div class="about-name">Елена Мишарина</div>
        <div class="about-role">Веб-разработчик · Сайты под заявки</div>
        <p class="about-text">Я делаю сайты, которые приводят заявки — не просто выглядят красиво. В каждый проект включаю анализ ниши, работу над структурой и настройку форм связи.<br><br>Сейчас набираю первых клиентов и работаю по специальной цене запуска. Взамен — ваш отзыв и разрешение добавить сайт в портфолио.</p>
        <div class="about-tags">
          <span class="about-tag">Лендинги</span>
          <span class="about-tag">Корпоративные сайты</span>
          <span class="about-tag">Нейросистемы</span>
          <span class="about-tag">Telegram-боты</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- GUARANTEE -->
<section>
  <div class="container">
    <div class="section-label">Гарантия</div>
    <div class="section-title">Работаю до результата</div>
    <div class="guarantee-box">
      <div><div class="guarantee-icon">🎨</div><div class="guarantee-title">Не понравился дизайн</div><p class="guarantee-text">Переделаю бесплатно после первого показа. Без споров и дополнительных оплат.</p></div>
      <div><div class="guarantee-icon">📱</div><div class="guarantee-title">Проблема на мобильном</div><p class="guarantee-text">Если сайт не работает корректно на смартфоне — исправлю за 24 часа.</p></div>
      <div class="guarantee-note">Я заинтересована в том, чтобы вы остались довольны: мне нужен ваш отзыв и кейс для портфолио. Поэтому работаю на результат.</div>
    </div>
  </div>
</section>

<!-- PRICES -->
<section class="section-alt" id="prices">
  <div class="container">
    <div class="section-label">Стоимость</div>
    <div class="section-title">Цены и тарифы</div>
    <div class="prices-grid">
      <div class="price-card">
        <div class="price-name">Лендинг</div>
        <div class="price-old">35 000 ₽</div>
        <div class="price-new">19 000 ₽</div>
        <div class="price-period">цена запуска</div>
        <div class="price-divider"></div>
        <div class="price-feature"><span class="price-check">✦</span> Дизайн под конверсию</div>
        <div class="price-feature"><span class="price-check">✦</span> Мобильная адаптация</div>
        <div class="price-feature"><span class="price-check">✦</span> Форма заявки + Telegram</div>
        <div class="price-feature"><span class="price-check">✦</span> Базовое SEO</div>
        <a class="price-btn" href="#contact" onclick="selectTariff('Лендинг — 19 000 ₽')">Выбрать</a>
      </div>
      <div class="price-card featured">
        <div class="price-badge">Популярный</div>
        <div class="price-name">Корпоративный сайт</div>
        <div class="price-old">55 000 ₽</div>
        <div class="price-new">29 000 ₽</div>
        <div class="price-period">цена запуска</div>
        <div class="price-divider"></div>
        <div class="price-feature"><span class="price-check">✦</span> Всё из тарифа Лендинг</div>
        <div class="price-feature"><span class="price-check">✦</span> Несколько страниц</div>
        <div class="price-feature"><span class="price-check">✦</span> Анализ конкурентов</div>
        <div class="price-feature"><span class="price-check">✦</span> Расширенные интеграции</div>
        <a class="price-btn featured-btn" href="#contact" onclick="selectTariff('Корпоративный сайт — 29 000 ₽')">Выбрать</a>
      </div>
      <div class="price-card">
        <div class="price-name">Сайт + нейросистема</div>
        <div class="price-old">120 000 ₽</div>
        <div class="price-new">69 000 ₽</div>
        <div class="price-period">цена запуска</div>
        <div class="price-divider"></div>
        <div class="price-feature"><span class="price-check">✦</span> Всё из Корпоративного</div>
        <div class="price-feature"><span class="price-check">✦</span> Нейропродавец 24/7</div>
        <div class="price-feature"><span class="price-check">✦</span> Квалификация лидов</div>
        <div class="price-feature"><span class="price-check">✦</span> Все каналы связи</div>
        <a class="price-btn" href="#contact" onclick="selectTariff('Сайт + нейросистема — 69 000 ₽')">Выбрать</a>
      </div>
    </div>
    <p class="price-promo">Акция запуска · Набираю первых 5 клиентов · <span>Осталось 5 мест</span></p>
  </div>
</section>

<!-- FAQ -->
<section id="faq">
  <div class="container">
    <div class="section-label">Вопросы и ответы</div>
    <div class="section-title">FAQ</div>
    <div class="faq-list">
      <div class="faq-item open"><div class="faq-q">Сколько времени занимает разработка? <span class="faq-toggle">+</span></div><div class="faq-a">Лендинг — 7–14 дней. Корпоративный сайт — 14–21 день. Отсчёт начинается после получения брифа и материалов от вас.</div></div>
      <div class="faq-item"><div class="faq-q">Что нужно от меня для старта? <span class="faq-toggle">+</span></div><div class="faq-a">Заполненный бриф, логотип и контакты. Больше ничего — остальное беру на себя.</div></div>
      <div class="faq-item"><div class="faq-q">Что такое нейросистема? <span class="faq-toggle">+</span></div><div class="faq-a">Это автоматизированная система приёма и обработки заявок. Бот отвечает клиентам мгновенно, квалифицирует их и передаёт вам горячие лиды.</div></div>
      <div class="faq-item"><div class="faq-q">Будет ли поддержка после запуска? <span class="faq-toggle">+</span></div><div class="faq-a">Да, 14 дней бесплатных правок после запуска. Дальше — по договорённости.</div></div>
      <div class="faq-item"><div class="faq-q">Можно ли потом доработать сайт? <span class="faq-toggle">+</span></div><div class="faq-a">Да, в любой момент. Сайт остаётся у вас, вы получаете доступы и можете работать с любым разработчиком.</div></div>
      <div class="faq-item"><div class="faq-q">Как происходит оплата? <span class="faq-toggle">+</span></div><div class="faq-a">50% предоплата, 50% после сдачи проекта. Работаю по договору.</div></div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section" id="contact">
  <div class="cta-title">Получить сайт под заявки</div>
  <p class="cta-sub">Оставьте заявку — обсудим задачу и я скажу, подойдёт ли моё решение</p>
  <div class="cta-form">
    <div id="form-success" style="display:none; background:#1A1030; border:1px solid #3D2A6E; border-radius:12px; padding:20px; margin-bottom:16px; color:#A78BFA; font-size:15px; line-height:1.6;">✅ Заявка отправлена! Напишу вам в течение 2 часов.</div>
    <div id="selected-tariff" style="display:none; background:#1A1030; border:1px solid #7C3AED; border-radius:12px; padding:14px 18px; margin-bottom:12px; color:#A78BFA; font-size:14px; text-align:left;">
      <span style="color:#8B8B9E; font-size:12px;">Выбранный тариф:</span><br>
      <strong id="tariff-name"></strong>
      <span onclick="clearTariff()" style="float:right; cursor:pointer; color:#8B8B9E; font-size:18px; line-height:1;">×</span>
    </div>
    <form id="contact-form" action="https://formspree.io/f/mjgdaryr" method="POST">
      <input class="cta-input" type="text" name="name" placeholder="Ваше имя" required>
      <input class="cta-input" type="text" name="contact" id="f-contact" placeholder="Telegram / email / телефон" required>
      <div id="contact-error" style="display:none; color:#F87171; font-size:13px; text-align:left; margin:-6px 0 10px 4px;">Укажите телефон, email или Telegram (например: @username, +7 900 123-45-67 или mail@mail.ru)</div>
      <input class="cta-input" type="text" name="message" placeholder="Расскажите о задаче (необязательно)">
      <input type="hidden" name="tariff" id="f-tariff" value="Не выбран">
      <input type="hidden" name="_subject" value="Новая заявка с сайта — Елена Мишарина">
      <button class="cta-btn" type="submit">Получить сайт под заявки</button>
    </form>
  </div>
  <div class="cta-divider"><div class="cta-divider-line"></div><span class="cta-divider-text">или напишите напрямую</span><div class="cta-divider-line"></div></div>
  <div class="cta-socials">
    <a class="social-link" href="https://t.me/el_misharina" target="_blank">✈️ Telegram</a>
    <a class="social-link" href="https://vk.com/elenamisharina" target="_blank">💬 VK</a>
    <a class="social-link" href="mailto:740-200@mail.ru">✉️ 740-200@mail.ru</a>
  </div>
</section>

<footer>
  <span class="footer-copy">© 2025 Елена Мишарина. Все права защищены.</span>
  <a class="footer-link" href="#">Политика конфиденциальности</a>
</footer>

<script>
document.querySelectorAll(".faq-item").forEach(function(item) {
  item.querySelector(".faq-q").addEventListener("click", function() {
    var isOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item").forEach(function(i) { i.classList.remove("open"); });
    if (!isOpen) item.classList.add("open");
  });
});

function selectTariff(name) {
  document.getElementById("f-tariff").value = name;
  document.getElementById("tariff-name").textContent = name;
  document.getElementById("selected-tariff").style.display = "block";
}

function clearTariff() {
  document.getElementById("f-tariff").value = "Не выбран";
  document.getElementById("selected-tariff").style.display = "none";
}

function isValidContact(value) {
  value = value.trim();
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var phoneDigits = value.replace(/[^0-9]/g, "");
  var phoneRe = phoneDigits.length >= 10 && phoneDigits.length <= 15 && /^[+0-9()\s\-]+$/.test(value);
  var tgRe = /^@[a-zA-Z0-9_]{5,32}$/;
  var tgLinkRe = /^(https?:\/\/)?(t\.me|telegram\.me)\/[a-zA-Z0-9_]{5,32}$/;
  return emailRe.test(value) || phoneRe || tgRe.test(value) || tgLinkRe.test(value);
}

document.getElementById("contact-form").addEventListener("submit", function(e) {
  e.preventDefault();
  var form = e.target;
  var contactInput = document.getElementById("f-contact");
  var errorDiv = document.getElementById("contact-error");
  if (!isValidContact(contactInput.value)) {
    errorDiv.style.display = "block";
    contactInput.style.borderColor = "#F87171";
    contactInput.focus();
    return;
  }
  errorDiv.style.display = "none";
  contactInput.style.borderColor = "#1E1E2E";
  var btn = form.querySelector('button[type="submit"]');
  btn.textContent = "Отправляем...";
  btn.disabled = true;
  fetch(form.action, {
    method: "POST",
    body: new FormData(form),
    headers: { "Accept": "application/json" }
  }).then(function(res) {
    if (res.ok) {
      form.style.display = "none";
      document.getElementById("form-success").style.display = "block";
    } else {
      btn.textContent = "Ошибка — попробуйте ещё раз";
      btn.disabled = false;
    }
  }).catch(function() {
    btn.textContent = "Ошибка — попробуйте ещё раз";
    btn.disabled = false;
  });
});
</script>

<!-- Yandex.Metrika counter -->
<script type="text/javascript">
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=110102290', 'ym');
    ym(110102290, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/110102290" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->

</body>
</html>
