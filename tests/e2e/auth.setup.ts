import { test as setup, expect } from "@playwright/test";

setup("autenticar cliente en Keycloak", async ({ page }) => {
  // Given: el usuario se encuentra en la página principal de ViajesGVR
  await page.goto("/");

  // When: el usuario abre el formulario de inicio de sesión
  await page.getByRole("button", { name: /iniciar sesión/i }).click();

  // And: ingresa credenciales válidas de cliente en Keycloak
  await page.locator('input[name="username"]').fill("clienteplaywright@viajesgvr.cl");
  await page.locator('input[name="password"]').fill("Test12345!");

  // And: confirma el inicio de sesión
  await page.locator("#kc-login").click();

  // Then: el sistema autentica correctamente al usuario
  await expect(page.getByText(/Hola,/i)).toBeVisible({ timeout: 20000 });

  // And: se guarda la sesión para reutilizarla en las pruebas funcionales
  await page.context().storageState({ path: "tests/.auth/client.json" });
});
