import { test, expect } from '@playwright/test';

const EMAIL = 'admin@reserveaqui.com';
const SENHA = 'admin123';

test('usuário consegue fazer login', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('Digite seu email').fill(EMAIL);
  await page.getByPlaceholder('Digite sua senha').fill(SENHA);
  await page.getByRole('main').getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Login realizado com sucesso')).toBeVisible({ timeout: 15000 });

  // Aceita qualquer redirecionamento válido pós-login
  await expect(page).toHaveURL(
    /\/(admin\/dashboard|owner\/dashboard|)$/,
    { timeout: 15000 }
  );
});