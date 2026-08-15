const { chromium } = require('playwright');

async function testDetailed() {
  console.log('🚀 Детальное тестирование гадания...\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();

  // Collect ALL console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    // Print errors immediately
    if (msg.type() === 'error') {
      console.log('   🔴 Console Error:', text.substring(0, 200));
    }
  });
  page.on('pageerror', err => {
    console.log('   🔴 Page Error:', err.message.substring(0, 200));
    consoleMessages.push(`[pageerror] ${err.message}`);
  });

  try {
    const baseUrl = 'http://localhost:8081';

    // Step 1: Main page
    console.log('📍 Шаг 1: Главная страница...');
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('   ✓ Загружена');

    // Step 2: Select category
    console.log('\n📍 Шаг 2: Выбор категории "Любовь"...');
    await page.click('text=Любовь');
    await page.waitForTimeout(500);
    console.log('   ✓ Категория выбрана');

    // Step 3: Select spread
    console.log('\n📍 Шаг 3: Выбор расклада "Одна карта"...');
    await page.click('text=Одна карта');
    await page.waitForTimeout(500);
    console.log('   ✓ Расклад выбран');

    // Step 4: Click start
    console.log('\n📍 Шаг 4: Клик "Начать гадание"...');
    await page.click('text=Начать гадание');
    await page.waitForTimeout(1500);
    console.log('   URL:', page.url());

    // Step 5: Enter question
    console.log('\n📍 Шаг 5: Ввод вопроса...');
    const textarea = await page.$('textarea');
    const input = await page.$('input[type="text"]');
    const field = textarea || input;

    if (field) {
      await field.fill('Что меня ждет в любви?');
      console.log('   ✓ Вопрос введен');
    } else {
      console.log('   ❌ Поле ввода НЕ найдено!');
      const pageHTML = await page.content();
      console.log('   HTML содержит textarea:', pageHTML.includes('textarea'));
      console.log('   HTML содержит TextInput:', pageHTML.includes('TextInput'));
    }

    // Step 6: Click start reading
    console.log('\n📍 Шаг 6: Запуск гадания...');
    const startButtons = await page.$$('text=Начать гадание');
    console.log('   Найдено кнопок:', startButtons.length);

    if (startButtons.length > 0) {
      await startButtons[startButtons.length - 1].click();
      console.log('   ✓ Кнопка нажата');
    }

    // Step 7: Wait and check result
    console.log('\n📍 Шаг 7: Ожидание результата (10 сек)...');
    await page.waitForTimeout(10000);

    const finalUrl = page.url();
    const finalContent = await page.textContent('body');

    console.log('\n' + '='.repeat(50));
    console.log('📊 РЕЗУЛЬТАТ');
    console.log('='.repeat(50));
    console.log('URL:', finalUrl);
    console.log('');

    // Check what's on the page
    const checks = [
      ['Ваше гадание', finalContent.includes('Ваше гадание')],
      ['Выпавшие карты', finalContent.includes('Выпавшие карты')],
      ['Толкование', finalContent.includes('Толкование')],
      ['Нажмите для открытия', finalContent.includes('Нажмите для открытия')],
      ['перемешива (загрузка)', finalContent.includes('перемешива')],
      ['Ошибка', finalContent.includes('Ошибка')],
      ['Error', finalContent.includes('Error')],
    ];

    console.log('Содержимое страницы:');
    checks.forEach(([name, found]) => {
      console.log(`   ${found ? '✓' : '✗'} ${name}`);
    });

    // If still loading after 10 seconds - problem
    if (finalContent.includes('перемешива') || finalContent.includes('Загрузка')) {
      console.log('\n⚠️ ПРОБЛЕМА: Страница застряла на загрузке!');
    }

    // If we're still on question page - problem
    if (finalUrl.includes('question')) {
      console.log('\n⚠️ ПРОБЛЕМА: Не перешли на страницу гадания!');
    }

    // If we're on reading page but no cards - problem
    if (finalUrl.includes('reading') && !finalContent.includes('карт')) {
      console.log('\n⚠️ ПРОБЛЕМА: Страница гадания без карт!');
    }

    // Success case
    if (finalContent.includes('Выпавшие карты') || finalContent.includes('Нажмите для открытия')) {
      console.log('\n✅ ГАДАНИЕ РАБОТАЕТ!');
    }

    // Print errors summary
    const errors = consoleMessages.filter(m =>
      m.includes('[error]') || m.includes('[pageerror]')
    );

    if (errors.length > 0) {
      console.log('\n❌ ОШИБКИ В КОНСОЛИ:');
      errors.slice(0, 10).forEach(e => console.log('   ' + e.substring(0, 300)));
    }

    // Save screenshot
    await page.screenshot({ path: '/tmp/final-result.png', fullPage: true });
    console.log('\n📸 Скриншот сохранен: /tmp/final-result.png');

  } catch (e) {
    console.log('\n❌ Критическая ошибка:', e.message);
  }

  await browser.close();
}

testDetailed().catch(console.error);
