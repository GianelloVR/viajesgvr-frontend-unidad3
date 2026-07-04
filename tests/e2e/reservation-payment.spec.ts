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

const fillValidCardData = async (page: Page): Promise<void> => {
  // Given: el usuario se encuentra en el formulario de pago
  // When: ingresa datos válidos de una tarjeta simulada
  await page.getByLabel(/Número de tarjeta/i).fill("4111111111111111");
  await page.getByLabel(/Fecha de expiración/i).fill("1230");
  await page.getByLabel(/^CVV$/i).fill("123");
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

test.describe("Épica 5 - Gestión de pagos en línea", () => {
  test("permite pagar una reserva con tarjeta simulada válida", async ({ page }) => {
    // Given: el cliente tiene una reserva creada y está en el formulario de pago
    await confirmReservationAndGoToPayment(page, 2);

    // When: ingresa datos válidos de tarjeta y confirma el pago
    await fillValidCardData(page);

    const message = await clickAndAcceptDialog(page, async () => {
      await page.getByRole("button", { name: /Confirmar pago/i }).click();
    });

    // Then: el sistema registra el pago correctamente
    expect(message).toContain("Pago realizado correctamente");

    // And: la reserva queda visible en la sección Mis reservas como confirmada
    await page.getByRole("link", { name: /Mis reservas/i }).click();

    await expect(page.getByRole("heading", { name: /Mis reservas/i })).toBeVisible();
    await expect(page.getByText(/Confirmada/i).first()).toBeVisible();
  });

  test("no permite pagar si faltan datos de la tarjeta", async ({ page }) => {
    // Given: el cliente tiene una reserva creada y está en el formulario de pago
    await confirmReservationAndGoToPayment(page, 2);

    // When: intenta confirmar el pago sin completar los datos de la tarjeta
    const message = await clickAndAcceptDialog(page, async () => {
      await page.getByRole("button", { name: /Confirmar pago/i }).click();
    });

    // Then: el sistema impide el pago y muestra un mensaje de validación
    expect(message).toContain("Debes completar todos los datos de la tarjeta");
  });

  test("valida que el número de tarjeta tenga 16 dígitos", async ({ page }) => {
    // Given: el cliente tiene una reserva creada y está en el formulario de pago
    await confirmReservationAndGoToPayment(page, 2);

    // When: ingresa un número de tarjeta inválido y completa los demás datos
    await page.getByLabel(/Número de tarjeta/i).fill("123");
    await page.getByLabel(/Fecha de expiración/i).fill("1230");
    await page.getByLabel(/^CVV$/i).fill("123");

    const message = await clickAndAcceptDialog(page, async () => {
      await page.getByRole("button", { name: /Confirmar pago/i }).click();
    });

    // Then: el sistema impide el pago e informa que la tarjeta debe tener 16 dígitos
    expect(message).toContain("El número de tarjeta debe tener 16 dígitos");
  });
});
