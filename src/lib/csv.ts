/**
 * Minimal CSV writer for admin exports. Cells that start with =, +, -, @ or a
 * tab/carriage return are prefixed with an apostrophe so a spreadsheet never
 * evaluates visitor-supplied text as a formula.
 */
export type CsvCell = string | number | boolean | Date | null | undefined;

export function csvCell(value: CsvCell): string {
  let text: string;
  if (value === null || value === undefined) text = "";
  else if (value instanceof Date) text = Number.isNaN(value.getTime()) ? "" : value.toISOString();
  else text = String(value);

  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
