import { test, expect } from "@playwright/test";

const getFutureDate = (daysFromNow = 20) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
};

const clickAndAcceptDialog = async (page, clickAction) => {
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

const openFirstPackageDetail = async (page) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Paquetes Turísticos", exact: true })
  ).toBeVisible();

  await page.getByRole("link", { name: /ver detalle/i }).first().click();

  await expect(page.getByRole("button", { name: /^Reservar$/i })).toBeVisible();
};

const openReservationForm = async (page) => {
  await openFirstPackageDetail(page);

  await page.getByRole("button", { name: /^Reservar$/i }).click();

  await expect(
    page.getByRole("heading", { name: /Datos de la reserva/i })
  ).toBeVisible();
};

const fillReservationForm = async (page, passengerCount = 2) => {
  await page.locator('input[type="date"]').first().fill(getFutureDate(20));
  await page.getByLabel(/Cantidad de pasajeros/i).fill(String(passengerCount));
  await page.getByLabel(/Solicitudes especiales/i).fill("Prueba automatizada Playwright");
};

const confirmReservationAndGoToPayment = async (page, passengerCount = 2) => {
  await openReservationForm(page);
  await fillReservationForm(page, passengerCount);

  const message = await clickAndAcceptDialog(page, async () => {
    await page.getByRole("button", { name: /Confirmar reserva/i }).click();
  });

  expect(message).toContain("Reserva creada correctamente");

  await expect(
    page.getByRole("heading", { name: /Datos del pago/i })
  ).toBeVisible();
};

const fillValidCardData = async (page) => {
  await page.getByLabel(/Número de tarjeta/i).fill("4111111111111111");
  await page.getByLabel(/Fecha de expiración/i).fill("1230");
  await page.getByLabel(/^CVV$/i).fill("123");
};

test.describe("Épica 4 - Proceso de reserva en línea", () => {
  test("permite crear una reserva válida con cupos disponibles", async ({ page }) => {
    await confirmReservationAndGoToPayment(page, 2);

    await expect(page.getByText(/Resumen final de la reserva/i)).toBeVisible();
    await expect(page.getByText(/Total a pagar/i)).toBeVisible();
  });

  test("no permite confirmar una reserva sin fecha de inicio del tour", async ({ page }) => {
    await openReservationForm(page);

    await page.getByLabel(/Cantidad de pasajeros/i).fill("2");

    const message = await clickAndAcceptDialog(page, async () => {
      await page.getByRole("button", { name: /Confirmar reserva/i }).click();
    });

    expect(message).toContain("Debes seleccionar la fecha de inicio del tour");
  });

  test("muestra el resumen estimado y los descuentos antes de confirmar", async ({ page }) => {
    await openReservationForm(page);

    await fillReservationForm(page, 4);

    await expect(page.getByText(/Resumen estimado de la reserva/i)).toBeVisible();
    await expect(page.getByText(/Descuentos aplicados/i)).toBeVisible();
    await expect(page.getByText(/Total a pagar/i)).toBeVisible();
  });
});

test.describe("Épica 5 - Gestión de pagos en línea", () => {
  test("permite pagar una reserva con tarjeta simulada válida", async ({ page }) => {
    await confirmReservationAndGoToPayment(page, 2);
    await fillValidCardData(page);

    const message = await clickAndAcceptDialog(page, async () => {
      await page.getByRole("button", { name: /Confirmar pago/i }).click();
    });

    expect(message).toContain("Pago realizado correctamente");

    await page.getByRole("link", { name: /Mis reservas/i }).click();

    await expect(page.getByRole("heading", { name: /Mis reservas/i })).toBeVisible();
    await expect(page.getByText(/Confirmada/i).first()).toBeVisible();
  });

  test("no permite pagar si faltan datos de la tarjeta", async ({ page }) => {
    await confirmReservationAndGoToPayment(page, 2);

    const message = await clickAndAcceptDialog(page, async () => {
      await page.getByRole("button", { name: /Confirmar pago/i }).click();
    });

    expect(message).toContain("Debes completar todos los datos de la tarjeta");
  });

  test("valida que el número de tarjeta tenga 16 dígitos", async ({ page }) => {
    await confirmReservationAndGoToPayment(page, 2);

    await page.getByLabel(/Número de tarjeta/i).fill("123");
    await page.getByLabel(/Fecha de expiración/i).fill("1230");
    await page.getByLabel(/^CVV$/i).fill("123");

    const message = await clickAndAcceptDialog(page, async () => {
      await page.getByRole("button", { name: /Confirmar pago/i }).click();
    });

    expect(message).toContain("El número de tarjeta debe tener 16 dígitos");
  });
});
