const { chromium } = require('playwright');

async function testApp() {
  console.log('🚀 Запуск полного тестирования приложения...\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => errors.push(err.message));

  const results = {
    passed: [],
    failed: []
  };

  try {
    // Test 1: Main page loads
    console.log('📍 Тест 1: Загрузка главной страницы...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const title = await page.textContent('body');
    if (title && title.includes('ТARO')) {
      console.log('   ✅ Главная страница загружена\n');
      results.passed.push('Главная страница');
    } else {
      console.log('   ❌ Главная страница не загружена\n');
      results.failed.push('Главная страница');
    }

    // Test 2: Tarot Reading Flow
    console.log('📍 Тест 2: Гадание на Таро (Любовь → Одна карта)...');
    try {
      // Click on "Любовь" category
      await page.click('text=Любовь', { timeout: 5000 });
      await page.waitForTimeout(500);
      console.log('   ✓ Выбрана категория "Любовь"');

      // Click on "Одна карта" spread
      await page.click('text=Одна карта', { timeout: 5000 });
      await page.waitForTimeout(500);
      console.log('   ✓ Выбран расклад "Одна карта"');

      // Click "Начать гадание"
      await page.click('text=Начать гадание', { timeout: 5000 });
      await page.waitForTimeout(1000);
      console.log('   ✓ Нажата кнопка "Начать гадание"');

      // Check if question page loaded
      const questionPage = await page.textContent('body');
      if (questionPage.includes('Задайте вопрос') || questionPage.includes('Ваш вопрос')) {
        console.log('   ✓ Страница вопроса загружена');

        // Enter question
        const input = await page.$('input, textarea');
        if (input) {
          await input.fill('Что меня ждет в любви?');
          console.log('   ✓ Вопрос введен');
        }

        // Click start reading button
        const buttons = await page.$$('text=Начать гадание');
        if (buttons.length > 0) {
          await buttons[buttons.length - 1].click();
          console.log('   ✓ Нажата кнопка начала гадания');
        }

        // Wait for reading to load
        await page.waitForTimeout(3000);

        const readingPage = await page.textContent('body');
        if (readingPage.includes('Ваше гадание') || readingPage.includes('Выпавшие карты') || readingPage.includes('Толкование')) {
          console.log('   ✅ Гадание на Таро РАБОТАЕТ!\n');
          results.passed.push('Гадание на Таро');
        } else {
          console.log('   ❌ Страница гадания не загружена\n');
          results.failed.push('Гадание на Таро');
        }
      } else {
        console.log('   ❌ Страница вопроса не загружена\n');
        results.failed.push('Гадание на Таро - страница вопроса');
      }
    } catch (e) {
      console.log('   ❌ Ошибка:', e.message, '\n');
      results.failed.push('Гадание на Таро: ' + e.message);
    }

    // Go back to main
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Test 3: Compatibility
    console.log('📍 Тест 3: Совместимость имён...');
    try {
      await page.click('text=Гармония имен', { timeout: 5000 });
      await page.waitForTimeout(2000);

      const compatPage = await page.textContent('body');
      if (compatPage.includes('Совместимость') || compatPage.includes('имен') || compatPage.includes('имён')) {
        console.log('   ✓ Страница совместимости загружена');

        // Try to find input fields
        const inputs = await page.$$('input');
        if (inputs.length >= 2) {
          await inputs[0].fill('Александр');
          await inputs[1].fill('Мария');
          console.log('   ✓ Имена введены');

          // Click calculate button
          const calcBtn = await page.$('text=Рассчитать');
          if (calcBtn) {
            await calcBtn.click();
            await page.waitForTimeout(2000);

            const resultPage = await page.textContent('body');
            if (resultPage.includes('%') || resultPage.includes('совместимость') || resultPage.includes('гармония')) {
              console.log('   ✅ Совместимость РАБОТАЕТ!\n');
              results.passed.push('Совместимость');
            } else {
              console.log('   ❌ Результат не отображен\n');
              results.failed.push('Совместимость - результат');
            }
          }
        } else {
          console.log('   ❌ Поля ввода не найдены\n');
          results.failed.push('Совместимость - поля ввода');
        }
      } else {
        console.log('   ❌ Страница не загружена\n');
        results.failed.push('Совместимость');
      }
    } catch (e) {
      console.log('   ❌ Ошибка:', e.message, '\n');
      results.failed.push('Совместимость: ' + e.message);
    }

    // Go back to main
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Test 4: Horoscope
    console.log('📍 Тест 4: Гороскоп...');
    try {
      await page.click('text=Гороскоп', { timeout: 5000 });
      await page.waitForTimeout(2000);

      const horoscopePage = await page.textContent('body');
      if (horoscopePage.includes('Гороскоп') || horoscopePage.includes('знак') || horoscopePage.includes('зодиак')) {
        console.log('   ✓ Страница гороскопа загружена');

        // Try to select a zodiac sign
        const signs = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева'];
        let clicked = false;
        for (const sign of signs) {
          try {
            await page.click(`text=${sign}`, { timeout: 1000 });
            clicked = true;
            console.log(`   ✓ Выбран знак "${sign}"`);
            break;
          } catch {}
        }

        if (clicked) {
          await page.waitForTimeout(2000);
          const resultPage = await page.textContent('body');
          if (resultPage.includes('прогноз') || resultPage.includes('день') || resultPage.includes('Луна') || resultPage.includes('энергия')) {
            console.log('   ✅ Гороскоп РАБОТАЕТ!\n');
            results.passed.push('Гороскоп');
          } else {
            console.log('   ⚠️ Гороскоп загружен, но результат не ясен\n');
            results.passed.push('Гороскоп (частично)');
          }
        } else {
          console.log('   ❌ Не удалось выбрать знак\n');
          results.failed.push('Гороскоп - выбор знака');
        }
      } else {
        console.log('   ❌ Страница не загружена\n');
        results.failed.push('Гороскоп');
      }
    } catch (e) {
      console.log('   ❌ Ошибка:', e.message, '\n');
      results.failed.push('Гороскоп: ' + e.message);
    }

    // Go back to main
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Test 5: Deck catalog
    console.log('📍 Тест 5: Каталог колоды...');
    try {
      await page.click('text=Каталог колоды', { timeout: 5000 });
      await page.waitForTimeout(2000);

      const deckPage = await page.textContent('body');
      if (deckPage.includes('Каталог') || deckPage.includes('Дурак') || deckPage.includes('Маг') || deckPage.includes('колод')) {
        console.log('   ✓ Страница каталога загружена');

        // Check if cards are displayed
        if (deckPage.includes('Дурак') || deckPage.includes('Маг') || deckPage.includes('Жрица')) {
          console.log('   ✅ Каталог колоды РАБОТАЕТ!\n');
          results.passed.push('Каталог колоды');
        } else {
          console.log('   ⚠️ Страница загружена, но карты не видны\n');
          results.failed.push('Каталог колоды - карты');
        }
      } else {
        console.log('   ❌ Страница не загружена\n');
        results.failed.push('Каталог колоды');
      }
    } catch (e) {
      console.log('   ❌ Ошибка:', e.message, '\n');
      results.failed.push('Каталог колоды: ' + e.message);
    }

    // Go back to main
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Test 6: Palmistry (Хиромантия)
    console.log('📍 Тест 6: Хиромантия...');
    try {
      await page.click('text=Хиромантия', { timeout: 5000 });
      await page.waitForTimeout(2000);

      const palmPage = await page.textContent('body');
      if (palmPage.includes('Хиромантия') || palmPage.includes('камер') || palmPage.includes('ладон') || palmPage.includes('рук')) {
        console.log('   ✅ Хиромантия РАБОТАЕТ (страница загружена)!\n');
        results.passed.push('Хиромантия');
      } else {
        console.log('   ❌ Страница не загружена\n');
        results.failed.push('Хиромантия');
      }
    } catch (e) {
      console.log('   ❌ Ошибка:', e.message, '\n');
      results.failed.push('Хиромантия: ' + e.message);
    }

  } catch (e) {
    console.log('❌ Критическая ошибка:', e.message);
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 ИТОГИ ТЕСТИРОВАНИЯ');
  console.log('='.repeat(50));
  console.log(`✅ Пройдено: ${results.passed.length}`);
  results.passed.forEach(t => console.log(`   • ${t}`));
  console.log(`❌ Провалено: ${results.failed.length}`);
  results.failed.forEach(t => console.log(`   • ${t}`));

  if (errors.length > 0) {
    console.log('\n⚠️ Ошибки в консоли браузера:');
    errors.slice(0, 10).forEach(e => console.log(`   • ${e}`));
  }

  await browser.close();

  return results;
}

testApp().catch(console.error);
