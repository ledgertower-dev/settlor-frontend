import {
  parseCsv,
  detectDelimiter,
  checkColumns,
  bulkFileError,
  MAX_BULK_BYTES,
} from '@/lib/core/csv'

const REQUIRED = ['Payment Mode', 'Wallet Code', 'Amount', 'Beneficiary Name']
const OPTIONAL = ['Beneficiary Address', 'Reference ID']

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('keeps commas inside quoted fields', () => {
    expect(parseCsv('name,remarks\nJane,"Invoice 1, paid"')).toEqual([
      ['name', 'remarks'],
      ['Jane', 'Invoice 1, paid'],
    ])
  })

  it('handles escaped quotes ("")', () => {
    expect(parseCsv('a\n"he said ""hi"""')).toEqual([['a'], ['he said "hi"']])
  })

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('supports a custom delimiter', () => {
    expect(parseCsv('a;b;c\n1;2;3', ';')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })
})

describe('detectDelimiter', () => {
  it('detects comma by default', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',')
  })
  it('detects semicolon (Excel exports)', () => {
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';')
  })
  it('detects tab', () => {
    expect(detectDelimiter('a\tb\tc')).toBe('\t')
  })
})

describe('checkColumns', () => {
  it('passes a clean file', () => {
    const csv = 'Payment Mode,Wallet Code,Amount,Beneficiary Name\nIMPS,W1,100,Jane'
    const res = checkColumns(csv, REQUIRED, OPTIONAL)
    expect(res.missingColumns).toEqual([])
    expect(res.unrecognisedColumns).toEqual([])
    expect(res.emptyValueRows).toEqual([])
  })

  it('matches headers case- & space-insensitively', () => {
    const csv = 'payment mode,WALLET_CODE,amount,Beneficiary  Name\nIMPS,W1,100,Jane'
    expect(checkColumns(csv, REQUIRED, OPTIONAL).missingColumns).toEqual([])
  })

  it('flags missing required columns', () => {
    const csv = 'Payment Mode,Amount,Beneficiary Name\nIMPS,100,Jane'
    expect(checkColumns(csv, REQUIRED, OPTIONAL).missingColumns).toEqual(['Wallet Code'])
  })

  it('flags unrecognised columns (keeps original header text)', () => {
    const csv = 'Payment Mode,Wallet Id,Amount,Beneficiary Name\nIMPS,W1,100,Jane'
    const res = checkColumns(csv, REQUIRED, OPTIONAL)
    expect(res.unrecognisedColumns).toEqual(['Wallet Id'])
    expect(res.missingColumns).toEqual(['Wallet Code'])
  })

  it('allows optional columns without flagging', () => {
    const csv =
      'Payment Mode,Wallet Code,Amount,Beneficiary Name,Reference ID\nIMPS,W1,100,Jane,INV-1'
    expect(checkColumns(csv, REQUIRED, OPTIONAL).unrecognisedColumns).toEqual([])
  })

  it('reports rows with empty required values (1-based, header excluded)', () => {
    const csv = [
      'Payment Mode,Wallet Code,Amount,Beneficiary Name',
      'IMPS,W1,100,Jane', // row 1 ok
      'IMPS,W1,,Bob', // row 2 missing Amount
      'IMPS,,200,', // row 3 missing Wallet Code + Beneficiary Name
    ].join('\n')
    const res = checkColumns(csv, REQUIRED, OPTIONAL)
    expect(res.emptyValueRows).toEqual([
      { row: 2, columns: ['Amount'] },
      { row: 3, columns: ['Wallet Code', 'Beneficiary Name'] },
    ])
  })

  it('skips blank lines', () => {
    const csv = 'Payment Mode,Wallet Code,Amount,Beneficiary Name\nIMPS,W1,100,Jane\n\n'
    expect(checkColumns(csv, REQUIRED, OPTIONAL).emptyValueRows).toEqual([])
  })

  it('does not check values when a required column is missing', () => {
    const csv = 'Payment Mode,Amount,Beneficiary Name\nIMPS,,Jane'
    const res = checkColumns(csv, REQUIRED, OPTIONAL)
    expect(res.missingColumns).toEqual(['Wallet Code'])
    expect(res.emptyValueRows).toEqual([])
  })

  it('strips a BOM and handles semicolon delimiter', () => {
    const csv = '﻿Payment Mode;Wallet Code;Amount;Beneficiary Name\nIMPS;W1;100;Jane'
    const res = checkColumns(csv, REQUIRED, OPTIONAL)
    expect(res.missingColumns).toEqual([])
    expect(res.unrecognisedColumns).toEqual([])
  })

  describe('alias groups (any one accepted)', () => {
    const ALIAS_REQUIRED = ['Payment Mode', ['Wallet ID', 'Wallet Code'], 'Amount']

    it('accepts the first alias', () => {
      const res = checkColumns('Payment Mode,Wallet ID,Amount\nIMPS,W1,100', ALIAS_REQUIRED)
      expect(res.missingColumns).toEqual([])
      expect(res.unrecognisedColumns).toEqual([])
    })

    it('accepts the second alias (no false unrecognised)', () => {
      const res = checkColumns('Payment Mode,Wallet Code,Amount\nIMPS,W1,100', ALIAS_REQUIRED)
      expect(res.missingColumns).toEqual([])
      expect(res.unrecognisedColumns).toEqual([])
    })

    it('reports the group with an "or" label when neither alias is present', () => {
      const res = checkColumns('Payment Mode,Amount\nIMPS,100', ALIAS_REQUIRED)
      expect(res.missingColumns).toEqual(['Wallet ID or Wallet Code'])
    })

    it('checks the empty value on whichever alias is present', () => {
      const res = checkColumns('Payment Mode,Wallet Code,Amount\nIMPS,,100', ALIAS_REQUIRED)
      expect(res.emptyValueRows).toEqual([{ row: 1, columns: ['Wallet Code'] }])
    })
  })
})

describe('bulkFileError', () => {
  const make = (name: string, size: number) => ({ name, size, type: '' }) as unknown as File

  it('accepts a normal csv', () => {
    expect(bulkFileError(make('payouts.csv', 1024))).toBeNull()
  })
  it('rejects unsupported types', () => {
    expect(bulkFileError(make('payouts.pdf', 1024))).toMatch(/Unsupported file type/)
  })
  it('rejects oversized files', () => {
    expect(bulkFileError(make('payouts.csv', MAX_BULK_BYTES + 1))).toMatch(/too large/)
  })
  it('rejects empty files', () => {
    expect(bulkFileError(make('payouts.csv', 0))).toMatch(/empty/)
  })
})
