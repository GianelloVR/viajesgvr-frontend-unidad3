import { test, expect, type Page } from "@playwright/test";

const getFutureDate = (daysFromNow = 20): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
};

const clickAndAcceptDialog = async (
  page: Page,
  clickAction: () => Promise<void>
): Promise<string> => {
  let dialogMessage = "";

  page.once("dialog", async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.accept();
  });

  await clickAction();

  await expect
    .poll(() => dialogMessage, { timeout: 10000 })
    .not.toBe("");

  return dialogMessage;
};

const openFirstPackageDetail = async (page: Page): Promise<void> => {
  // Given: el usuario se encuentra en la página principal de paquetes turísticos
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Paquetes Turísticos", exact: true })
  ).toBeVisible();

  // When: el usuario selecciona ver el detalle del primer paquete disponible
  await page.getByRole("link", { name: /ver detalle/i }).first().click();

  // Then: el sistema muestra el detalle del paquete y la opción de reservar
  await expect(page.getByRole("button", { name: /^Reservar$/i })).toBeVisible();
};

const openReservationForm = async (page: Page): Promise<void> => {
  await openFirstPackageDetail(page);

  // When: el usuario presiona el botón Reservar
  await page.getByRole("button", { name: /^Reservar$/i }).click();

  // Then: se muestra el formulario de datos de la reserva
  await expect(
    page.getByRole("heading", { name: /Datos de la reserva/i })
  ).toBeVisible();
};

const fillReservationForm = async (
  page: Page,
  passengerCount = 2
): Promise<void> => {
  // Given: el formulario de reserva está disponible
  // When: el usuario ingresa una fecha válida, cantidad de pasajeros y solicitudes especiales
  await page.locator('input[type="date"]').first().fill(getFutureDate(20));
  await page.getByLabel(/Cantidad de pasajeros/i).fill(String(passengerCount));
  await page
    .getByLabel(/Solicitudes especiales/i)
    .fill("Prueba automatizada Playwright");
};

const confirmReservationAndGoToPayment = async (
  page: Page,
  passengerCount = 2
): Promise<void> => {
  await openReservationForm(page);
  await fillReservationForm(page, passengerCount);

  // When: el usuario confirma la reserva
  const message = await clickAndAcceptDialog(page, async () => {
    await page.getByRole("button", { name: /Confirmar reserva/i }).click();
  });

  // Then: el sistema confirma la creación de la reserva
  expect(message).toContain("Reserva creada correctamente");

  // And: el sistema redirige al formulario de pago
  await expect(
    page.getByRole("heading", { name: /Datos del pago/i })
  ).toBeVisible();
};

test.describe("Épica 4 - Proceso de reserva en línea", () => {
  test("permite crear una reserva válida con cupos disponibles", async ({ page }) => {
    // Given: el cliente está autenticado y existe un paquete con cupos disponibles
    // When: completa el formulario de reserva con datos válidos y confirma
    await confirmReservationAndGoToPayment(page, 2);

    // Then: se muestra el resumen final de la reserva y el total a pagar
    await expect(page.getByText(/Resumen final de la reserva/i)).toBeVisible();
    await expect(page.getByText(/Total a pagar/i)).toBeVisible();
  });

  test("no permite confirmar una reserva sin fecha de inicio del tour", async ({ page }) => {
    // Given: el cliente está autenticado y se encuentra en el formulario de reserva
    await openReservationForm(page);

    // When: ingresa cantidad de pasajeros, pero no selecciona fecha de inicio
    await page.getByLabel(/Cantidad de pasajeros/i).fill("2");

    const message = await clickAndAcceptDialog(page, async () => {
      await page.getByRole("button", { name: /Confirmar reserva/i }).click();
    });

    // Then: el sistema impide crear la reserva e informa que la fecha es obligatoria
    expect(message).toContain("Debes seleccionar la fecha de inicio del tour");
  });

  test("muestra el resumen estimado y los descuentos antes de confirmar", async ({ page }) => {
    // Given: el cliente está autenticado y se encuentra en el formulario de reserva
    await openReservationForm(page);

    // When: ingresa datos válidos para la reserva
    await fillReservationForm(page, 4);

    // Then: el sistema muestra el resumen estimado, descuentos y total antes de confirmar
    await expect(page.getByText(/Resumen estimado de la reserva/i)).toBeVisible();
    await expect(page.getByText(/Descuentos aplicados/i)).toBeVisible();
    await expect(page.getByText(/Total a pagar/i)).toBeVisible();
  });
});
