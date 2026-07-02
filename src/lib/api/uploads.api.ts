/**
 * Uploads API Service
 *
 * Implements the 3-step upload flow:
 *  1) POST /uploads/presign       — request a presigned URL
 *  2) PUT  <presigned URL>        — upload bytes directly to storage (no auth)
 *  3) POST /uploads/confirm       — finalize upload, returns the upload id
 */

import axios from 'axios'

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'

interface PresignRequest {
  filename: string
  content_type: string
  size: number
}

interface PresignResponse {
  success: boolean
  data: {
    upload_url: string
    file_key: string
    expires_in: number
  }
}

interface ConfirmResponse {
  success: boolean
  data: {
    id: string
    file_key: string
    filename: string
    content_type: string
    size: number
    url: string
    created_at: string
  }
}

export interface UploadedFile {
  id: string
  fileKey: string
  filename: string
  contentType: string
  size: number
  url: string
  createdAt: string
}

class UploadsService {
  async presign(body: PresignRequest): Promise<PresignResponse['data']> {
    try {
      const response = await apiClient.post<PresignResponse>('/uploads/presign', body)
      return response.data.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async confirm(fileKey: string): Promise<UploadedFile> {
    try {
      const response = await apiClient.post<ConfirmResponse>('/uploads/confirm', {
        file_key: fileKey,
      })
      const d = response.data.data
      return {
        id: d.id,
        fileKey: d.file_key,
        filename: d.filename,
        contentType: d.content_type,
        size: d.size,
        url: d.url,
        createdAt: d.created_at,
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * Full 3-step upload. Reports progress (0–100) of the PUT step via `onProgress`.
   */
  async uploadFile(file: File, onProgress?: (percent: number) => void): Promise<UploadedFile> {
    const contentType = file.type || 'application/octet-stream'

    const presigned = await this.presign({
      filename: file.name,
      content_type: contentType,
      size: file.size,
    })

    const rawAxios = axios.create({ transformRequest: [d => d] })

    try {
      await rawAxios.put(presigned.upload_url, file, {
        headers: { 'Content-Type': contentType },
        onUploadProgress: e => {
          if (!onProgress || !e.total) return
          onProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
    } catch (error) {
      throwApiError(error)
    }

    return this.confirm(presigned.file_key)
  }
}

export const uploadsService = new UploadsService()
