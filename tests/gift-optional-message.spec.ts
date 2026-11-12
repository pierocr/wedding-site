import { expect, test } from "@playwright/test";

test("se puede iniciar el pago sin dejar un mensaje", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("gift_cart");
    localStorage.removeItem("gift_donor");
  });
  await page.route("**/api/flow/create-payment", async (route) => {
    await route.fulfill({ json: { redirectUrl: "/?pago=prueba" } });
  });

  await page.goto("/#regalo");
  const gifts = page.locator("#regalo");
  await gifts.getByRole("button", { name: "Agregar El Primer Café Juntos" }).click();
  await gifts.getByPlaceholder("Ej: Carolina Pérez").fill("Invitado de prueba");
  await gifts.getByPlaceholder("nombre@correo.cl").fill("invitado@example.com");

  await expect(gifts.getByText("Mensaje para los novios (opcional)")).toBeVisible();
  const payment = gifts.getByRole("button", { name: /Pagar \(WebPay\)/ });
  await expect(payment).toBeEnabled();
  const request = page.waitForRequest("**/api/flow/create-payment");
  await payment.click();
  expect((await request).postDataJSON()).toMatchObject({ message: "" });
});
