import { test, expect } from "@playwright/test";

test("allows selecting a photo and a video together", async ({ page }) => {
  await page.goto("/fotos");
  await page.getByLabel("Elegir fotos y videos").setInputFiles([
    { name: "recuerdo.jpg", mimeType: "image/jpeg", buffer: Buffer.from("photo") },
    { name: "baile.mov", mimeType: "video/quicktime", buffer: Buffer.from("video") },
  ]);
  await expect(page.getByText("recuerdo.jpg")).toBeVisible();
  await expect(page.getByText("baile.mov")).toBeVisible();
  await expect(page.getByRole("button", { name: "Compartir mis recuerdos" })).toBeEnabled();
});

test("shows and opens videos from the gallery", async ({ page }) => {
  await page.route("**/api/fotos/galeria?*", route => route.fulfill({ json: { photos: [], hasMore: false } }));
  await page.route("**/api/fotos/videos?*", route => {
    const url = new URL(route.request().url());
    return route.fulfill({ json: url.searchParams.has("id") ? { url: "https://example.com/video.mp4" } : { videos: [{ id: "1", created_at: "2026-01-01" }], hasMore: false } });
  });
  await page.goto("/fotos/galeria");
  await page.getByRole("button", { name: "Reproducir video 1" }).click();
  await expect(page.getByRole("dialog", { name: "Video compartido" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Abrir o descargar/ })).toHaveAttribute("href", "https://example.com/video.mp4");
  await page.getByRole("button", { name: "Cerrar video" }).click();
  await expect(page.getByRole("dialog", { name: "Video compartido" })).toHaveCount(0);
});

test("keeps the upload page within a narrow phone viewport after choosing files", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/fotos");
  const picker = page.getByLabel("Elegir fotos y videos");
  await picker.setInputFiles([
    { name: `${"recuerdo".repeat(25)}.jpg`, mimeType: "image/jpeg", buffer: Buffer.from("photo") },
    { name: `${"matrimonio".repeat(20)}.mov`, mimeType: "video/quicktime", buffer: Buffer.from("video") },
  ]);
  await expect(page.getByText("Archivos seleccionados")).toBeVisible();
  const share = page.getByRole("button", { name: "Compartir mis recuerdos" });
  await share.scrollIntoViewIfNeeded();
  await expect(share).toBeInViewport();
  const dimensions = await page.evaluate(() => {
    const section = document.querySelector('[aria-labelledby="upload-title"]')!;
    const textInput = document.querySelector('#guest-name')!;
    const fileInput = document.querySelector('#photo-files')!;
    const rect = section.getBoundingClientRect();
    return { viewport: document.documentElement.clientWidth, documentWidth: document.documentElement.scrollWidth, left: rect.left, right: rect.right, textFont: parseFloat(getComputedStyle(textInput).fontSize), fileFont: parseFloat(getComputedStyle(fileInput).fontSize) };
  });
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.left).toBeGreaterThanOrEqual(0);
  expect(dimensions.right).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.textFont).toBeGreaterThanOrEqual(16);
  expect(dimensions.fileFont).toBeGreaterThanOrEqual(16);
});
