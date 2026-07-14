import * as XLSX from 'xlsx';

export type Cell = string | number | null | undefined;

export function downloadExcel(
  filename: string,
  sheetName: string,
  aoa: Cell[][],
  merges?: { s: { r: number; c: number }; e: { r: number; c: number } }[]
) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (merges) ws['!merges'] = merges;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
