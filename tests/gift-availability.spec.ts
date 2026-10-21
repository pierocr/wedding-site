import { expect, test } from "@playwright/test";

test("el regalo de $40.000 queda disponible y seleccionable", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/#regalo");
  await page.evaluate(() => localStorage.removeItem("gift_cart"));
  await page.reload();

  const gifts = page.locator("#regalo");
  await expect(gifts.getByText("El Primer Café Juntos")).toBeVisible();
  const addCoffee = gifts.getByRole("button", {
    name: "Agregar El Primer Café Juntos",
  });
  await expect(addCoffee).toBeVisible();
  await addCoffee.click();
  await expect(gifts.getByText(/1 regalo/)).toBeVisible();
  await gifts
    .getByRole("button", { name: "Quitar una unidad de El Primer Café Juntos" })
    .first()
    .click();
  await expect(gifts.getByText(/0 regalos/)).toBeVisible();

  await page.screenshot({
    path: "/private/tmp/gift-availability-desktop.png",
    fullPage: false,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(addCoffee).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/gift-availability-mobile.png",
    fullPage: false,
  });

  expect(errors).toEqual([]);
});
