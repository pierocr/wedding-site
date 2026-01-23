import "server-only";
import { PDFDocument, StandardFonts, rgb, PDFPage } from "pdf-lib";

type CartLine = { title?: string; unitPrice?: number; qty?: number };

export type ReceiptPayload = {
  donor_name: string;
  donor_email: string;
  amount: number;
  raffle_number: number;
  external_reference?: string | null;
  flow_order?: string | null;
  flow_token?: string | null;
  cart?: CartLine[] | null;
  message?: string | null;
};

type EnvOpts = { optional?: boolean; fallback?: string };
const env = (k: string, opts?: EnvOpts) => {
  const v = process.env[k] ?? opts?.fallback;
  if (!opts?.optional && (v === undefined || v === null || v === "")) {
    throw new Error(`Missing env ${k}`);
  }
  return v as string | undefined;
};

const formatCLP = (n: number | null | undefined) =>
  typeof n === "number" && !Number.isNaN(n)
    ? new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }).format(n)
    : "";

const wrapText = (text: string, max = 86) => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line.trim());
      line = w;
    } else {
      line += ` ${w}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pieroydebby.cl";

const toRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: ((bigint >> 16) & 255) / 255,
    g: ((bigint >> 8) & 255) / 255,
    b: (bigint & 255) / 255,
  };
};

const loadImage = async (filename: string): Promise<Uint8Array | null> => {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pieroydebby.cl";
    const imageUrl = `${siteUrl.replace(/\/$/, "")}/gallery/${filename}`;
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch {
    return null;
  }
};

// Theme colors
const theme = {
  ink: toRgb("#2f3f38"),
  muted: toRgb("#5f6b5f"),
  accent: toRgb("#3f5c4a"),
  gold: toRgb("#b8956e"),
  goldLight: toRgb("#d4b896"),
  sand: toRgb("#f3eadf"),
  card: toRgb("#fdfbf7"),
  border: toRgb("#e6dccf"),
  white: toRgb("#ffffff"),
  cream: toRgb("#faf7f2"),
};

// Draw decorative corner flourishes
const drawCornerFlourish = (
  page: PDFPage,
  x: number,
  y: number,
  rotation: number
) => {
  const size = 35;
  const color = rgb(theme.gold.r, theme.gold.g, theme.gold.b);

  // Simple elegant corner lines
  const cos = Math.cos((rotation * Math.PI) / 180);
  const sin = Math.sin((rotation * Math.PI) / 180);

  // Outer L
  page.drawLine({
    start: { x: x, y: y },
    end: { x: x + size * cos, y: y + size * sin },
    thickness: 1.5,
    color,
    opacity: 0.7,
  });
  page.drawLine({
    start: { x: x, y: y },
    end: { x: x - size * sin, y: y + size * cos },
    thickness: 1.5,
    color,
    opacity: 0.7,
  });

  // Inner L (shorter)
  page.drawLine({
    start: { x: x + 4 * cos - 4 * sin, y: y + 4 * sin + 4 * cos },
    end: { x: x + (size - 10) * cos - 4 * sin, y: y + (size - 10) * sin + 4 * cos },
    thickness: 0.8,
    color,
    opacity: 0.5,
  });
  page.drawLine({
    start: { x: x + 4 * cos - 4 * sin, y: y + 4 * sin + 4 * cos },
    end: { x: x + 4 * cos - (size - 10) * sin, y: y + 4 * sin + (size - 10) * cos },
    thickness: 0.8,
    color,
    opacity: 0.5,
  });
};

// Draw decorative border
const drawDecorativeBorder = (page: PDFPage, width: number, height: number) => {
  const margin = 25;
  const borderColor = rgb(theme.gold.r, theme.gold.g, theme.gold.b);

  // Outer border
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderColor,
    borderWidth: 1,
    opacity: 0.4,
  });

  // Inner border
  page.drawRectangle({
    x: margin + 6,
    y: margin + 6,
    width: width - margin * 2 - 12,
    height: height - margin * 2 - 12,
    borderColor,
    borderWidth: 0.5,
    opacity: 0.25,
  });

  // Corner flourishes
  drawCornerFlourish(page, margin + 3, height - margin - 3, 180);
  drawCornerFlourish(page, width - margin - 3, height - margin - 3, 270);
  drawCornerFlourish(page, margin + 3, margin + 3, 90);
  drawCornerFlourish(page, width - margin - 3, margin + 3, 0);
};

// Draw centered text helper
const drawCenteredText = (
  page: PDFPage,
  text: string,
  y: number,
  font: any,
  size: number,
  color: ReturnType<typeof rgb>,
  width: number
) => {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (width - textWidth) / 2,
    y,
    size,
    font,
    color,
  });
};

export async function buildReceiptPdf(payload: ReceiptPayload) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const boldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  // Load images
  const [heroBytes, img2Bytes, img4Bytes, img5Bytes, img8Bytes] = await Promise.all([
    loadImage("1.jpg"),
    loadImage("2.jpg"),
    loadImage("4.jpg"),
    loadImage("5.jpg"),
    loadImage("8.jpg"),
  ]);

  // ========== PAGE 1: THANK YOU COVER ==========
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  const { height, width } = page1.getSize();

  // Cream background
  page1.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(theme.cream.r, theme.cream.g, theme.cream.b),
  });

  // Decorative border
  drawDecorativeBorder(page1, width, height);

  // Top decorative line
  page1.drawLine({
    start: { x: width / 2 - 80, y: height - 60 },
    end: { x: width / 2 + 80, y: height - 60 },
    thickness: 0.8,
    color: rgb(theme.gold.r, theme.gold.g, theme.gold.b),
    opacity: 0.6,
  });

  // Small diamond decoration
  const diamondY = height - 60;
  page1.drawLine({
    start: { x: width / 2 - 4, y: diamondY },
    end: { x: width / 2, y: diamondY + 4 },
    thickness: 0.8,
    color: rgb(theme.gold.r, theme.gold.g, theme.gold.b),
  });
  page1.drawLine({
    start: { x: width / 2, y: diamondY + 4 },
    end: { x: width / 2 + 4, y: diamondY },
    thickness: 0.8,
    color: rgb(theme.gold.r, theme.gold.g, theme.gold.b),
  });
  page1.drawLine({
    start: { x: width / 2 + 4, y: diamondY },
    end: { x: width / 2, y: diamondY - 4 },
    thickness: 0.8,
    color: rgb(theme.gold.r, theme.gold.g, theme.gold.b),
  });
  page1.drawLine({
    start: { x: width / 2, y: diamondY - 4 },
    end: { x: width / 2 - 4, y: diamondY },
    thickness: 0.8,
    color: rgb(theme.gold.r, theme.gold.g, theme.gold.b),
  });

  // Names header
  drawCenteredText(
    page1,
    "Piero & Debby",
    height - 95,
    boldItalic,
    32,
    rgb(theme.accent.r, theme.accent.g, theme.accent.b),
    width
  );

  // Subtitle
  drawCenteredText(
    page1,
    "les agradecen de corazon",
    height - 120,
    italic,
    14,
    rgb(theme.muted.r, theme.muted.g, theme.muted.b),
    width
  );

  // Main hero image with elegant frame
  if (heroBytes) {
    try {
      const heroImg = await pdfDoc.embedJpg(heroBytes);
      const imgHeight = 280;
      const imgWidth = (heroImg.width / heroImg.height) * imgHeight;
      const imgX = (width - imgWidth) / 2;
      const imgY = height - 420;

      // Shadow effect
      page1.drawRectangle({
        x: imgX + 4,
        y: imgY - 4,
        width: imgWidth,
        height: imgHeight,
        color: rgb(0, 0, 0),
        opacity: 0.08,
      });

      // White border/frame
      page1.drawRectangle({
        x: imgX - 8,
        y: imgY - 8,
        width: imgWidth + 16,
        height: imgHeight + 16,
        color: rgb(theme.white.r, theme.white.g, theme.white.b),
        borderColor: rgb(theme.gold.r, theme.gold.g, theme.gold.b),
        borderWidth: 1.5,
      });

      // Image
      page1.drawImage(heroImg, {
        x: imgX,
        y: imgY,
        width: imgWidth,
        height: imgHeight,
      });
    } catch {
      // Continue without image
    }
  }

  // "Better Together" quote
  drawCenteredText(
    page1,
    '"Better Together"',
    height - 455,
    boldItalic,
    18,
    rgb(theme.gold.r, theme.gold.g, theme.gold.b),
    width
  );

  // Decorative separator
  page1.drawLine({
    start: { x: width / 2 - 60, y: height - 480 },
    end: { x: width / 2 + 60, y: height - 480 },
    thickness: 0.5,
    color: rgb(theme.gold.r, theme.gold.g, theme.gold.b),
    opacity: 0.5,
  });

  // Thank you message box
  const messageBoxY = height - 640;
  const messageBoxHeight = 140;

  page1.drawRectangle({
    x: 50,
    y: messageBoxY,
    width: width - 100,
    height: messageBoxHeight,
    color: rgb(theme.sand.r, theme.sand.g, theme.sand.b),
    borderColor: rgb(theme.border.r, theme.border.g, theme.border.b),
    borderWidth: 0.5,
    opacity: 0.7,
  });

  // Thank you title
  drawCenteredText(
    page1,
    `Gracias, ${payload.donor_name}`,
    messageBoxY + messageBoxHeight - 30,
    bold,
    18,
    rgb(theme.ink.r, theme.ink.g, theme.ink.b),
    width
  );

  // Thank you message lines
  const thankYouLines = [
    "Tu generosidad y carino nos llenan de alegria.",
    "Cada regalo que recibimos representa un abrazo,",
    "una bendicion y un deseo de felicidad para",
    "esta nueva etapa que comenzamos juntos.",
    "",
    "Guardaremos este gesto en nuestros corazones para siempre.",
  ];

  let msgY = messageBoxY + messageBoxHeight - 55;
  thankYouLines.forEach((line) => {
    if (line) {
      drawCenteredText(
        page1,
        line,
        msgY,
        font,
        11,
        rgb(theme.muted.r, theme.muted.g, theme.muted.b),
        width
      );
    }
    msgY -= 15;
  });

  // Date at bottom
  const dateStr = new Date().toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Santiago",
  });

  drawCenteredText(
    page1,
    dateStr,
    70,
    italic,
    10,
    rgb(theme.muted.r, theme.muted.g, theme.muted.b),
    width
  );

  // ========== PAGE 2: RECEIPT & MEMORIES ==========
  const page2 = pdfDoc.addPage([595.28, 841.89]);

  // Cream background
  page2.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(theme.cream.r, theme.cream.g, theme.cream.b),
  });

  // Decorative border
  drawDecorativeBorder(page2, width, height);

  // Header
  drawCenteredText(
    page2,
    "Comprobante de Regalo",
    height - 65,
    bold,
    22,
    rgb(theme.accent.r, theme.accent.g, theme.accent.b),
    width
  );

  // Decorative line under header
  page2.drawLine({
    start: { x: width / 2 - 100, y: height - 80 },
    end: { x: width / 2 + 100, y: height - 80 },
    thickness: 0.8,
    color: rgb(theme.gold.r, theme.gold.g, theme.gold.b),
    opacity: 0.6,
  });

  // Receipt card
  const cardX = 50;
  const cardY = height - 300;
  const cardW = width - 100;
  const cardH = 200;

  // Card shadow
  page2.drawRectangle({
    x: cardX + 3,
    y: cardY - 3,
    width: cardW,
    height: cardH,
    color: rgb(0, 0, 0),
    opacity: 0.05,
  });

  // Card
  page2.drawRectangle({
    x: cardX,
    y: cardY,
    width: cardW,
    height: cardH,
    color: rgb(theme.card.r, theme.card.g, theme.card.b),
    borderColor: rgb(theme.border.r, theme.border.g, theme.border.b),
    borderWidth: 1,
  });

  // Status badge
  const badgeWidth = 80;
  const badgeHeight = 24;
  const badgeX = cardX + cardW - badgeWidth - 15;
  const badgeY = cardY + cardH - badgeHeight - 15;

  page2.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
    opacity: 0.9,
  });

  const badgeTextWidth = bold.widthOfTextAtSize("PAGADO", 10);
  page2.drawText("PAGADO", {
    x: badgeX + (badgeWidth - badgeTextWidth) / 2,
    y: badgeY + 7,
    size: 10,
    font: bold,
    color: rgb(1, 1, 1),
  });

  // Receipt info
  const info: Array<[string, string]> = [
    ["Nombre", payload.donor_name],
    ["Email", payload.donor_email],
    ["Monto del regalo", formatCLP(payload.amount)],
    ["Numero de concurso", String(payload.raffle_number)],
    ["Referencia", payload.external_reference || "-"],
  ];
  if (payload.flow_order) info.push(["Flow order", String(payload.flow_order)]);

  let infoY = cardY + cardH - 40;
  const labelX = cardX + 20;
  const valueX = cardX + 150;

  info.forEach(([label, value]) => {
    page2.drawText(label + ":", {
      x: labelX,
      y: infoY,
      size: 11,
      font: bold,
      color: rgb(theme.muted.r, theme.muted.g, theme.muted.b),
    });
    page2.drawText(value, {
      x: valueX,
      y: infoY,
      size: 11,
      font: font,
      color: rgb(theme.ink.r, theme.ink.g, theme.ink.b),
    });
    infoY -= 22;
  });

  // Message section (if present)
  let currentY = cardY - 30;

  if (payload.message) {
    page2.drawText("Tu mensaje:", {
      x: 50,
      y: currentY,
      size: 12,
      font: bold,
      color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
    });
    currentY -= 20;

    const msgLines = wrapText(payload.message, 75);
    const msgBoxHeight = msgLines.length * 16 + 20;

    page2.drawRectangle({
      x: 50,
      y: currentY - msgBoxHeight + 15,
      width: width - 100,
      height: msgBoxHeight,
      color: rgb(theme.sand.r, theme.sand.g, theme.sand.b),
      borderColor: rgb(theme.border.r, theme.border.g, theme.border.b),
      borderWidth: 0.5,
      opacity: 0.8,
    });

    msgLines.forEach((line) => {
      page2.drawText(line, {
        x: 60,
        y: currentY,
        size: 11,
        font: italic,
        color: rgb(theme.ink.r, theme.ink.g, theme.ink.b),
      });
      currentY -= 16;
    });
    currentY -= 20;
  }

  // Cart details (if present)
  if (payload.cart?.length) {
    page2.drawText("Detalle de regalos:", {
      x: 50,
      y: currentY,
      size: 12,
      font: bold,
      color: rgb(theme.accent.r, theme.accent.g, theme.accent.b),
    });
    currentY -= 20;

    payload.cart.forEach((l) => {
      const qty = l.qty ?? 1;
      const total = (l.unitPrice || 0) * qty;
      page2.drawText(`  ${qty}x ${l.title || "Regalo"} — ${formatCLP(total)}`, {
        x: 50,
        y: currentY,
        size: 11,
        font: font,
        color: rgb(theme.ink.r, theme.ink.g, theme.ink.b),
      });
      currentY -= 18;
    });
    currentY -= 10;
  }

  // Photo collage section
  const collageTitle = "Momentos de nuestra historia";
  drawCenteredText(
    page2,
    collageTitle,
    currentY - 10,
    boldItalic,
    14,
    rgb(theme.gold.r, theme.gold.g, theme.gold.b),
    width
  );

  // Decorative line
  page2.drawLine({
    start: { x: width / 2 - 80, y: currentY - 25 },
    end: { x: width / 2 + 80, y: currentY - 25 },
    thickness: 0.5,
    color: rgb(theme.gold.r, theme.gold.g, theme.gold.b),
    opacity: 0.5,
  });

  // Photo collage - 4 photos in a row
  const photoY = 80;
  const photoSize = 110;
  const photoSpacing = 15;
  const totalPhotosWidth = photoSize * 4 + photoSpacing * 3;
  let photoX = (width - totalPhotosWidth) / 2;

  const photos = [img2Bytes, img4Bytes, img5Bytes, img8Bytes];

  for (const photoBytes of photos) {
    if (photoBytes) {
      try {
        const img = await pdfDoc.embedJpg(photoBytes);

        // Calculate scaled dimensions to fit within frame while maintaining aspect ratio
        const imgAspect = img.width / img.height;
        let drawWidth: number;
        let drawHeight: number;

        if (imgAspect > 1) {
          // Landscape: width is the limiting factor
          drawWidth = photoSize;
          drawHeight = photoSize / imgAspect;
        } else {
          // Portrait or square: height is the limiting factor
          drawHeight = photoSize;
          drawWidth = photoSize * imgAspect;
        }

        // Center the image within the frame
        const offsetX = (photoSize - drawWidth) / 2;
        const offsetY = (photoSize - drawHeight) / 2;

        // Photo frame (white background)
        page2.drawRectangle({
          x: photoX - 3,
          y: photoY - 3,
          width: photoSize + 6,
          height: photoSize + 6,
          color: rgb(theme.white.r, theme.white.g, theme.white.b),
          borderColor: rgb(theme.goldLight.r, theme.goldLight.g, theme.goldLight.b),
          borderWidth: 1,
        });

        // Photo (scaled to fit, centered)
        page2.drawImage(img, {
          x: photoX + offsetX,
          y: photoY + offsetY,
          width: drawWidth,
          height: drawHeight,
        });
      } catch {
        // Continue without this photo
      }
    }
    photoX += photoSize + photoSpacing;
  }

  // Footer message
  drawCenteredText(
    page2,
    "Con amor y gratitud,",
    55,
    italic,
    10,
    rgb(theme.muted.r, theme.muted.g, theme.muted.b),
    width
  );

  drawCenteredText(
    page2,
    "Piero & Debby",
    40,
    boldItalic,
    12,
    rgb(theme.accent.r, theme.accent.g, theme.accent.b),
    width
  );

  const pdfBytes = await pdfDoc.save();
  return new Uint8Array(pdfBytes);
}

const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const toBase64 = (bytes: Uint8Array) => {
  const maybeBuffer = (globalThis as any).Buffer;
  if (maybeBuffer) return maybeBuffer.from(bytes).toString("base64");
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

export async function sendFlowReceiptEmail(payload: ReceiptPayload) {
  const apiKey = env("RESEND_API_KEY");
  const from =
    env("EMAIL_FROM", { optional: true }) ||
    env("THANKS_FROM", { optional: true }) ||
    "Piero & Debby <noreply@teilen.cl>";
  const siteUrl =
    env("NEXT_PUBLIC_SITE_URL", { optional: true }) ||
    env("SITE_URL", { optional: true }) ||
    "https://pieroydebby.cl";
  const imageUrl = `${siteUrl.replace(/\/$/, "")}/gallery/1.jpg`;
  const bccRaw = env("EMAIL_BCC", { optional: true }) || env("THANKS_BCC", { optional: true }) || "";
  const bcc = bccRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!apiKey) throw new Error("Falta RESEND_API_KEY");

  const pdf = await buildReceiptPdf(payload);
  const pdfBase64 = toBase64(pdf);

  const amountFmt = formatCLP(payload.amount);
  const cartHtml = (payload.cart || [])
    .map((l) => {
      const qty = l.qty ?? 1;
      const total = (l.unitPrice || 0) * qty;
      return `<li>${qty}× ${escapeHtml(l.title || "Regalo")} — ${escapeHtml(
        formatCLP(total)
      )}</li>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Comprobante de regalo</title></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:'Helvetica Neue',Arial,'Segoe UI',sans-serif;color:#2f3f38;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;border:1px solid #e6dccf;box-shadow:0 4px 24px rgba(47,63,56,0.08);overflow:hidden;">

        <!-- Header con imagen -->
        <tr><td style="padding:0;">
          <div style="background:linear-gradient(180deg,#f3eadf 0%,#fdfbf7 100%);padding:32px 32px 24px 32px;text-align:center;border-bottom:1px solid #e6dccf;">
            <img src="${escapeHtml(imageUrl)}" width="100" height="100" alt="Piero y Debby" style="border-radius:50%;border:3px solid #ffffff;box-shadow:0 4px 20px rgba(184,149,110,0.25);object-fit:cover;display:block;margin:0 auto;" />
            <div style="margin-top:20px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#b8956e;font-weight:600;">Piero &amp; Debby</div>
            <div style="font-size:28px;line-height:1.3;font-weight:700;color:#2f3f38;margin-top:8px;">Gracias, ${escapeHtml(payload.donor_name)}</div>
            <div style="width:60px;height:2px;background:#b8956e;margin:16px auto;opacity:0.6;"></div>
            <p style="margin:0;font-size:15px;color:#5f6b5f;line-height:1.7;max-width:420px;margin:0 auto;">
              Tu generosidad nos llena de alegria. Cada regalo representa un abrazo y un deseo de felicidad para esta nueva etapa que comenzamos juntos.
            </p>
          </div>
        </td></tr>

        <!-- Resumen del regalo -->
        <tr><td style="padding:24px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdfbf7;border-radius:12px;border:1px solid #e6dccf;">
            <tr>
              <td style="padding:20px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#5f6b5f;font-weight:600;">Tu aporte</div>
                      <div style="font-size:32px;font-weight:700;color:#3f5c4a;margin-top:4px;">${escapeHtml(amountFmt)}</div>
                    </td>
                    <td style="vertical-align:middle;text-align:right;">
                      <div style="display:inline-block;background:#3f5c4a;color:#ffffff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;">Confirmado</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 20px 24px;">
                <div style="height:1px;background:#e6dccf;margin-bottom:16px;"></div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#5f6b5f;">
                  <tr>
                    <td style="padding:4px 0;"><span style="color:#8c7a67;">N° de concurso:</span></td>
                    <td style="padding:4px 0;text-align:right;color:#2f3f38;font-weight:600;">${escapeHtml(String(payload.raffle_number))}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;"><span style="color:#8c7a67;">Referencia:</span></td>
                    <td style="padding:4px 0;text-align:right;color:#2f3f38;font-size:12px;">${escapeHtml(payload.external_reference || "-")}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        ${
          cartHtml
            ? `<!-- Detalle de regalos -->
        <tr><td style="padding:0 32px 20px 32px;">
          <div style="font-size:13px;font-weight:700;color:#2f3f38;margin-bottom:10px;">Detalle de tu regalo</div>
          <ul style="margin:0;padding-left:20px;color:#5f6b5f;font-size:14px;line-height:1.8;">${cartHtml}</ul>
        </td></tr>`
            : ""
        }

        ${
          payload.message
            ? `<!-- Mensaje personal -->
        <tr><td style="padding:0 32px 24px 32px;">
          <div style="font-size:13px;font-weight:700;color:#2f3f38;margin-bottom:10px;">Tu mensaje para nosotros</div>
          <div style="padding:16px 20px;background:#f9f6f0;border-left:3px solid #b8956e;border-radius:0 8px 8px 0;font-size:14px;color:#374151;line-height:1.7;font-style:italic;">"${escapeHtml(payload.message)}"</div>
        </td></tr>`
            : ""
        }

        <!-- Footer -->
        <tr><td style="padding:20px 32px 28px 32px;background:#fdfbf7;border-top:1px solid #e6dccf;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="text-align:center;">
              <p style="margin:0 0 12px 0;font-size:14px;color:#5f6b5f;line-height:1.6;">
                Adjuntamos tu comprobante en PDF para que lo guardes como recuerdo.
              </p>
              <div style="font-size:13px;color:#b8956e;font-weight:600;letter-spacing:0.02em;">Estamos contando los dias para celebrarlo contigo</div>
              <div style="width:40px;height:1px;background:#e6dccf;margin:16px auto;"></div>
              <div style="font-size:14px;color:#5f6b5f;font-style:italic;">Con amor,</div>
              <div style="font-weight:700;font-size:18px;color:#3f5c4a;margin-top:4px;">Piero &amp; Debby</div>
            </td></tr>
          </table>
        </td></tr>

      </table>

      <div style="font-size:11px;color:#8c7a67;margin-top:20px;line-height:1.6;text-align:center;">
        Si no reconoces este correo, puedes ignorarlo.
      </div>
    </td></tr>
  </table>
</body></html>`;

  const subject = `Comprobante de regalo – #${payload.raffle_number}`;

  console.log("[resend] Enviando comprobante", {
    to: payload.donor_email,
    subject,
    external_reference: payload.external_reference,
    flow_token: payload.flow_token,
  });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.donor_email],
      ...(bcc.length ? { bcc } : {}),
      subject,
      html,
      attachments: [
        {
          filename: "Comprobante-regalo.pdf",
          content: pdfBase64,
        },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("[resend] Error HTTP", res.status, txt);
    const err = new Error(`Resend error: ${txt || res.statusText}`);
    (err as any).status = res.status;
    (err as any).details = txt || res.statusText;
    throw err;
  }

  let data: { id?: string } | null = null;
  try {
    data = (await res.json()) as any;
  } catch {
    data = null;
  }

  const result = {
    id: data?.id,
    subject,
    from,
    to: [payload.donor_email],
  };

  console.log("[resend] Envío exitoso", result);
  return result;
}
