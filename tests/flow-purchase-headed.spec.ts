import { expect, test } from "@playwright/test";

test("flujo visual de compra sandbox hasta checkout Flow", async ({ page }) => {
  await page.goto("/#regalo");
  await page.evaluate(() => {
    localStorage.removeItem("gift_cart");
    localStorage.removeItem("gift_donor");
  });
  await page.reload();
  await page.goto("/#regalo");
  const giftSection = page.locator("#regalo");

  await giftSection.getByRole("button", { name: "Agregar El Primer Café Juntos" }).click();
  await giftSection.getByPlaceholder("Ej: Carolina Pérez").fill("Playwright Sandbox");
  await giftSection.getByPlaceholder("nombre@correo.cl").fill("pierocr@gmail.com");
  await giftSection
    .getByPlaceholder("Déjanos un mensaje bonito que acompañe tu regalo...")
    .fill("Prueba sandbox completa desde Playwright");

  await giftSection.getByRole("button", { name: /Pagar \(WebPay\)/ }).click();
  await expect(page).toHaveURL(/sandbox\.flow\.cl|flow\.cl/, { timeout: 30_000 });

  // El navegador queda abierto en este punto para completar el pago sandbox manualmente.
  await page.pause();
});
