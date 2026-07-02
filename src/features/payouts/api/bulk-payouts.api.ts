/**
 * Bulk Payouts API Service
 *
 * Two-step flow: validate (dry run) → upload (with Idempotency-Key) →
 * poll status → download result CSV. Base path /api/v1/payouts/bulk.
 */

import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'

import type {
  BulkBatchDetailResponse,
  BulkBatchResponse,
  BulkValidateResponse,
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

export interface BulkUploadResult {
  batch: BulkBatchResponse
  /** true ⇒ HTTP 202, batch is PROCESSING and must be polled. */
  async: boolean
}

class BulkPayoutsService {
  /** #1 — download the CSV/XLSX template. */
  async downloadTemplate(): Promise<void> {
    try {
      const res = await apiClient.get<Blob>('/payouts/bulk/template', { responseType: 'blob' })
      triggerBlobDownload(res.data, res.headers, 'bulk-payouts-template.csv')
    } catch (error) {
      throwApiError(error)
    }
  }

  /** #2 — validate / dry run (no Idempotency-Key). */
  async validate(file: File): Promise<BulkValidateResponse> {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiClient.post('/payouts/bulk/validate', fd)
      return res.data.data
    } catch (error) {
      throwApiError(error)
    }
  }

  /** #3 — confirm/upload. 201 ⇒ terminal (sync); 202 ⇒ PROCESSING (poll). */
  async upload(file: File, idempotencyKey: string): Promise<BulkUploadResult> {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiClient.post('/payouts/bulk', fd, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
      return { batch: res.data.data, async: res.status === 202 }
    } catch (error) {
      throwApiError(error)
    }
  }

  /** #4 — poll batch status + per-row detail. */
  async getBatch(id: string): Promise<BulkBatchDetailResponse> {
    try {
      const res = await apiClient.get(`/payouts/bulk/${id}`)
      return res.data.data
    } catch (error) {
      throwApiError(error)
    }
  }

  /** #5 — download the result CSV (only once the batch is terminal). */
  async downloadResult(id: string): Promise<void> {
    try {
      const res = await apiClient.get<Blob>(`/payouts/bulk/${id}/result`, { responseType: 'blob' })
      triggerBlobDownload(res.data, res.headers, `bulk-payouts-${id}-result.csv`)
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const bulkPayoutsService = new BulkPayoutsService()
