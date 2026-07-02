/**
 * Generates copy-paste integration snippets (curl / Node.js / Python) for the
 * Payout API from the playground's current form values.
 *
 * The generated code reads credentials from environment variables — it never
 * embeds the salt_key — and mirrors the reference examples in
 * settlor-backend/docs/integrations/merchant-api.md.
 */

export const PAYOUT_BASE_URL = 'https://api.settlor.money/api/v1'

export type CodeLang = 'curl' | 'node' | 'python'

/** The decrypted payout-initiation plaintext (before encryption). */
export interface PayoutPayload {
  amount: number
  payment_mode: 'NEFT' | 'IMPS' | 'RTGS'
  beneficiary_name: string
  beneficiary_account: string
  beneficiary_ifsc: string
  bank_name: string
  beneficiary_address?: string
  reference_id?: string
  remarks?: string
  wallet_id?: string
}

/** Build the canonical compact JSON the SDKs encrypt (stable key order, no spaces). */
export function payloadToCompactJson(payload: PayoutPayload): string {
  const ordered: Record<string, unknown> = {
    amount: payload.amount,
    payment_mode: payload.payment_mode,
    beneficiary_name: payload.beneficiary_name,
    beneficiary_account: payload.beneficiary_account,
    beneficiary_ifsc: payload.beneficiary_ifsc,
    bank_name: payload.bank_name,
  }
  if (payload.beneficiary_address) ordered.beneficiary_address = payload.beneficiary_address
  if (payload.reference_id) ordered.reference_id = payload.reference_id
  if (payload.remarks) ordered.remarks = payload.remarks
  if (payload.wallet_id) ordered.wallet_id = payload.wallet_id
  return JSON.stringify(ordered)
}

/** Pretty (indented) JSON for the read-only plaintext preview. */
export function payloadToPrettyJson(payload: PayoutPayload): string {
  return JSON.stringify(JSON.parse(payloadToCompactJson(payload)), null, 2)
}

function nodeSnippet(payload: PayoutPayload): string {
  const body = payloadToPrettyJson(payload)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `  ${line}`))
    .join('\n')
  return `const crypto = require('crypto')

const BASE_URL = '${PAYOUT_BASE_URL}'
const API_KEY = process.env.SETTLOR_API_KEY
const SALT_KEY = process.env.SETTLOR_SALT_KEY // 64-char hex

function encrypt(plaintext) {
  const key = Buffer.from(SALT_KEY, 'hex') // 32 bytes
  const nonce = crypto.randomBytes(12) // never reuse with the same key
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce, { authTagLength: 16 })
  cipher.setAAD(Buffer.from(API_KEY, 'utf8')) // raw api_key bytes
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return Buffer.concat([nonce, ct, cipher.getAuthTag()]).toString('base64')
}

function decrypt(envelopeB64) {
  const key = Buffer.from(SALT_KEY, 'hex')
  const blob = Buffer.from(envelopeB64, 'base64')
  const nonce = blob.subarray(0, 12)
  const tag = blob.subarray(blob.length - 16)
  const ct = blob.subarray(12, blob.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce, { authTagLength: 16 })
  decipher.setAAD(Buffer.from(API_KEY, 'utf8'))
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}

async function main() {
  // 1) Exchange credentials for a bearer token (1 hour TTL)
  const tokenRes = await fetch(\`\${BASE_URL}/merchant/auth/token\`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY, 'X-Secret-Key': SALT_KEY },
  })
  const token = (await tokenRes.json()).data.token

  // 2) Initiate the payout (encrypted body)
  const payload = ${body}
  const res = await fetch(\`\${BASE_URL}/merchant/payouts\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${token}\`,
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({ data: encrypt(JSON.stringify(payload)) }),
  })
  const body = await res.json()
  if (!body.success) throw new Error(\`\${body.error.code}: \${body.error.message}\`)
  console.log(JSON.parse(decrypt(body.data.data)))
}

main().catch(console.error)`
}

function pythonSnippet(payload: PayoutPayload): string {
  const body = payloadToPrettyJson(payload)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')
  return `import os, json, uuid, base64, binascii, requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

BASE_URL = "${PAYOUT_BASE_URL}"
API_KEY = os.environ["SETTLOR_API_KEY"]
SALT_KEY = os.environ["SETTLOR_SALT_KEY"]  # 64-char hex


def encrypt(plaintext: bytes) -> str:
    key = binascii.unhexlify(SALT_KEY)        # 32 bytes
    nonce = os.urandom(12)                     # never reuse with the same key
    aad = API_KEY.encode("utf-8")              # raw api_key bytes
    ct = AESGCM(key).encrypt(nonce, plaintext, aad)
    return base64.b64encode(nonce + ct).decode()


def decrypt(envelope_b64: str) -> bytes:
    key = binascii.unhexlify(SALT_KEY)
    aad = API_KEY.encode("utf-8")
    blob = base64.b64decode(envelope_b64)
    return AESGCM(key).decrypt(blob[:12], blob[12:], aad)


# 1) Exchange credentials for a bearer token (1 hour TTL)
token = requests.post(
    f"{BASE_URL}/merchant/auth/token",
    headers={"X-API-Key": API_KEY, "X-Secret-Key": SALT_KEY},
).json()["data"]["token"]

# 2) Initiate the payout (encrypted body)
payload = ${body}
body = {"data": encrypt(json.dumps(payload, separators=(",", ":")).encode())}
res = requests.post(
    f"{BASE_URL}/merchant/payouts",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Idempotency-Key": str(uuid.uuid4()),
    },
    json=body,
).json()
if not res["success"]:
    raise RuntimeError(f'{res["error"]["code"]}: {res["error"]["message"]}')
print(json.loads(decrypt(res["data"]["data"])))`
}

function curlSnippet(payload: PayoutPayload): string {
  const compact = payloadToCompactJson(payload).replace(/'/g, `'\\''`)
  return `# Requires python3 + 'pip install cryptography' for the AEAD helpers.
API_KEY="<your api_key>"
SALT_KEY="<your salt_key>"     # 64-char hex
BASE_URL="${PAYOUT_BASE_URL}"

# 1) Token
TOKEN=$(curl -s -X POST "$BASE_URL/merchant/auth/token" \\
  -H "X-API-Key: $API_KEY" -H "X-Secret-Key: $SALT_KEY" \\
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['token'])")

# Helper: encrypt stdin -> base64 envelope
enc() {
  API_KEY="$API_KEY" SALT_KEY="$SALT_KEY" python3 -c '
import os, sys, base64, binascii
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
key = binascii.unhexlify(os.environ["SALT_KEY"])
aad = os.environ["API_KEY"].encode()
nonce = os.urandom(12)
ct = AESGCM(key).encrypt(nonce, sys.stdin.buffer.read(), aad)
sys.stdout.write(base64.b64encode(nonce + ct).decode())'
}

# 2) Initiate the payout
PAYLOAD='${compact}'
ENVELOPE=$(printf '%s' "$PAYLOAD" | enc)
curl -s -X POST "$BASE_URL/merchant/payouts" \\
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d "{\\"data\\":\\"$ENVELOPE\\"}" | python3 -m json.tool`
}

export function generateCode(lang: CodeLang, payload: PayoutPayload): string {
  switch (lang) {
    case 'node':
      return nodeSnippet(payload)
    case 'python':
      return pythonSnippet(payload)
    case 'curl':
      return curlSnippet(payload)
  }
}

export const CODE_LANG_META: Record<CodeLang, { label: string; shiki: string }> = {
  curl: { label: 'curl', shiki: 'bash' },
  node: { label: 'Node.js', shiki: 'javascript' },
  python: { label: 'Python', shiki: 'python' },
}
