const { chromium } = require('playwright');

async function testProduction() {
  console.log('🚀 Тестирование на GitHub Pages...\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // iPhone 12 Pro size
  });
  const page = await context.newPage();

  // Collect ALL console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => consoleMessages.push(`[ERROR] ${err.message}`));

  try {
    // Test on GitHub Pages
    const baseUrl = 'https://antonkuznetsov1911.github.io/Taro';

    console.log('📍 Шаг 1: Открываю главную страницу...');
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/step1-main.png', fullPage: true });
    console.log('   ✓ Главная страница загружена (скриншот: /tmp/step1-main.png)');

    const bodyText = await page.textContent('body');
    console.log('   Содержит ТARO:', bodyText.includes('ТARO') || bodyText.includes('Taro'));

    console.log('\n📍 Шаг 2: Клик на "Любовь"...');
    try {
      await page.click('text=Любовь', { timeout: 10000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/step2-love.png', fullPage: true });
      console.log('   ✓ Выбрана категория');
    } catch (e) {
      console.log('   ❌ Не удалось кликнуть:', e.message);
      // Try alternative selectors
      const loveButtons = await page.$$('div:has-text("Любовь")');
      console.log('   Найдено элементов с "Любовь":', loveButtons.length);
    }

    console.log('\n📍 Шаг 3: Клик на "Одна карта"...');
    try {
      await page.click('text=Одна карта', { timeout: 10000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/step3-spread.png', fullPage: true });
      console.log('   ✓ Выбран расклад');
    } catch (e) {
      console.log('   ❌ Не удалось кликнуть:', e.message);
    }

    console.log('\n📍 Шаг 4: Клик на "Начать гадание"...');
    try {
      await page.click('text=Начать гадание', { timeout: 10000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/step4-question.png', fullPage: true });
      console.log('   ✓ Переход на страницу вопроса');

      const currentUrl = page.url();
      console.log('   URL:', currentUrl);
    } catch (e) {
      console.log('   ❌ Не удалось кликнуть:', e.message);
    }

    // Check current page
    const pageContent = await page.textContent('body');
    console.log('\n📍 Шаг 5: Проверка страницы вопроса...');
    console.log('   Содержит "вопрос":', pageContent.toLowerCase().includes('вопрос'));

    if (pageContent.toLowerCase().includes('вопрос')) {
      console.log('\n📍 Шаг 6: Ввод вопроса...');
      try {
        // Find input or textarea
        const input = await page.$('textarea, input[type="text"]');
        if (input) {
          await input.fill('Что ждет меня в любви?');
          await page.waitForTimeout(500);
          await page.screenshot({ path: '/tmp/step6-question-filled.png', fullPage: true });
          console.log('   ✓ Вопрос введен');
        } else {
          console.log('   ❌ Поле ввода не найдено');
        }
      } catch (e) {
        console.log('   ❌ Ошибка ввода:', e.message);
      }

      console.log('\n📍 Шаг 7: Клик на "Начать гадание" (второй раз)...');
      try {
        const buttons = await page.$$('text=Начать гадание');
        console.log('   Найдено кнопок "Начать гадание":', buttons.length);

        if (buttons.length > 0) {
          await buttons[buttons.length - 1].click();
          console.log('   ✓ Кнопка нажата, ждем загрузку...');

          // Wait for reading page
          await page.waitForTimeout(5000);
          await page.screenshot({ path: '/tmp/step7-reading.png', fullPage: true });

          const readingContent = await page.textContent('body');
          console.log('\n📍 Шаг 8: Проверка страницы гадания...');
          console.log('   URL:', page.url());
          console.log('   Содержит "Ваше гадание":', readingContent.includes('Ваше гадание'));
          console.log('   Содержит "Выпавшие карты":', readingContent.includes('Выпавшие карты'));
          console.log('   Содержит "карта":', readingContent.toLowerCase().includes('карта'));
          console.log('   Содержит "Толкование":', readingContent.includes('Толкование'));
          console.log('   Содержит "Загрузка" или "перемешива":',
            readingContent.includes('Загрузка') || readingContent.includes('перемешива'));

          // Check for errors in page
          if (readingContent.includes('Ошибка') || readingContent.includes('Error')) {
            console.log('\n   ⚠️ Обнаружена ошибка на странице!');
          }
        }
      } catch (e) {
        console.log('   ❌ Ошибка:', e.message);
      }
    }

    // Print console errors
    console.log('\n' + '='.repeat(50));
    console.log('📊 СООБЩЕНИЯ КОНСОЛИ БРАУЗЕРА:');
    console.log('='.repeat(50));

    const errors = consoleMessages.filter(m => m.includes('[error]') || m.includes('[ERROR]'));
    const warnings = consoleMessages.filter(m => m.includes('[warning]'));

    if (errors.length > 0) {
      console.log('\n❌ ОШИБКИ:');
      errors.forEach(e => console.log('   ' + e));
    } else {
      console.log('\n✅ Ошибок в консоли нет');
    }

    if (warnings.length > 0) {
      console.log('\n⚠️ ПРЕДУПРЕЖДЕНИЯ:');
      warnings.slice(0, 5).forEach(w => console.log('   ' + w));
    }

  } catch (e) {
    console.log('❌ Критическая ошибка:', e.message);
    await page.screenshot({ path: '/tmp/error.png', fullPage: true });
  }

  await browser.close();
}

testProduction().catch(console.error);
