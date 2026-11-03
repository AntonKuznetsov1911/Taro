// Exercises the shared app against a local production web export.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const BASE = process.env.TARO_TEST_BASE_URL || 'http://127.0.0.1:8873';
const ARTIFACTS = process.env.TARO_TEST_ARTIFACTS || path.resolve(__dirname, '../../../taro-test-artifacts');

(async () => {
  await fs.mkdir(ARTIFACTS, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.TARO_BROWSER_PATH ? { executablePath: process.env.TARO_BROWSER_PATH } : {}) });
  let count = 0;
  async function check(name, callback, skipOnboarding = true) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', acceptDownloads: true });
    if (skipOnboarding) await context.addInitScript(() => localStorage.setItem('@taro_onboarding_seen', '1'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try { await callback(page); assert.deepEqual(errors, [], 'Unhandled JavaScript exceptions'); console.log(`PASS ${++count}: ${name}`); }
    catch (error) { await page.screenshot({ path: path.join(ARTIFACTS, 'failure.png'), fullPage: true }); console.error('FAIL:', name, error); throw error; }
    finally { await context.close(); }
  }
  const visit = async (page, route = '/') => { await page.goto(BASE + route); await page.waitForTimeout(350); };
  async function drawThree(page, question) {
    await visit(page);
    await page.getByRole('tab', { name: 'Расклады' }).click();
    await page.getByText('Любовь', { exact: true }).click();
    await page.getByText('Три карты', { exact: true }).click();
    await page.getByText('Начать гадание', { exact: true }).filter({ visible: true }).click();
    await page.locator('textarea').fill(question);
    await page.getByText('Начать гадание', { exact: true }).filter({ visible: true }).click();
    await page.getByRole('button', { name: 'Выбрать карту 1', exact: true }).waitFor();
  }
  async function openAll(page) {
    await page.getByRole('button', { name: 'Открыть все', exact: true }).click();
    await page.getByText('Короткий вывод', { exact: true }).waitFor();
  }
  try {
    await check('onboarding can be skipped and does not loop after restart', async page => {
      await visit(page); await page.getByText('Начать', { exact: true }).click();
      await page.getByText('Пропустить', { exact: true }).click();
      await page.getByText('Карта дня', { exact: true }).waitFor();
      await page.reload(); await page.getByText('Карта дня', { exact: true }).waitFor();
    }, false);
    await check('complete profile persists after restarting the app', async page => {
      await visit(page); await page.getByText('Начать', { exact: true }).click();
      const nameInput = page.getByPlaceholder('Введите ваше имя');
      await nameInput.fill('   ');
      await nameInput.press('Enter');
      await page.getByText('Как вас зовут?', { exact: true }).waitFor();
      await nameInput.fill('  Тестовый  ');
      await nameInput.press('Enter');
      await page.getByText('Мужской', { exact: true }).click();
      await page.getByText('Далее', { exact: true }).click();
      await page.getByPlaceholder('ДД', { exact: true }).fill('19');
      await page.getByPlaceholder('ММ', { exact: true }).fill('11');
      await page.getByPlaceholder('ГГГГ', { exact: true }).fill('1991');
      await page.getByText('Далее', { exact: true }).click();
      await page.getByText('Не знаю', { exact: true }).click();
      await page.getByText('Далее', { exact: true }).click();
      await page.getByText('Открыть приложение', { exact: true }).click();
      await page.getByText('Карта дня', { exact: true }).waitFor();
      await page.reload(); await page.getByText('Карта дня', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('@taro_user_profile')).name), 'Тестовый');
    }, false);
    await check('fan selection fills three different positions and saves one result', async page => {
      await drawThree(page, 'Как лучше провести эту неделю?');
      await page.screenshot({ path: path.join(ARTIFACTS, 'web-fan.png') });
      assert.equal(await page.getByText('✨ Толкование', { exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Выбрать карту 2', exact: true }).click();
      await page.getByRole('button', { name: /^Карта 1:/ }).waitFor();
      assert(await page.getByRole('button', { name: 'Выбрать карту 2', exact: true }).isDisabled());
      assert.equal(await page.getByText('✨ Толкование', { exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Выбрать карту 1', exact: true }).click();
      await page.getByRole('button', { name: /^Карта 2:/ }).waitFor();
      assert.equal(await page.getByText('✨ Толкование', { exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Выбрать карту 3', exact: true }).click();
      await page.getByText('Как связаны карты', { exact: true }).waitFor();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('@taro_readings') || '[]').length === 1);
      const rows = await page.evaluate(() => JSON.parse(localStorage.getItem('@taro_readings') || '[]'));
      assert.equal(rows.length, 1); assert.equal(rows[0].cards.length, 3);
      assert.equal(new Set(rows[0].cards.map(c => c.id)).size, 3);
      for (const [i, card] of rows[0].cards.entries()) await page.getByRole('button', { name: 'Карта ' + (i + 1) + ': ' + card.name, exact: true }).waitFor();
      assert(rows[0].cards.every(c => !('image' in c)), 'Asset handles should not enter backups');
      await page.screenshot({ path: path.join(ARTIFACTS, 'web-reading.png') });
      await page.getByText('История', { exact: true }).filter({ visible: true }).click();
      await page.getByTestId('reading-history').getByText('«Как лучше провести эту неделю?»', { exact: true }).waitFor();
    });
    await check('disabled autosave supports explicit saving without duplicates', async page => {
      await page.addInitScript(() => localStorage.setItem('@taro_settings', JSON.stringify({ language: 'russian', notifications: false, soundEnabled: false, autoSave: false, vibration: false, effectsVolume: .7 })));
      await drawThree(page, 'Проверка ручного сохранения');
      await page.getByRole('button', { name: 'Выбрать карту 3', exact: true }).click();
      const first = page.getByRole('button', { name: /^Карта 1:/ });
      await first.waitFor();
      const picked = await first.getAttribute('aria-label');
      await openAll(page);
      assert.equal(await first.getAttribute('aria-label'), picked);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('@taro_readings') || '[]').length), 0);
      await page.getByText('Сохранить расклад', { exact: true }).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('@taro_readings') || '[]').length === 1);
      assert.equal(await page.getByText('Сохранить расклад', { exact: true }).count(), 0);
    });
    await check('share image hides the question until the user enables it', async page => {
      const question = 'Личный вопрос для проверки';
      await drawThree(page, question);
      await openAll(page);
      await page.getByRole('button', { name: 'Поделиться карточкой', exact: true }).click();
      const preview = page.getByTestId('reading-share-preview');
      await preview.waitFor();
      assert(!(await preview.innerText()).includes(question));
      const toggle = page.getByRole('switch', { name: 'Показывать мой вопрос' });
      await toggle.click();
      await preview.getByText('«' + question + '»', { exact: true }).waitFor();
      await toggle.click();
      await preview.getByText('«' + question + '»', { exact: true }).waitFor({ state: 'detached' });
      const downloading = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Сохранить изображение', exact: true }).click();
      const file = path.join(ARTIFACTS, 'reading-share.png');
      await (await downloading).saveAs(file);
      const png = await fs.readFile(file);
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.equal(png.readUInt32BE(16), 1080);
      assert(png.length > 20000);
    });
    await check('daily card and note persist, and the calendar can open a previous month', async page => {
      await visit(page);
      await page.getByRole('button', { name: 'Открыть карту дня', exact: true }).click();
      const revealed = page.getByRole('button', { name: /^Карта дня:/ });
      await revealed.waitFor();
      const dailyName = await revealed.getAttribute('aria-label');
      await page.reload();
      await page.getByRole('button', { name: dailyName, exact: true }).waitFor();
      await page.getByRole('button', { name: 'Добавить заметку о дне', exact: true }).click();
      const note = page.getByLabel('Заметка о дне');
      await note.fill('Вечерняя запись');
      await page.getByRole('button', { name: 'Сохранить заметку', exact: true }).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('@taro_daily_journal') || '[]')[0]?.note === 'Вечерняя запись');
      await page.reload();
      await note.waitFor();
      assert.equal(await note.inputValue(), 'Вечерняя запись');
      await page.evaluate(() => {
        const date = new Date();
        const previous = new Date(date.getFullYear(), date.getMonth() - 1, 12);
        const key = [previous.getFullYear(), previous.getMonth() + 1, previous.getDate()].map(p => String(p).padStart(2, '0')).join('-');
        const entries = JSON.parse(localStorage.getItem('@taro_daily_journal'));
        localStorage.setItem('@taro_daily_journal', JSON.stringify([...entries, { date: key, cardId: 0, reversed: false, note: 'Запись прошлого месяца' }]));
      });
      await page.reload();
      await page.getByRole('button', { name: 'Предыдущий месяц', exact: true }).click();
      await note.waitFor();
      assert.equal(await note.inputValue(), 'Запись прошлого месяца');
      await page.screenshot({ path: path.join(ARTIFACTS, 'web-journal.png') });
    });
    await check('all cards have local illustrations and the catalog search works', async page => {
      await visit(page, '/deck');
      await page.getByPlaceholder(/Поиск/).fill('Луна');
      await page.getByText('Луна', { exact: true }).click();
      await page.getByText('Луна', { exact: true }).filter({ visible: true }).first().waitFor();
      await page.waitForFunction(() => [...document.querySelectorAll('img')].some(i => i.complete && i.naturalWidth > 0));
    });
    await check('numerology accepts a date and produces a result', async page => {
      await visit(page, '/numerology');
      await page.getByPlaceholder('Например: Иванова Мария Сергеевна').fill('Иванов Иван Иванович');
      await page.getByPlaceholder('ДД', { exact: true }).fill('19');
      await page.getByPlaceholder('ММ', { exact: true }).fill('11');
      await page.getByPlaceholder('ГГГГ', { exact: true }).fill('1991');
      await page.getByText('Рассчитать числа', { exact: true }).click();
      await page.getByText('Число Жизненного Пути', { exact: true }).waitFor();
    });
    await check('runes generate an interpretation', async page => {
      await visit(page, '/runes');
      await page.getByPlaceholder('Что вас волнует?..').fill('На чём сосредоточиться?');
      await page.getByText('Вытянуть руны', { exact: true }).click();
      await page.getByText('Толкование рун', { exact: true }).waitFor();
      assert(!(await page.locator('body').innerText()).includes('Расклад не найден'));
    });
    await check('compatibility uses the names entered by the user', async page => {
      await visit(page, '/compatibility');
      await page.getByPlaceholder('Например: Анна').fill('Анна');
      await page.getByPlaceholder('Например: Михаил').fill('Михаил');
      await page.getByText('Узнать совместимость', { exact: true }).click();
      await page.getByText('Анализ совместимости', { exact: true }).waitFor();
      await page.getByText('Анна', { exact: true }).first().waitFor();
    });
    await check('volume control persists the selected level', async page => {
      await visit(page, '/settings');
      const slider = page.getByTestId('effects-volume'); await slider.scrollIntoViewIfNeeded();
      const box = await slider.boundingBox(); await page.mouse.click(box.x + box.width * .25, box.y + box.height / 2);
      await page.waitForTimeout(250); await page.reload();
      await page.getByTestId('effects-volume').waitFor();
      const settings = await page.evaluate(() => JSON.parse(localStorage.getItem('@taro_settings')));
      assert(settings.effectsVolume >= .2 && settings.effectsVolume <= .3);
    });
    await check('backup export and restore update both storage and the live app', async page => {
      await drawThree(page, 'Запись для резервной копии');
      await openAll(page);
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('@taro_readings') || '[]').length === 1);
      await visit(page);
      await page.getByRole('button', { name: 'Открыть карту дня', exact: true }).click();
      await page.getByRole('button', { name: /^Карта дня:/ }).waitFor();
      await visit(page, '/settings');
      const downloading = page.waitForEvent('download');
      await page.getByText('Сохранить резервную копию', { exact: true }).click();
      const download = await downloading;
      const file = path.join(ARTIFACTS, 'backup.json'); await download.saveAs(file);
      const backup = JSON.parse(await fs.readFile(file, 'utf8'));
      assert.equal(backup.format, 'taro-backup');
      assert.equal(JSON.parse(backup.data['@taro_readings']).length, 1);
      assert.equal(JSON.parse(backup.data['@taro_daily_journal']).length, 1);
      await page.evaluate(() => { localStorage.setItem('@taro_readings', '[]'); localStorage.removeItem('@taro_daily_journal'); });
      page.on('dialog', dialog => dialog.accept());
      const choosing = page.waitForEvent('filechooser');
      await page.getByText('Восстановить из файла', { exact: true }).click();
      await (await choosing).setFiles(file);
      await page.getByRole('button', { name: /^Карта дня:/ }).waitFor();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('@taro_readings')).length), 1);
      await page.getByRole('tab', { name: 'Дневник' }).click();
      await page.getByRole('button', { name: 'История раскладов', exact: true }).click();
      await page.getByTestId('reading-history').getByText('«Запись для резервной копии»', { exact: true }).waitFor();
    });
    console.log(`${count} production UI checks passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
