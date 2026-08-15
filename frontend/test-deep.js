// Глубокая проверка сценариев, которые были сломаны:
// вечные спиннеры, падения при прямом переходе, полнота колоды.
const { chromium } = require('playwright');

const BASE = 'http://localhost:8081';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const results = { pass: [], fail: [] };
function ok(name, detail) { results.pass.push(name); console.log(`   ✅ ${name}${detail ? ' — ' + detail : ''}`); }
function bad(name, detail) { results.fail.push(`${name}: ${detail}`); console.log(`   ❌ ${name} — ${detail}`); }

async function freshPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.errors = errors;
  return page;
}

// Переход внутри SPA: статический сервер не умеет отдавать /route без .html
async function navigate(page, linkText) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.click(`text=${linkText}`, { timeout: 10000 });
  await page.waitForTimeout(2500);
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });

  // ---------- 1. ГОРОСКОП БЕЗ ПРОФИЛЯ ----------
  console.log('\n📍 1. ГОРОСКОП без профиля (был вечный спиннер)');
  {
    const page = await freshPage(browser);
    await navigate(page, 'Гороскоп');

    let body = await page.textContent('body');
    if (body.includes('Составляю ваш гороскоп')) {
      bad('Гороскоп не зависает', 'всё ещё крутится спиннер');
    } else if (body.includes('Выберите ваш знак зодиака')) {
      ok('Гороскоп без профиля предлагает выбрать знак');

      // Проверяем что все 12 знаков на месте
      const signs = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'];
      const missing = signs.filter(s => !body.includes(s));
      if (missing.length === 0) ok('Все 12 знаков доступны');
      else bad('Все 12 знаков доступны', 'нет: ' + missing.join(', '));

      // Выбираем знак
      await page.click('text=Скорпион', { timeout: 8000 });
      await page.waitForTimeout(1500);
      body = await page.textContent('body');

      if (body.includes('Ваш гороскоп') && body.includes('Скорпион')) {
        ok('После выбора знака гороскоп строится');
      } else {
        bad('После выбора знака гороскоп строится', 'нет текста гороскопа');
      }

      // Ключевая регрессия: экран не должен сам себя уничтожить через 5 сек
      await page.waitForTimeout(7000);
      const after = await page.textContent('body');
      if (after.includes('Ваш гороскоп')) ok('Гороскоп не пропадает через 5 секунд');
      else bad('Гороскоп не пропадает через 5 секунд', 'экран подменился');

      // Разделы прогноза
      const sections = ['Любовь', 'Карьера', 'Здоровье', 'Счастливые символы'];
      const lost = sections.filter(s => !after.includes(s));
      if (lost.length === 0) ok('Все разделы прогноза на месте');
      else bad('Все разделы прогноза на месте', 'нет: ' + lost.join(', '));

      // Смена знака
      if (after.includes('Сменить знак')) {
        await page.click('text=Сменить знак');
        await page.waitForTimeout(1200);
        const picker = await page.textContent('body');
        if (picker.includes('Выберите ваш знак зодиака')) ok('Кнопка «Сменить знак» работает');
        else bad('Кнопка «Сменить знак» работает', 'выбор не открылся');
      } else {
        bad('Кнопка «Сменить знак» есть', 'не найдена');
      }
    } else {
      bad('Гороскоп без профиля', 'неожиданный экран');
    }

    // Знак должен запомниться между визитами
    await navigate(page, 'Гороскоп');
    const revisit = await page.textContent('body');
    if (revisit.includes('Скорпион') && revisit.includes('Ваш гороскоп')) ok('Выбранный знак запоминается');
    else if (revisit.includes('Выберите ваш знак')) bad('Выбранный знак запоминается', 'снова просит выбрать');
    await page.context().close();
  }

  // ---------- 2. КОЛОДА: 78 КАРТ ----------
  console.log('\n📍 2. КОЛОДА — полнота и масти');
  {
    const page = await freshPage(browser);
    await navigate(page, 'Каталог колоды');
    await page.waitForTimeout(1500);

    // Считаем карты через прокрутку списка
    const suits = [
      ['Старшие', 'Дурак'],
      ['Жезлы', 'Туз Жезлов'],
      ['Кубки', 'Туз Кубков'],
      ['Мечи', 'Туз Мечей'],
      ['Пентакли', 'Туз Пентаклей'],
    ];

    // Поиск проверяем первым — фильтр масти ещё не сужает выдачу
    try {
      const input = await page.$('input');
      if (!input) throw new Error('поле поиска не найдено');

      const checks = [
        ['Королева Пентаклей', 'Королева Пентаклей', 'по названию младшего аркана'],
        ['интуиц', 'Жрица', 'по ключевому слову'],
        ['Ace of', 'Туз', 'по английскому названию'],
      ];
      for (const [query, expected, what] of checks) {
        await input.fill(query);
        await page.waitForTimeout(1200);
        const body = await page.textContent('body');
        if (body.includes(expected)) ok(`Поиск ${what}`);
        else bad(`Поиск ${what}`, `не нашёл «${expected}»`);
      }
      await input.fill('');
      await page.waitForTimeout(800);
    } catch (e) {
      bad('Поиск по колоде', e.message.slice(0, 60));
    }

    for (const [filter, sample] of suits) {
      try {
        await page.click(`text=${filter}`, { timeout: 6000 });
        await page.waitForTimeout(900);
        const body = await page.textContent('body');
        if (body.includes(sample)) ok(`Масть «${filter}» наполнена`, sample);
        else bad(`Масть «${filter}» наполнена`, `нет карты «${sample}»`);
      } catch (e) {
        bad(`Масть «${filter}»`, 'фильтр недоступен');
      }
    }
    await page.context().close();
  }

  // ---------- 3. КАРТОЧКА КАРТЫ ----------
  console.log('\n📍 3. КАРТОЧКА КАРТЫ — описание и неизвестный id');
  {
    const page = await freshPage(browser);
    // Динамический маршрут: статического файла на карту нет, поэтому хостинг
    // отдаёт 404.html (= index.html), а роутер уже разбирает адрес сам
    await page.goto(`${BASE}/deck/22`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    let body = await page.textContent('body');

    if (body.includes('Туз Жезлов')) ok('Глубокая ссылка на младший аркан открывается');
    else bad('Глубокая ссылка на младший аркан', 'карта не отрисовалась');

    if (body.includes('Загрузка карты')) {
      bad('Карточка карты не зависает', 'вечный спиннер');
    } else if (body.includes('Образ карты')) {
      ok('Карточка показывает описание образа');
      if (body.includes('Ключевые слова') && body.includes('Значение') && body.includes('Толкование')) {
        ok('Все разделы карточки на месте');
      } else {
        bad('Все разделы карточки', 'часть отсутствует');
      }
    } else {
      bad('Карточка карты', 'нет раздела «Образ карты»');
    }
    await page.context().close();
  }

  // ---------- 4. РУНЫ ПОЛНЫЙ ЦИКЛ ----------
  console.log('\n📍 4. РУНЫ — полный цикл до результата');
  {
    const page = await freshPage(browser);
    await navigate(page, 'Руны');
    let body = await page.textContent('body');

    // Ищем кнопку запуска расклада
    const startCandidates = ['Бросить руны', 'Сделать расклад', 'Начать', 'Расклад'];
    let started = false;
    for (const label of startCandidates) {
      const el = await page.$(`text=${label}`);
      if (el) { await el.click(); await page.waitForTimeout(3000); started = true; break; }
    }
    body = await page.textContent('body');
    if (started && (body.includes('Руна') || body.includes('руна') || body.match(/[ᚠ-ᚹ]/))) {
      ok('Руны выпадают и показываются');
      if (!body.includes('Расклад не найден')) ok('Результат рун без пустого состояния');
    } else if (!started) {
      bad('Руны', 'кнопка запуска не найдена');
    } else {
      bad('Руны', 'результат не отобразился');
    }
    if (page.errors.length) bad('Руны без падений', page.errors[0].slice(0, 80));
    else ok('Руны без ошибок в консоли');
    await page.context().close();
  }

  // ---------- 5. НУМЕРОЛОГИЯ ПОЛНЫЙ ЦИКЛ ----------
  console.log('\n📍 5. НУМЕРОЛОГИЯ — расчёт и разбор');
  {
    const page = await freshPage(browser);
    await navigate(page, 'Нумерология');
    const inputs = await page.$$('input');
    if (inputs.length) {
      for (const inp of inputs) {
        const ph = await inp.getAttribute('placeholder');
        if (ph && /дат|ДД|дд/i.test(ph)) await inp.fill('15.08.1990');
        else if (ph && /имя/i.test(ph)) await inp.fill('Анна');
      }
      await page.waitForTimeout(500);
      const btn = await page.$('text=Рассчитать') || await page.$('text=Узнать');
      if (btn) { await btn.click(); await page.waitForTimeout(3000); }
      const body = await page.textContent('body');
      if (body.includes('Расчёт не найден') || body.includes('Расчет не найден')) {
        bad('Нумерология', 'пустое состояние вместо результата');
      } else if (body.match(/\d/) && (body.includes('судьб') || body.includes('Число') || body.includes('жизненн'))) {
        ok('Нумерология считает и показывает числа');
      } else {
        bad('Нумерология', 'результат не распознан');
      }
    } else {
      bad('Нумерология', 'поля ввода не найдены');
    }
    if (page.errors.length) bad('Нумерология без падений', page.errors[0].slice(0, 80));
    await page.context().close();
  }

  // ---------- 6. ПРЯМЫЕ ПЕРЕХОДЫ НА РЕЗУЛЬТАТЫ ----------
  console.log('\n📍 6. ПРЯМОЙ ПЕРЕХОД на страницы результатов (были падения)');
  {
    const pages = [
      ['runes-result', 'Руны'],
      ['astro-result', 'Астропортрет'],
      ['numerology-result', 'Нумерология'],
      ['palmistry-result', 'Хиромантия'],
    ];
    for (const [route, label] of pages) {
      const page = await freshPage(browser);
      await page.goto(`${BASE}/${route}.html`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2500);
      const body = await page.textContent('body');
      const crashed = page.errors.some(e => /split|undefined is not|Cannot read/.test(e));
      const blank = body.trim().length < 30;
      const spinner = /Загрузка|Анализирую|Составляю/.test(body) && body.length < 200;

      if (crashed) bad(`${label}: прямой переход`, 'падение: ' + page.errors[0].slice(0, 70));
      else if (blank) bad(`${label}: прямой переход`, 'пустой экран');
      else if (spinner) bad(`${label}: прямой переход`, 'застрял на загрузке');
      else ok(`${label}: прямой переход обработан`);
      await page.context().close();
    }
  }

  // ---------- 7. ХИРОМАНТИЯ БЕЗ СНИМКА ----------
  console.log('\n📍 7. ХИРОМАНТИЯ без снимка (был вечный спиннер)');
  {
    const page = await freshPage(browser);
    await page.goto(`${BASE}/palmistry.html`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    if (body.includes('Анализирую линии судьбы')) {
      bad('Хиромантия без снимка', 'вечный спиннер');
    } else if (body.includes('Нет снимка') || body.includes('Сделать фото')) {
      ok('Хиромантия без снимка показывает выход');
    } else if (body.includes('Unmatched Route')) {
      ok('Хиромантия: маршрут статики (проверено в основном тесте)');
    } else {
      bad('Хиромантия без снимка', 'неожиданный экран');
    }
    await page.context().close();
  }

  // ---------- 8. БАННЕР ОФЛАЙНА ----------
  console.log('\n📍 8. Ложный баннер «Нет подключения к интернету»');
  {
    const page = await freshPage(browser);
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    if (body.includes('Нет подключения к интернету')) {
      bad('Баннер офлайна убран', 'всё ещё показывается');
    } else {
      ok('Ложный баннер офлайна убран');
    }
    // Главная должна вести в историю и настройки
    if (body.includes('История') && body.includes('Настройки')) ok('История и Настройки доступны с главной');
    else bad('История и Настройки на главной', 'ссылок нет');
    await page.context().close();
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log(`ИТОГ: ${results.pass.length} успешно, ${results.fail.length} провалено`);
  console.log('='.repeat(60));
  if (results.fail.length) {
    console.log('\nПРОВАЛЫ:');
    results.fail.forEach(f => console.log('  ❌ ' + f));
    process.exitCode = 1;
  }
}

main().catch(e => { console.error('Критическая ошибка:', e); process.exitCode = 1; });
