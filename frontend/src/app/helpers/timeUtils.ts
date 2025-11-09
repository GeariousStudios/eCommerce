import { DateTime } from "luxon";

// Converts frontend format to backend format. Used like this:
// localTimeToUtcIso("2025-07-17", "00:01") => "2025-07-16T22:01:00.000Z"
export function localTimeToUtcIso(dateStr: string, timeStr: string): string {
  // const local = new Date(`${dateStr}T${timeStr}`);
  // const utc = new Date(local.getTime() - local.getTimezoneOffset() * 60000);
  // return utc.toISOString();

  // --- LUXON ---
  return DateTime.fromISO(`${dateStr}T${timeStr}`, { zone: "local" })
    .toUTC()
    .toISO() as string;
}

// ------

// Converts frontend format to backend format. Used like this:
// localDateTimeToUtcIso("2025-07-17T00:01") => "2025-07-16T22:01:00.000Z"
export function localDateTimeToUtcIso(dateTimeStr: string): string {
  const local = new Date(dateTimeStr);
  const utc = new Date(local.getTime() - local.getTimezoneOffset() * 60000);
  return utc.toISOString();

  // --- LUXON --- (does not work as intended)
  // return DateTime.fromISO(dateTimeStr, { zone: "local" })
  //   .toUTC()
  //   .toISO() as string;
}
// ------

// Converts frontend format to backend format. Used like this:
// localDateToUtcIso("2025-07-17") => "2025-07-16T22:00:00.000Z"
export function localDateToUtcIso(dateStr: string): string {
  // const local = new Date(`${dateStr}T00:00`);
  // const utc = new Date(local.getTime() - local.getTimezoneOffset() * 60000);
  // return utc.toISOString();

  // --- LUXON ---
  return DateTime.fromISO(`${dateStr}T00:00`, { zone: "local" })
    .toUTC()
    .toISO() as string;
}

// Converts backend format to frontend format. Used like this:
// utcIsoToLocalTime("2025-07-17T00:01:00Z") => "02:01"
export function utcIsoToLocalTime(iso: string): string {
  // const d = new Date(iso);
  // return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // --- LUXON ---
  return DateTime.fromISO(iso, { zone: "utc" }).toLocal().toFormat("HH:mm");
}

// ------

// Converts backend format to frontend format. Used like this:
// utcIsoToLocalDateTime("2025-07-17T00:01:00Z") => "2025-07-17T02:01"
export function utcIsoToLocalDateTime(utcIso: string): string {
  //  const date = new Date(utcIso);
  //   const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  //   return local.toISOString().slice(0, 16);

  // --- LUXON ---
  return DateTime.fromISO(utcIso, { zone: "utc" })
    .toLocal()
    .toFormat("yyyy-MM-dd HH:mm");
}

// ------

// Converts backend format to frontend format. Used like this:
// toLocalDateString(new Date("2025-07-16T22:00:00Z")) => "2025-07-17"
export function toLocalDateString(date: Date): string {
  // const year = date.getFullYear();
  // const month = String(date.getMonth() + 1).padStart(2, "0");
  // const day = String(date.getDate()).padStart(2, "0");
  // return `${year}-${month}-${day}`;

  // --- LUXON ---
  return DateTime.fromJSDate(date).toLocal().toFormat("yyyy-MM-dd");
}
