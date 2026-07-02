'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/core/utils'
import { CodeBlock } from './CodeBlock'
import { decryptEnvelope, encryptEnvelope, type EncryptResult } from '../lib/crypto'

interface EncryptionPreviewProps {
  apiKey: string
  saltKey: string
  /** Compact plaintext JSON the playground will encrypt. */
  plaintext: string
}

export function EncryptionPreview({ apiKey, saltKey, plaintext }: EncryptionPreviewProps) {
  const [result, setResult] = useState<EncryptResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Recompute the envelope (debounced) whenever creds or payload change. All
  // state updates happen inside the timeout callback (never synchronously in
  // the effect body) to avoid cascading renders.
  useEffect(() => {
    let active = true
    const handle = setTimeout(() => {
      if (!active) return
      if (!apiKey.trim() || !saltKey.trim()) {
        setResult(null)
        setError(null)
        return
      }
      encryptEnvelope({ plaintext, saltKeyHex: saltKey, apiKey })
        .then(r => {
          if (!active) return
          setResult(r)
          setError(null)
        })
        .catch((e: unknown) => {
          if (!active) return
          setResult(null)
          setError(e instanceof Error ? e.message : 'encryption failed')
        })
    }, 250)
    return () => {
      active = false
      clearTimeout(handle)
    }
  }, [apiKey, saltKey, plaintext])

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold tracking-wide uppercase">Plaintext</Label>
        <CodeBlock code={plaintext} lang="json" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold tracking-wide uppercase">Encrypted wire body</Label>
        {error ? (
          <p className="text-destructive bg-destructive/10 rounded-md border border-destructive/30 px-3 py-2 text-sm">
            {error}
          </p>
        ) : result ? (
          <>
            <CodeBlock code={`{ "data": "${result.envelope}" }`} lang="json" />
            <p className="text-muted-foreground font-mono text-xs">
              envelope = {result.lengths.nonce} (nonce) + {result.lengths.plaintext} (plaintext) +{' '}
              {result.lengths.tag} (tag) = {result.lengths.envelopeBytes} bytes
              <span className="text-status-green"> ✓</span>
            </p>
          </>
        ) : (
          <p className="text-muted-foreground bg-muted/40 rounded-md border border-dashed px-3 py-4 text-center text-sm">
            Enter an api_key and salt_key above to compute the envelope.
          </p>
        )}
      </div>

      <DecryptTester apiKey={apiKey} saltKey={saltKey} seed={result?.envelope} />
    </div>
  )
}

function DecryptTester({
  apiKey,
  saltKey,
  seed,
}: {
  apiKey: string
  saltKey: string
  seed?: string
}) {
  const [envelope, setEnvelope] = useState('')
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setOutput(null)
    setError(null)
    try {
      const text = await decryptEnvelope({
        envelope: envelope.trim(),
        saltKeyHex: saltKey,
        apiKey,
      })
      setOutput(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'decryption failed')
    }
  }

  const canRun = envelope.trim() !== '' && apiKey.trim() !== '' && saltKey.trim() !== ''

  return (
    <div className="border-foreground/15 bg-secondary min-w-0 space-y-2 rounded-lg border p-3">
      <Label className="text-xs font-semibold tracking-wide uppercase">
        Decrypt round-trip tester
      </Label>
      <p className="text-muted-foreground text-xs">
        Paste an envelope (your server&apos;s output, or the one above) and decrypt it with the
        current credentials.
      </p>
      <Textarea
        value={envelope}
        onChange={e => setEnvelope(e.target.value)}
        placeholder="base64(nonce ‖ ciphertext ‖ tag)"
        className="h-20 font-mono text-xs"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={run}
          disabled={!canRun}
          className="bg-button-bg text-primary-foreground hover:bg-button-bg/90"
        >
          Decrypt
        </Button>
        {seed ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEnvelope(seed)}
            title="Copy the envelope computed above into this tester"
          >
            Use envelope above
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : output ? (
        <div className={cn('space-y-1')}>
          <Label className="text-xs font-semibold tracking-wide uppercase">Decrypted</Label>
          <CodeBlock code={output} lang="json" />
        </div>
      ) : null}
    </div>
  )
}
