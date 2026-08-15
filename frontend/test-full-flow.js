const { chromium } = require('playwright');

async function testFullFlow() {
  console.log('🚀 Полный тест гадания с открытием карт...\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();

  // Collect console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('   🔴 ERROR:', msg.text().substring(0, 150));
    }
  });
  page.on('pageerror', err => {
    console.log('   🔴 PAGE ERROR:', err.message.substring(0, 150));
  });

  try {
    const baseUrl = 'http://localhost:8081';

    // Step 1-6: Navigate to reading
    console.log('📍 Навигация к гаданию...');
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.click('text=Любовь');
    await page.waitForTimeout(300);

    await page.click('text=Одна карта');
    await page.waitForTimeout(300);

    await page.click('text=Начать гадание');
    await page.waitForTimeout(1000);

    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.fill('Тест любви');
    }

    const buttons = await page.$$('text=Начать гадание');
    if (buttons.length > 0) {
      await buttons[buttons.length - 1].click();
    }

    // Wait for reading page
    console.log('📍 Ожидание загрузки гадания...');
    await page.waitForTimeout(5000);

    const url = page.url();
    console.log('   URL:', url);

    // Screenshot before clicking
    await page.screenshot({ path: '/tmp/before-click.png', fullPage: true });

    // Check page content
    const content = await page.textContent('body');
    console.log('\n📍 Проверка содержимого:');
    console.log('   Карты перемешиваются:', content.includes('перемешива'));
    console.log('   Ваше гадание:', content.includes('Ваше гадание'));
    console.log('   Выпавшие карты:', content.includes('Выпавшие карты'));
    console.log('   Нажмите для открытия:', content.includes('Нажмите для открытия'));

    if (content.includes('перемешива')) {
      console.log('\n⚠️ Всё ещё загружается! Ждём ещё 5 сек...');
      await page.waitForTimeout(5000);
    }

    // Try to click on card to reveal
    console.log('\n📍 Попытка открыть карту...');
    try {
      // Try clicking "Открыть все"
      const revealAll = await page.$('text=Открыть все');
      if (revealAll) {
        await revealAll.click();
        console.log('   ✓ Нажали "Открыть все"');
        await page.waitForTimeout(2000);
      } else {
        // Try clicking on card directly
        const tapHint = await page.$('text=Нажмите для открытия');
        if (tapHint) {
          await tapHint.click();
          console.log('   ✓ Нажали на карту');
          await page.waitForTimeout(2000);
        }
      }
    } catch (e) {
      console.log('   Ошибка при открытии карты:', e.message);
    }

    // Final screenshot
    await page.screenshot({ path: '/tmp/after-click.png', fullPage: true });

    // Final check
    const finalContent = await page.textContent('body');
    console.log('\n📍 Финальная проверка:');
    console.log('   Толкование:', finalContent.includes('Толкование'));
    console.log('   На главную:', finalContent.includes('На главную'));

    // Check for any card names (from the tarot deck)
    const cardNames = ['Дурак', 'Маг', 'Жрица', 'Императрица', 'Император', 'Иерофант', 'Влюблённые'];
    const foundCards = cardNames.filter(name => finalContent.includes(name));
    console.log('   Найдено карт:', foundCards.length > 0 ? foundCards.join(', ') : 'нет');

    console.log('\n📸 Скриншоты:');
    console.log('   До клика: /tmp/before-click.png');
    console.log('   После клика: /tmp/after-click.png');

    if (finalContent.includes('Толкование') || foundCards.length > 0) {
      console.log('\n✅ ГАДАНИЕ ПОЛНОСТЬЮ РАБОТАЕТ!');
    } else if (finalContent.includes('Выпавшие карты')) {
      console.log('\n✅ Гадание работает (карты загружены, ждут открытия)');
    } else {
      console.log('\n❌ Что-то не так!');
    }

  } catch (e) {
    console.log('\n❌ Ошибка:', e.message);
  }

  await browser.close();
}

testFullFlow().catch(console.error);
