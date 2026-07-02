/**
 * Client-side CSV checks for bulk uploads.
 *
 * Only CSV can be parsed in the browser without a dependency; xlsx files are
 * binary so they're left to server-side validation. Used to fail fast before
 * the validate API call. The server remains the authority (format rules,
 * future-date, unknown wallet, IFSC length, xlsx, etc.).
 */

export interface CsvColumnCheck {
  /** Required columns absent from the header row. */
  missingColumns: string[]
  /** Header columns that aren't a known required/optional column. */
  unrecognisedColumns: string[]
  /** Data rows (1-based, header excluded) with an empty value in a required column. */
  emptyValueRows: { row: number; columns: string[] }[]
}

/** A required column, or a set of accepted aliases — any one of them satisfies it. */
export type RequiredColumn = string | string[]

const aliasesOf = (col: RequiredColumn): string[] => (Array.isArray(col) ? col : [col])
const labelOf = (col: RequiredColumn): string => aliasesOf(col).join(' or ')

/** Max upload size enforced by the backend (8 MiB), mirrored client-side. */
export const MAX_BULK_BYTES = 8 * 1024 * 1024

/** Quick file sanity check before reading/uploading. Returns null when ok. */
export function bulkFileError(file: File): string | null {
  if (!/\.(csv|xlsx)$/i.test(file.name)) {
    return 'Unsupported file type. Upload a .csv or .xlsx file.'
  }
  if (file.size > MAX_BULK_BYTES) {
    return 'File is too large. The maximum size is 8 MiB.'
  }
  if (file.size === 0) {
    return 'The file is empty.'
  }
  return null
}

/** Pick the most likely delimiter from the header line (Excel often uses ";"). */
export function detectDelimiter(text: string): string {
  const headerLine = text.split(/\r?\n/).find(line => line.trim() !== '') ?? ''
  let best = ','
  let bestCount = -1
  for (const delimiter of [',', ';', '\t']) {
    const count = headerLine.split(delimiter).length - 1
    if (count > bestCount) {
      bestCount = count
      best = delimiter
    }
  }
  return best
}

/** RFC4180-ish parser: handles quoted fields, escaped quotes ("") and CRLF/LF. */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (ch !== '\r') {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

const normalize = (s: string) =>
  s
    .replace(/["']/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '')

/**
 * Pure column check over CSV text. Detects missing required + unrecognised
 * columns and, when all required columns are present, empty required values.
 */
export function checkColumns(
  text: string,
  required: RequiredColumn[],
  optional: string[] = [],
): CsvColumnCheck {
  const clean = text.replace(/^﻿/, '') // strip BOM
  const rows = parseCsv(clean, detectDelimiter(clean))
  if (rows.length === 0) {
    return { missingColumns: required.map(labelOf), unrecognisedColumns: [], emptyValueRows: [] }
  }

  const rawHeader = rows[0].map(h => h.trim())
  const headerNorm = rawHeader.map(normalize)
  const has = (name: string) => headerNorm.includes(normalize(name))

  // A required column is satisfied when any of its aliases is present.
  const missingColumns = required.filter(col => !aliasesOf(col).some(has)).map(labelOf)

  const known = new Set(required.flatMap(aliasesOf).concat(optional).map(normalize))
  const unrecognisedColumns = Array.from(
    new Set(rawHeader.filter(h => h !== '' && !known.has(normalize(h)))),
  )

  const emptyValueRows: { row: number; columns: string[] }[] = []
  if (missingColumns.length === 0) {
    const columnIndex = required.map(col => {
      const present = aliasesOf(col).find(has) ?? aliasesOf(col)[0]
      return { col: present, idx: headerNorm.indexOf(normalize(present)) }
    })
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i]
      if (cells.every(c => c.trim() === '')) continue // skip blank lines
      const empties = columnIndex.filter(({ idx }) => !(cells[idx] ?? '').trim()).map(x => x.col)
      if (empties.length > 0) emptyValueRows.push({ row: i, columns: empties })
    }
  }

  return { missingColumns, unrecognisedColumns, emptyValueRows }
}

/**
 * Reads a CSV File and runs {@link checkColumns}. Returns null when the file
 * can't be checked client-side (xlsx / read error).
 */
export async function checkBulkColumns(
  file: File,
  required: RequiredColumn[],
  optional: string[] = [],
): Promise<CsvColumnCheck | null> {
  const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv'
  if (!isCsv) return null

  let text: string
  try {
    text = await file.text()
  } catch {
    return null
  }
  return checkColumns(text, required, optional)
}
