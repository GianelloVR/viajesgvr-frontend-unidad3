import { test, expect } from "@playwright/test";

test("la página principal de paquetes carga correctamente", async ({ page }) => {
  // Given: el usuario accede a la aplicación ViajesGVR
  await page.goto("/");

  // When: la página principal termina de cargar
  // Then: se muestra el título principal de paquetes turísticos
  await expect(
    page.getByRole("heading", { name: "Paquetes Turísticos", exact: true })
  ).toBeVisible();

  // And: se muestra el contador/listado de paquetes encontrados
  await expect(page.getByText(/paquete\(s\) encontrado\(s\)/i)).toBeVisible();
});
