# План реализации: quiz.html — лид-квиз Vireflow

## Контекст

Лене нужен рост продаж услуг Vireflow (сайты, боты, AI-агенты) через продвижение в ВК, на сайте и на Авито. В рамках этой работы был спроектирован веб-квиз-лидогенератор: короткая анкета про бизнес клиента → персональная рекомендация → заявка. Он решает три задачи разом — выявляет боль клиента до звонка, демонстрирует экспертность (выглядит как разбор, а не реклама), и сам является живым кейсом продукта «квалификация лидов», который Vireflow продаёт клиентам.

Полный функциональный дизайн (все 8 веток вопросов, веса, развилка входящие/исходящие, экран результата, тон на «Вы») уже согласован с Леной и зафиксирован в `docs/specs/2026-08-24-quiz-design.md` на ветке `feature/lead-quiz` этого репозитория — **это финальный контент-спек, его формулировки и веса не пересматриваются**. Данный план — только про то, как это реализовать в коде: репозиторий статический (без сборки, весь CSS/JS инлайново в HTML), поэтому решения ниже — про переиспользование уже существующих в `index.html` паттернов, а не про новый стек.

Технические решения подтверждены с Леной:
- Отправка заявок — только через Google Apps Script (как сейчас реально работает на главной странице; Formspree в разметке остаётся для вида, но не вызывается — этот момент не трогаем ни на главной, ни в квизе).
- Итоговый адрес квиза — `vireflow.ru/quiz.html` (без настройки красивых ссылок на хостинге).

## Рекомендуемый подход

### Файл
Один новый файл в корне репозитория: **`quiz.html`**, по тому же принципу, что и `index.html`/`blog/stoimost-lendinga.html` — всё внутри (свой `<style>`, свой `<script>`), никаких общих JS/CSS файлов и сборки.

### Палитра и вёрстка — переиспользовать из `index.html`
- Цвета: фон `#080d1a`, карточки `#13131E`, рамки `#1a2545`, акцент `#4a9eff`, текст `#F0F0F5`/`#8B8B9E`, ошибка `#F87171`.
- Шрифт Inter (тот же `<link>` на Google Fonts), кнопки `.btn-primary`/`.cta-btn`, поля `.cta-input`, карточки в духе `.price-card`.
- Один брейкпоинт `@media (max-width: 768px)`, схлопывающий сетки в 1 колонку — как в `index.html:225-237`, не изобретать новых.
- Чекбоксы — нативные `<input type="checkbox">` с `accent-color: #4a9eff`, без кастомного компонента (в проекте такого компонента нет и не нужен).

### Данные вопросов
9 наборов веток (7 фиксированных ниш + 2 варианта форк-ветки для «Предприниматель»/«Своё» — входящая и исходящая, причём исходящая ветка общая для обеих) представить как JS-объект: на каждый вопрос — текст, подсказка «Отметьте всё, что подходит», список вариантов с весами по 4 категориям (`site/bot/agent/team`) и флагом `exclusive` у варианта «справляюсь». Общий Q5 («AI-партнёр») — отдельный объект, добавляется в конец любой ветки. У исходящей (аутбаунд) ветки категория `site` отображается как «База» через `categoryLabelOverrides`.

Пример полной ветки (Бьюти салон) для образца:

```js
const CATEGORY_KEYS = ['site', 'bot', 'agent', 'team'];
const HINT_TEXT = 'Отметьте всё, что подходит';

const BRANCHES = {
  beauty: {
    label: 'Салон',
    questions: [
      {
        text: 'Как сейчас клиенты записываются к Вам?',
        hint: HINT_TEXT,
        options: [
          { text: 'Только через директ/звонок — ни сайта, ни приложения для записи', weights: { site: 25 } },
          { text: 'Есть свой сайт/страница, но без формы или онлайн-записи', weights: { site: 15 } },
          { text: 'Есть готовое приложение для записи (YCLIENTS, Dikidi и т.п.), но клиенты всё равно пишут в директ с вопросами по цене и услугам', weights: { bot: 15 } },
          { text: 'Справляюсь — и с записью, и с вопросами клиентов, ничего не теряется', weights: {}, exclusive: true },
        ],
      },
      // Q2, Q3, Q4 — аналогично, текст и веса взять из docs/specs/2026-08-24-quiz-design.md
    ],
  },
  // dental, hr, accountant, appraiser, lawyer, entrepreneurInbound, customInbound, outbound —
  // та же форма, вопросы и веса переносятся дословно из design-спека
};

const Q5 = {
  text: 'Представьте: у Вас есть цифровой сотрудник, который заменяет сразу нескольких специалистов — юриста, маркетолога, аналитика — помнит всё о Вашем бизнесе, выполняет поручения и помогает вести и масштабировать его без найма новых людей. Хотели бы такого?',
  hint: HINT_TEXT,
  options: [
    { text: 'Да, хочу такого AI-помощника на постоянной основе', weights: { team: 30 }, aiPartner: true },
    { text: 'Интересно, но сначала хочу закрыть одну конкретную задачу', weights: { team: 10 }, aiPartner: 'maybe' },
    { text: 'Нет, нужно решить конкретную проблему разово', weights: {}, aiPartner: false },
  ],
};
```

Взять этот образец за основу при переносе оставшихся 8 веток текстом один в один из дизайн-спека (без изменения формулировок и весов).

### Движок рендера
Один универсальный `renderQuestion(question)`, который строит чекбоксы из массива опций:

```js
function renderQuestion(question) {
  els.qTitle.textContent = question.text;
  els.qHint.textContent = question.hint;
  els.qOptions.innerHTML = '';
  question.options.forEach((opt, i) => {
    const row = document.createElement('label');
    row.className = 'quiz-option';
    row.innerHTML = `<input type="checkbox" data-idx="${i}"> <span>${opt.text}</span>`;
    row.querySelector('input').addEventListener('change', () => onOptionToggle(question, i, row.querySelector('input')));
    els.qOptions.appendChild(row);
  });
  refreshNextButton();
}
```

Логика взаимоисключения («справляюсь» сбрасывает остальные и наоборот) — по тому же принципу «сбросить всё, затем поставить одно», что уже применяется в аккордеоне FAQ (`index.html:666-673`):

```js
function onOptionToggle(question, idx, checkbox) {
  const boxes = [...els.qOptions.querySelectorAll('input[type=checkbox]')];
  if (checkbox.checked && question.options[idx].exclusive) {
    boxes.forEach((b, i) => { if (i !== idx) b.checked = false; });
  } else if (checkbox.checked) {
    question.options.forEach((o, i) => { if (o.exclusive) boxes[i].checked = false; });
  }
  refreshNextButton();
}
```

Кнопка «Далее» неактивна, пока не отмечен хотя бы один вариант (`refreshNextButton` проверяет `:checked`). Переключение экранов (выбор ниши → развилка → Q1–Q4 → Q5 → результат → форма) — через показ/скрытие `<div class="quiz-screen">` с классом `active`, по аналогии с открытием виджета Алёны (`#alyona-widget.open`), но через CSS `animation` вместо `transition` (экраны разной высоты, не overlay фиксированного размера):

```css
.quiz-screen { display: none; }
.quiz-screen.active { display: block; animation: riseUp 0.35s ease-out; }
```

### Состояние и подсчёт баллов
Один объект состояния на время прохождения (без сохранения между визитами — ничего не отправляется, пока не заполнена финальная форма):

```js
const state = {
  nicheId: null, customText: '', flow: null, branchId: null,
  sequence: [], qPos: 0, answers: [],
  totals: { site: 0, bot: 0, agent: 0, team: 0 },
  theoreticalMax: { site: 0, bot: 0, agent: 0, team: 0 },
  aiPartnerVotes: [],
};
```

При переходе к следующему вопросу баллы прибавляются в `state.totals` по категориям, а в `state.theoreticalMax` — теоретический максимум по вопросу (сумма весов всех вариантов в категорию, т.к. multi-select позволяет отметить их все разом). Категория-победитель — максимум по `state.totals`, при равенстве — порядок Сайт → Бот → Агент → Команда. Процент — отношение суммы победителя к её теоретическому максимуму:

```js
function computeResult(state) {
  const ranked = CATEGORY_KEYS
    .map(k => ({ key: k, total: state.totals[k] }))
    .sort((a, b) => b.total - a.total || CATEGORY_KEYS.indexOf(a.key) - CATEGORY_KEYS.indexOf(b.key));
  const winner = ranked[0];
  const runnerUp = ranked[1].total > 0 ? ranked[1] : null;
  const max = state.theoreticalMax[winner.key];
  const percent = max > 0 ? Math.round((winner.total / max) * 100) : 0;
  const aiPartner = state.aiPartnerVotes.includes(true) ? true
    : state.aiPartnerVotes.includes('maybe') ? 'maybe' : false;
  return { winnerKey: winner.key, winnerTotal: winner.total, percent, runnerUpKey: runnerUp?.key ?? null, aiPartner };
}
```

Если все баллы нулевые (человек везде отвечал «справляюсь») — показывается нейтральный текст («Похоже, у Вас уже неплохо отлажено — но, возможно, есть что ускорить точечно») с 0% на шкале, а не пустой экран.

Флаг `aiPartner` считается по ответам Q5 с приоритетом `true` > `"maybe"` > `false` — человек технически может отметить несколько чекбоксов Q5 одновременно (они у нас все чекбоксы), поэтому нужно явное правило приоритета, и «да» как более сильный сигнал должно перевешивать.

### Экран результата
Текст зависит от `aiPartner`:
- `true` — полностью заменяет обычный результат текстом про AI-агента (дословно из спека: «Вам подойдёт AI-агент — недорогой цифровой помощник 24/7: советует, берёт часть работы на себя и подкидывает идеи для роста»).
- `"maybe"` — обычный результат остаётся, снизу добавляется мягкая строка-приписка («Кстати, если позже захотите не разовое решение, а постоянного AI-помощника — это тоже можно обсудить»).
- `false` — без изменений.

Плюс строка кросс-сейла по второй категории, если её балл > 0. CTA везде одинаковый: «Оставьте контакт — покажу, как это будет работать у Вас». Тексты рекомендаций под каждую из 4 категорий-победителей (Сайт/Бот/Агент/Команда) — черновик на основе тарифов с сайта (Лендинг 9k / Корп.сайт 19k / Сайт+AI-бот 49k / индивидуально), Лена дорабатывает формулировки по вкусу при вёрстке — это не часть зафиксированного контент-спека.

### Форма и отправка
Скопировать разметку и обработчик формы из `index.html:623-759` целиком (валидация контакта, чекбокс согласия, дизейбл кнопки на время отправки — без изменений). Добавить скрытые поля:

```html
<input type="hidden" name="niche" id="f-niche">
<input type="hidden" name="flow" id="f-flow">
<input type="hidden" name="quiz_answers" id="f-quiz-answers">
<input type="hidden" name="result_category" id="f-result-category">
<input type="hidden" name="result_percent" id="f-result-percent">
<input type="hidden" name="ai_partner" id="f-ai-partner">
```

Эти поля заполняются JS-функцией в момент показа экрана результата — по тому же принципу, что уже работает для `f-tariff` через `selectTariff()` (`index.html:675-684`):

```js
function populateFormFromQuizState(result) {
  document.getElementById('f-niche').value = state.nicheId === 'custom' ? state.customText : nicheLabel(state.nicheId);
  document.getElementById('f-flow').value = state.flow || '';
  document.getElementById('f-quiz-answers').value = state.sequence.map((q, i) =>
    `${q.text} → ${state.answers[i].map(idx => q.options[idx].text).join('; ')}`
  ).join('\n');
  document.getElementById('f-result-category').value = categoryLabel(result.winnerKey);
  document.getElementById('f-result-percent').value = String(result.percent);
  document.getElementById('f-ai-partner').value = result.aiPartner === true ? 'да' : result.aiPartner === 'maybe' ? 'может быть' : 'нет';
}
```

В `fetch`-запрос к тому же Google Apps Script URL эти поля добавляются как дополнительные ключи в тот же JSON-объект — без изменения структуры вызова и без второго запроса:

```js
body: JSON.stringify({
  name: form.name.value, contact: form.contact.value, tariff: form.tariff.value, message: form.message.value,
  niche: form.niche.value, flow: form.flow.value, quiz_answers: form.quiz_answers.value,
  result_category: form.result_category.value, result_percent: form.result_percent.value, ai_partner: form.ai_partner.value,
})
```

### Шапка страницы (SEO/мета)
Скопировать из `index.html:1-62`: gtag и Яндекс.Метрика (тот же счётчик — трафик квиза попадает в ту же аналитику), viewport/charset, favicon-ссылки, preconnect+Inter. Заменить `<title>`, `og:*`, `description`, `canonical` на `https://vireflow.ru/quiz.html` под тему квиза. JSON-LD (ProfessionalService/FAQPage) и скролл-reveal скрипт (`index.html:969-976`) — не переносить, они не подходят для одноэкранного квиза.

## Критические файлы

- `quiz.html` — новый файл, вся реализация здесь
- `index.html` — источник паттернов: шапка (1-62), палитра/CSS (63-358), разметка формы (623-658), идиома FAQ-переключения (666-673), идиома скрытых полей через `selectTariff()` (675-684), обработчик отправки (713-759)
- `docs/specs/2026-08-24-quiz-design.md` — зафиксированный контент-спек (источник всех формулировок и весов)
- `sitemap.xml` — добавить строку про `/quiz.html` в конце работы

## Порядок реализации (мелкими рабочими коммитами)

1. Шапка страницы + экран выбора ниши (7 кнопок + «Своё»)
2. Экран-развилка входящие/исходящие для «Предприниматель»/«Своё»
3. Модель данных вопросов + универсальный рендер — на одной ветке (Бьюти салон) от начала до экрана-заглушки результата
4. Остальные 8 наборов веток (данные, рендер уже готов)
5. Подсчёт баллов и экран результата со всеми вариантами `aiPartner`
6. Интеграция формы — скрытые поля + расширенный payload
7. SEO-шапка, sitemap, финальная проверка мобильной вёрстки

## Проверка (вручную, тестов и сборки в проекте нет)

1. Поднять локальный статический сервер (`npx serve .` или аналог) — Apps Script и Метрика ведут себя предсказуемее не через `file://`.
2. Пройти все 9 наборов веток минимум по разу (7 ниш + входящая/исходящая для Предпринимателя/Своего).
3. На каждом вопросе проверить: «Далее» неактивна без выбора; выбор «справляюсь» сбрасывает остальные чекбоксы и наоборот; «Назад» восстанавливает отмеченное.
4. Целенаправленно проверить все 3 состояния `aiPartner` и все 4 категории-победителя, включая ничью и случай «везде справляюсь» (нулевые баллы).
5. Отправить тестовую заявку, в DevTools → Network подтвердить один запрос к Apps Script с расширенным телом (все новые поля присутствуют) и отсутствие запроса к Formspree.
6. Проверить мобильную раскладку (<768px) — сетка ниш и вариантов ответов в один столбец.
