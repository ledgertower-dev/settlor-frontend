/**
 * Bulk Scheduled Payouts API Service
 *
 * validate (dry run) → upload (Idempotency-Key) → poll status → result CSV.
 * Base path /api/v1/scheduled-payouts/bulk. No balance/mixed-wallet gate.
 */

import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'

import type {
  BulkScheduledBatchDetailResponse,
  BulkScheduledBatchResponse,
  BulkScheduledValidateResponse,
} from '../types/bulk'

type ResponseHeaders = AxiosResponseHeaders | RawAxiosResponseHeaders

function triggerBlobDownload(blob: Blob, headers: ResponseHeaders, fallbackName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const disposition = headers?.['content-disposition'] as string | undefined
  let fileName = fallbackName
  if (disposition) {
    const match = disposition.match(/filename="?([^";\n]+)"?/)
    if (match?.[1]) fileName = match[1]
  }
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface BulkScheduledUploadResult {
  batch: BulkScheduledBatchResponse
  /** true ⇒ HTTP 202, batch is PROCESSING and must be polled. */
  async: boolean
}

class BulkScheduledPayoutsService {
  /** #1 — download the CSV/XLSX template. */
  async downloadTemplate(): Promise<void> {
    try {
      const res = await apiClient.get<Blob>('/scheduled-payouts/bulk/template', {
        responseType: 'blob',
      })
      triggerBlobDownload(res.data, res.headers, 'bulk-scheduled-payouts-template.csv')
    } catch (error) {
      throwApiError(error)
    }
  }

  /** #2 — validate / dry run (no Idempotency-Key). */
  async validate(file: File): Promise<BulkScheduledValidateResponse> {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiClient.post('/scheduled-payouts/bulk/validate', fd)
      return res.data.data
    } catch (error) {
      throwApiError(error)
    }
  }

  /** #3 — confirm/upload. 201 ⇒ terminal (sync); 202 ⇒ PROCESSING (poll). */
  async upload(file: File, idempotencyKey: string): Promise<BulkScheduledUploadResult> {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiClient.post('/scheduled-payouts/bulk', fd, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
      return { batch: res.data.data, async: res.status === 202 }
    } catch (error) {
      throwApiError(error)
    }
  }

  /** #4 — poll batch status + per-row detail. */
  async getBatch(id: string): Promise<BulkScheduledBatchDetailResponse> {
    try {
      const res = await apiClient.get(`/scheduled-payouts/bulk/${id}`)
      return res.data.data
    } catch (error) {
      throwApiError(error)
    }
  }

  /** #5 — download the result CSV (only once the batch is terminal). */
  async downloadResult(id: string): Promise<void> {
    try {
      const res = await apiClient.get<Blob>(`/scheduled-payouts/bulk/${id}/result`, {
        responseType: 'blob',
      })
      triggerBlobDownload(res.data, res.headers, `bulk-scheduled-payouts-${id}-result.csv`)
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const bulkScheduledPayoutsService = new BulkScheduledPayoutsService()
