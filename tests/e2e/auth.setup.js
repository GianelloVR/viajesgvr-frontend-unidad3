import { test as setup, expect } from "@playwright/test";

setup("autenticar cliente en Keycloak", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /iniciar sesión/i }).click();

  await page.locator('input[name="username"]').fill("clienteplaywright@viajesgvr.cl");
  await page.locator('input[name="password"]').fill("Test12345!");

  await page.locator("#kc-login").click();

  await expect(page.getByText(/Hola,/i)).toBeVisible({ timeout: 20000 });

  await page.context().storageState({ path: "tests/.auth/client.json" });
});
