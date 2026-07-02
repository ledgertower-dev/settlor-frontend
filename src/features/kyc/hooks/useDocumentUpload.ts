'use client'

import { useState, useRef, useCallback } from 'react'
import { kycService } from '../api/kyc.api'
import { getErrorMessage } from '@/lib/api/error-handler'
import type { DocUploadState } from '../types'

export function useDocumentUpload(token: string | null) {
  const [docUploads, setDocUploads] = useState<Record<string, DocUploadState>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleFileSelect = useCallback(
    async (docType: string, file: File) => {
      if (!token) return

      setDocUploads(prev => ({
        ...prev,
        [docType]: { file, uploadId: null, status: 'presigning', progress: 0, error: null },
      }))

      try {
        setDocUploads(prev => ({
          ...prev,
          [docType]: { ...prev[docType], status: 'uploading' },
        }))

        const uploadId = await kycService.uploadDocument(token, file, percent => {
          setDocUploads(prev => ({
            ...prev,
            [docType]: { ...prev[docType], progress: percent },
          }))
        })

        setDocUploads(prev => ({
          ...prev,
          [docType]: { ...prev[docType], uploadId, status: 'done', progress: 100 },
        }))
      } catch (err) {
        setDocUploads(prev => ({
          ...prev,
          [docType]: {
            ...prev[docType],
            status: 'error',
            error: getErrorMessage(err),
          },
        }))
      }
    },
    [token],
  )

  const handleFileRemove = useCallback((docType: string) => {
    setDocUploads(prev => {
      const next = { ...prev }
      delete next[docType]
      return next
    })
    const input = fileInputRefs.current[docType]
    if (input) input.value = ''
  }, [])

  const handleRetry = useCallback(
    (docType: string) => {
      const existing = docUploads[docType]
      if (existing?.file) {
        handleFileSelect(docType, existing.file)
      }
    },
    [docUploads, handleFileSelect],
  )

  const isAnyUploading = Object.values(docUploads).some(
    s => s.status === 'presigning' || s.status === 'uploading' || s.status === 'confirming',
  )

  const triggerFileInput = useCallback((docType: string) => {
    fileInputRefs.current[docType]?.click()
  }, [])

  const setFileInputRef = useCallback((docType: string, el: HTMLInputElement | null) => {
    fileInputRefs.current[docType] = el
  }, [])

  return {
    docUploads,
    isAnyUploading,
    handleFileSelect,
    handleFileRemove,
    handleRetry,
    triggerFileInput,
    setFileInputRef,
  }
}
