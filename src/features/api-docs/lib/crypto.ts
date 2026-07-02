/**
 * Browser-side AES-256-GCM helpers that mirror the Settlor.Money Merchant Payout API
 * envelope exactly (see settlor-backend/docs/integrations/merchant-api.md):
 *
 *   key   = hex-decode(salt_key)            // 32 bytes
 *   nonce = 12 random bytes (CSPRNG)        // fresh per call, never reused
 *   aad   = api_key as raw UTF-8 bytes      // NOT hex-decoded
 *   wire  = base64(nonce ‖ ciphertext ‖ tag[16])   // standard base64
 *   body  = { "data": "<wire>" }
 *
 * Everything here runs in the browser via Web Crypto and never leaves the tab.
 * This is a learning/preview tool — production salt_keys must never be pasted
 * into a browser.
 */

const TAG_LENGTH_BITS = 128 // 16-byte GCM tag, appended to the ciphertext
const NONCE_BYTES = 12

export function utf8Encode(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

export function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

/** Decode a hex string (e.g. a 64-char salt_key) to raw bytes. */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim()
  if (clean.length === 0) throw new Error('value is empty')
  if (clean.length % 2 !== 0) throw new Error('hex must have an even length')
  if (!/^[0-9a-fA-F]+$/.test(clean)) throw new Error('hex contains non-hex characters')
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Standard base64 (with +, /, = padding) — NOT URL-safe. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.trim())
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

async function importAesKey(saltKeyHex: string): Promise<CryptoKey> {
  const raw = hexToBytes(saltKeyHex)
  if (raw.length !== 32) {
    throw new Error(`salt_key must decode to 32 bytes (got ${raw.length}) — expected 64 hex chars`)
  }
  return crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ])
}

export interface EncryptResult {
  /** base64(nonce ‖ ciphertext ‖ tag) — the value that goes in `{ "data": ... }`. */
  envelope: string
  /** Hex of the 12-byte nonce, for the teaching panel. */
  nonceHex: string
  /** Byte-length breakdown for the envelope-length assertion. */
  lengths: { nonce: number; plaintext: number; tag: number; envelopeBytes: number }
}

export interface EnvelopeInputs {
  plaintext: string
  saltKeyHex: string
  apiKey: string
}

/** Encrypt a plaintext string into the wire envelope. */
export async function encryptEnvelope({
  plaintext,
  saltKeyHex,
  apiKey,
}: EnvelopeInputs): Promise<EncryptResult> {
  const key = await importAesKey(saltKeyHex)
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES))
  const plaintextBytes = utf8Encode(plaintext)
  const ciphertextWithTag = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce.buffer as ArrayBuffer,
        additionalData: utf8Encode(apiKey).buffer as ArrayBuffer,
        tagLength: TAG_LENGTH_BITS,
      },
      key,
      plaintextBytes.buffer as ArrayBuffer,
    ),
  )
  const blob = concatBytes(nonce, ciphertextWithTag)
  return {
    envelope: bytesToBase64(blob),
    nonceHex: bytesToHex(nonce),
    lengths: {
      nonce: NONCE_BYTES,
      plaintext: plaintextBytes.length,
      tag: TAG_LENGTH_BITS / 8,
      envelopeBytes: blob.length,
    },
  }
}

/** Decrypt a wire envelope back to plaintext. Throws on tag mismatch. */
export async function decryptEnvelope({
  envelope,
  saltKeyHex,
  apiKey,
}: {
  envelope: string
  saltKeyHex: string
  apiKey: string
}): Promise<string> {
  const key = await importAesKey(saltKeyHex)
  const blob = base64ToBytes(envelope)
  if (blob.length < NONCE_BYTES + 16) {
    throw new Error('envelope too short — must be at least 12 (nonce) + 16 (tag) bytes')
  }
  const nonce = blob.slice(0, NONCE_BYTES)
  const ciphertextWithTag = blob.slice(NONCE_BYTES)
  try {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce.buffer as ArrayBuffer,
        additionalData: utf8Encode(apiKey).buffer as ArrayBuffer,
        tagLength: TAG_LENGTH_BITS,
      },
      key,
      ciphertextWithTag.buffer as ArrayBuffer,
    )
    return utf8Decode(new Uint8Array(plaintext))
  } catch {
    throw new Error(
      'decryption failed — check that salt_key, api_key (AAD) and the base64 envelope all match',
    )
  }
}

/** Generate a random hex string of `byteLength` bytes (for sample credentials). */
export function randomHex(byteLength: number): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(byteLength)))
}
