import { expect, test } from "@playwright/test";

test("flujo visual de compra sandbox completo", async ({ page }) => {
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

  // Completa el pago sandbox manualmente y luego presiona Resume en Playwright Inspector.
  await page.pause();

  await page.waitForURL(/\/pago\/resultado/, { timeout: 300_000 });
  await expect(page.getByRole("heading", { name: /Pago recibido/i })).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText(/Número de concurso:\s*\d{6}/)).toBeVisible();
  await expect(page.getByText("$40.000")).toBeVisible();
  await expect(page.getByText(/GIFT_\d{8}_[A-F0-9]{8}/)).toBeVisible();
});
