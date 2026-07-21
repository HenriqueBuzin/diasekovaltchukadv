import { expect, test } from '@playwright/test';

const openPage = (page, path = '/') => page.goto(path, { waitUntil: 'domcontentloaded' });

test('smoke: home page renders its critical content', async ({ page }) => {
  const response = await openPage(page);
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Dias Kovaltchuk Advogadas Associadas');
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Quando o problema é sério, sua defesa precisa ser séria desde o primeiro contato.'
    })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Quero atendimento agora' })).toBeVisible();
});

test('regression: WhatsApp links use the sanitized environment number', async ({ page }) => {
  await openPage(page);
  const links = page.locator('a.wa-track');
  await expect(links.first()).toHaveAttribute('href', 'https://wa.me/5548988026847');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    await expect(links.nth(index)).toHaveAttribute('href', 'https://wa.me/5548988026847');
  }
});

test('functional: navigation reaches the contact form', async ({ page }, testInfo) => {
  await openPage(page);
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
  }
  await page.getByRole('link', { name: 'Contato', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pronta para entender seu caso?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar para análise' })).toBeVisible();
});

test('functional: invalid form shows every inline validation message', async ({ page }) => {
  await openPage(page, '/#contact');
  await page.getByRole('button', { name: 'Enviar para análise' }).click();

  await expect(page.locator('#name-error')).toHaveText('Informe seu nome.');
  await expect(page.locator('#email-error')).toHaveText('Informe seu e-mail.');
  await expect(page.locator('#tel-error')).toHaveText('Informe seu telefone.');
  await expect(page.locator('#subject-error')).toHaveText('Informe o assunto.');
  await expect(page.locator('#message-error')).toHaveText('Escreva um resumo do caso.');
  await expect(page.locator('#name')).toBeFocused();
});

test('integration: form fields accept a valid contact without client errors', async ({ page }) => {
  await openPage(page, '/#contact');
  await page.locator('#name').fill('Pessoa da Silva');
  await page.locator('#email').fill('pessoa@example.com');
  await page.locator('#tel').fill('48999999999');
  await page.locator('#subject').fill('Orientação jurídica');
  await page.locator('#message').fill('Gostaria de entender os próximos passos do meu caso.');

  await page.locator('#message').blur();
  await expect(page.locator('.is-invalid')).toHaveCount(0);
  await expect(page.locator('#tel')).toHaveValue('(48) 99999-9999');
});

test('responsive regression: layout has no horizontal overflow', async ({ page }, testInfo) => {
  await openPage(page);

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);

  if (testInfo.project.name === 'mobile') {
    const toggle = page.getByRole('button', { name: 'Abrir menu' });
    await toggle.click();
    await expect(page.getByRole('link', { name: 'Contato', exact: true })).toBeVisible();
  }
});
