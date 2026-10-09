import "server-only";

import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import { GoogleAuth } from "google-auth-library";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type GoogleServiceAccount = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
};

type DriveFileMetadata = {
  id?: string;
  modifiedTime?: string;
  name?: string;
};

type GuestDirectoryInput = {
  source_file_id: string;
  source_row: number;
  source_fingerprint: string;
  first_name: string | null;
  last_name: string | null;
  companion_name: string | null;
  email: string | null;
  phone: string | null;
  mobile_phone: string | null;
  group_name: string | null;
  invitation_status: string | null;
  attendance_status: string | null;
  menu_preference: string | null;
  address: string | null;
  table_assignment: string | null;
  sex: string | null;
  food_notes: string | null;
  party_size: number;
  is_active: boolean;
  source_data: Record<string, string>;
  last_synced_at: string;
  updated_at: string;
};

type ExistingGuest = {
  id: string;
  source_row: number;
  source_fingerprint: string;
};

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

function readRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta configurar ${name}.`);
  return value;
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function valueOrNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function parsePartySize(total: string | undefined, companionName: string | null) {
  const numericValue = Number(String(total || "").replace(",", ".").trim());
  if (Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 10) {
    return numericValue;
  }

  return companionName ? 2 : 1;
}

function fingerprint(sourceData: Record<string, string>) {
  return createHash("sha256")
    .update(JSON.stringify(sourceData))
    .digest("hex");
}

function buildGuestRows(
  worksheet: ExcelJS.Worksheet,
  sourceFileId: string,
  syncedAt: string,
) {
  const headerRow = worksheet.getRow(1);
  const headers = new Map<number, string>();

  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const header = cell.text.trim();
    if (header) headers.set(columnNumber, header);
  });

  if (!headers.size || ![...headers.values()].some((header) => normalizeHeader(header) === "NOMBRE")) {
    throw new Error("La hoja INVITADOS no contiene la columna NOMBRE.");
  }

  const rows: GuestDirectoryInput[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const sourceData: Record<string, string> = {};
    headers.forEach((header, columnNumber) => {
      sourceData[header] = row.getCell(columnNumber).text.trim();
    });

    const valueFor = (...names: string[]) => {
      const targetNames = new Set(names.map(normalizeHeader));
      const entry = Object.entries(sourceData).find(([header]) =>
        targetNames.has(normalizeHeader(header)),
      );
      return entry?.[1];
    };

    const firstName = valueOrNull(valueFor("NOMBRE"));
    const lastName = valueOrNull(valueFor("APELLIDOS"));
    if (!firstName && !lastName) return;

    const companionName = valueOrNull(valueFor("ACOMPAÑANTE"));
    rows.push({
      source_file_id: sourceFileId,
      source_row: rowNumber,
      source_fingerprint: fingerprint(sourceData),
      first_name: firstName,
      last_name: lastName,
      companion_name: companionName,
      email: valueOrNull(valueFor("EMAIL")),
      phone: valueOrNull(valueFor("TELÉFONO", "TELEFONO")),
      mobile_phone: valueOrNull(valueFor("CELULAR")),
      group_name: valueOrNull(valueFor("GRUPO")),
      invitation_status: valueOrNull(valueFor("ENVÍO DE INVITACIÓN", "ENVIO DE INVITACION")),
      attendance_status: valueOrNull(valueFor("ASISTENCIA")),
      menu_preference: valueOrNull(valueFor("MENÚ", "MENU")),
      address: valueOrNull(valueFor("DIRECCIÓN", "DIRECCION")),
      table_assignment: valueOrNull(valueFor("MESA")),
      sex: valueOrNull(valueFor("SEXO")),
      food_notes: valueOrNull(valueFor("ALIMENTACIÓN", "ALIMENTACION")),
      party_size: parsePartySize(valueFor("TOTAL"), companionName),
      is_active: true,
      source_data: sourceData,
      last_synced_at: syncedAt,
      updated_at: syncedAt,
    });
  });

  return rows;
}

async function downloadGuestWorkbook() {
  const fileId = readRequiredEnv("GOOGLE_DRIVE_FILE_ID");
  let credentials: GoogleServiceAccount;
  try {
    credentials = JSON.parse(readRequiredEnv("GOOGLE_SERVICE_ACCOUNT_JSON"));
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no contiene un JSON válido.");
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("La cuenta de servicio no contiene client_email o private_key.");
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: [DRIVE_SCOPE],
  });
  const client = await auth.getClient();
  const metadataResponse = await client.request<DriveFileMetadata>({
    url: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    params: { fields: "id,name,modifiedTime" },
  });
  const fileResponse = await client.request<ArrayBuffer>({
    url: `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    params: { alt: "media" },
    responseType: "arraybuffer",
  });

  return {
    fileId,
    metadata: metadataResponse.data,
    workbookData: Buffer.from(fileResponse.data),
  };
}

async function updateRun(
  id: string,
  values: Record<string, unknown>,
) {
  const { error } = await getSupabaseAdmin()
    .from("guest_sync_runs")
    .update(values)
    .eq("id", id);
  if (error) throw error;
}

export type GuestSyncResult = {
  rowsSeen: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsDeactivated: number;
  guestCount: number;
  completedAt: string;
};

export async function syncGuestDirectory(): Promise<GuestSyncResult> {
  const { fileId, metadata, workbookData } = await downloadGuestWorkbook();
  const supabase = getSupabaseAdmin();
  const { data: run, error: runError } = await supabase
    .from("guest_sync_runs")
    .insert({
      source_file_id: fileId,
      source_modified_at: metadata.modifiedTime || null,
      status: "running",
    })
    .select("id")
    .single();
  if (runError) throw runError;

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(workbookData);
    const worksheet = workbook.worksheets.find(
      (sheet) => normalizeHeader(sheet.name) === "INVITADOS",
    );
    if (!worksheet) throw new Error("No se encontró la hoja INVITADOS.");

    const syncedAt = new Date().toISOString();
    const rows = buildGuestRows(worksheet, fileId, syncedAt);
    if (!rows.length) throw new Error("La hoja INVITADOS no contiene filas válidas.");

    const { data: existingRows, error: existingError } = await supabase
      .from("guest_directory")
      .select("id, source_row, source_fingerprint")
      .eq("source_file_id", fileId);
    if (existingError) throw existingError;

    const existingBySourceRow = new Map(
      ((existingRows || []) as ExistingGuest[]).map((guest) => [
        guest.source_row,
        guest,
      ]),
    );
    const rowsCreated = rows.filter(
      (guest) => !existingBySourceRow.has(guest.source_row),
    ).length;
    const rowsUpdated = rows.filter((guest) => {
      const existing = existingBySourceRow.get(guest.source_row);
      return Boolean(
        existing && existing.source_fingerprint !== guest.source_fingerprint,
      );
    }).length;

    const { error: upsertError } = await supabase
      .from("guest_directory")
      .upsert(rows, { onConflict: "source_file_id,source_row" });
    if (upsertError) throw upsertError;

    const sourceRows = new Set(rows.map((guest) => guest.source_row));
    const staleIds = ((existingRows || []) as ExistingGuest[])
      .filter((guest) => !sourceRows.has(guest.source_row))
      .map((guest) => guest.id);
    if (staleIds.length) {
      const { error: deactivateError } = await supabase
        .from("guest_directory")
        .update({ is_active: false, updated_at: syncedAt })
        .in("id", staleIds);
      if (deactivateError) throw deactivateError;
    }

    const guestCount = rows.reduce((sum, guest) => sum + guest.party_size, 0);
    await updateRun(run.id, {
      status: "completed",
      rows_seen: rows.length,
      rows_created: rowsCreated,
      rows_updated: rowsUpdated,
      rows_deactivated: staleIds.length,
      guest_count: guestCount,
      completed_at: syncedAt,
    });

    return {
      rowsSeen: rows.length,
      rowsCreated,
      rowsUpdated,
      rowsDeactivated: staleIds.length,
      guestCount,
      completedAt: syncedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Error desconocido";
    await updateRun(run.id, {
      status: "failed",
      error_message: message,
      completed_at: new Date().toISOString(),
    });
    throw error;
  }
}
