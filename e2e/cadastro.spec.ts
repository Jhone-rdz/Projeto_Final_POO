import { test, expect } from '@playwright/test';

test('usuário consegue se cadastrar', async ({ page }) => {
  const respostaAPI = page.waitForResponse(
    res => res.url().includes('/api/usuarios/cadastro/') && res.request().method() === 'POST',
    { timeout: 30000 }
  );

  await page.goto('/register');

  await page.getByPlaceholder('Digite seu nome').fill('Teste Silva');
  await page.getByPlaceholder('Digite seu email').fill(`teste_${Date.now()}@email.com`);
  await page.getByPlaceholder('Digite sua senha').nth(0).fill('Senha123A');
  await page.getByPlaceholder('Digite sua senha').nth(1).fill('Senha123A');
  await page.getByRole('main').getByRole('button', { name: 'Cadastre-se' }).click();

  const resposta = await respostaAPI;
  expect(resposta.status()).toBe(201);

  // Usa o span exato em vez do .or()
  await expect(page.getByText('Cadastro realizado com sucesso')).toBeVisible({ timeout: 15000 });
});