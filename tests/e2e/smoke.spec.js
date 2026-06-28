import { test, expect } from "@playwright/test";

test("la página principal de paquetes carga correctamente", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Paquetes Turísticos", exact: true })
  ).toBeVisible();

  await expect(page.getByText(/paquete\(s\) encontrado\(s\)/i)).toBeVisible();
});
