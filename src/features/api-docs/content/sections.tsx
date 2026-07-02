import { CodeBlock } from '../components/CodeBlock'
import { CodeTabs } from '../components/CodeTabs'
import { DocsHero } from '../components/DocsHero'
import {
  Callout,
  DocsH3,
  DocsP,
  DocsSection,
  DocsTable,
  DocsUl,
  Endpoint,
  InlineCode,
} from '../components/DocsSection'
import { PayoutPlayground } from '../components/PayoutPlayground'
import { generateCode, PAYOUT_BASE_URL } from '../lib/codegen'
import { DEFAULT_PAYOUT } from '../lib/samples'

const tokenResponse = `{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}`

const payoutPlaintext = `{
  "amount": 100.50,
  "payment_mode": "IMPS",
  "beneficiary_name": "John Doe",
  "beneficiary_account": "1234567890",
  "beneficiary_ifsc": "HDFC0001234",
  "bank_name": "HDFC Bank",
  "reference_id": "INV-2026-04-001",
  "remarks": "Invoice settlement"
}`

const payoutResponse = `{
  "transaction_id": "e64da5f7-70de-446c-bfda-af267fca1f00",
  "transaction_code": "lp-po-1S04X1X180400",
  "status": "INITIATED",
  "amount": 100.50,
  "fee": 0.0,
  "net_amount": 100.50,
  "currency": "INR",
  "payment_mode": "IMPS",
  "beneficiary": {
    "name": "John Doe",
    "account": "1234567890",
    "ifsc": "HDFC0001234",
    "bank_name": "HDFC Bank"
  },
  "reference_id": "INV-2026-04-001",
  "created_at": "2026-05-12T09:39:35.378048Z"
}`

const statusResponse = `{
  "transaction_id": "e64da5f7-70de-446c-bfda-af267fca1f00",
  "transaction_code": "lp-po-1S04X1X180400",
  "status": "SUCCESS",
  "amount": 100.50,
  "net_amount": 100.50,
  "currency": "INR",
  "payment_mode": "IMPS",
  "reference_id": "INV-2026-04-001",
  "external_ref": "UTR-202604121234567",
  "created_at": "2026-05-12T09:39:35Z",
  "updated_at": "2026-05-12T09:39:42Z"
}`

const balanceResponse = `{
  "wallets": [
    {
      "wallet_id": "8f1c7d2e-3b4a-4c5d-9e6f-0a1b2c3d4e5f",
      "wallet_code": "WALLET-VA-001",
      "provider_name": "Acme PSP",
      "currency": "INR",
      "balance": 15000.50,
      "hold_balance": 500.00,
      "available_balance": 14500.50,
      "status": "ACTIVE",
      "priority": 1
    }
  ]
}`

const encryptNode = `const crypto = require('crypto')

function encrypt(plaintext, saltKeyHex, apiKey) {
  const key = Buffer.from(saltKeyHex, 'hex')             // 32 bytes
  const nonce = crypto.randomBytes(12)                   // never reuse with the same key
  const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce, { authTagLength: 16 })
  cipher.setAAD(Buffer.from(apiKey, 'utf8'))             // raw api_key bytes
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return Buffer.concat([nonce, ct, cipher.getAuthTag()]).toString('base64')
}`

const encryptPython = `import os, base64, binascii
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def encrypt(plaintext: bytes, salt_key_hex: str, api_key: str) -> str:
    key   = binascii.unhexlify(salt_key_hex)            # 32 bytes
    nonce = os.urandom(12)                              # never reuse with the same key
    aad   = api_key.encode("utf-8")                     # raw api_key bytes, NOT hex-decoded
    ct    = AESGCM(key).encrypt(nonce, plaintext, aad)  # ciphertext ‖ tag
    return base64.b64encode(nonce + ct).decode()`

const webhookPayload = `{
  "event": "payout.succeeded",
  "delivery_id": "whd_3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "created_at": "2026-05-12T09:39:42Z",
  "data": {
    "transaction_id": "e64da5f7-70de-446c-bfda-af267fca1f00",
    "transaction_code": "lp-po-1S04X1X180400",
    "status": "SUCCESS",
    "amount": 100.50,
    "net_amount": 100.50,
    "currency": "INR",
    "payment_mode": "IMPS",
    "reference_id": "INV-2026-04-001",
    "external_ref": "UTR-202604121234567"
  }
}`

const webhookHeaders = `POST /your/webhook/endpoint HTTP/1.1
Content-Type: application/json
X-Settlor-Event: payout.succeeded
X-Settlor-Delivery: whd_3fa85f64-5717-4562-b3fc-2c963f66afa6
X-Settlor-Signature: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08`

const verifyNode = `const crypto = require('crypto')

// Verify a Settlor.Money webhook. Use the RAW request body — do NOT re-serialize the
// parsed JSON, or the signature will not match.
function verifyWebhook(rawBody, signatureHeader, saltKeyHex) {
  const expected = crypto
    .createHmac('sha256', Buffer.from(saltKeyHex, 'hex'))
    .update(rawBody)
    .digest('hex')
  const a = Buffer.from(signatureHeader || '', 'hex')
  const b = Buffer.from(expected, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Express: capture the raw body for signature verification
app.post('/webhooks/settlor', express.raw({ type: 'application/json' }), (req, res) => {
  if (!verifyWebhook(req.body, req.get('X-Settlor-Signature'), process.env.SETTLOR_SALT_KEY)) {
    return res.status(401).end()
  }
  const event = JSON.parse(req.body.toString('utf8'))
  // ... handle event.event / event.data, idempotent on event.delivery_id
  res.status(200).end()
})`

const verifyPython = `import hmac, hashlib, binascii

def verify_webhook(raw_body: bytes, signature_header: str, salt_key_hex: str) -> bool:
    expected = hmac.new(
        binascii.unhexlify(salt_key_hex), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header or "")

# Flask
@app.post("/webhooks/settlor")
def settlor_webhook():
    raw = request.get_data()  # raw bytes, not request.json
    if not verify_webhook(raw, request.headers.get("X-Settlor-Signature"), SALT_KEY):
        abort(401)
    event = request.get_json()
    # ... handle event["event"] / event["data"], idempotent on event["delivery_id"]
    return "", 200`

const initiateSamples = [
  { label: 'curl', lang: 'bash', code: generateCode('curl', DEFAULT_PAYOUT) },
  { label: 'Node.js', lang: 'javascript', code: generateCode('node', DEFAULT_PAYOUT) },
  { label: 'Python', lang: 'python', code: generateCode('python', DEFAULT_PAYOUT) },
]

const statusLifecycle = [
  { label: 'INITIATED', tone: 'bg-status-teal/15 text-status-teal border-status-teal/30' },
  { label: 'PROCESSING', tone: 'bg-status-orange/15 text-status-orange border-status-orange/30' },
  { label: 'SUCCESS', tone: 'bg-status-green/15 text-status-green border-status-green/30' },
  { label: 'FAILED', tone: 'bg-status-red/15 text-status-red border-status-red/30' },
  { label: 'REVERSED', tone: 'bg-status-dark/15 text-status-dark border-status-dark/30' },
]

export function PayoutDocsContent() {
  return (
    <>
      <DocsHero />

      <DocsSection id="overview" title="Overview">
        <DocsP>
          The Settlor.Money Payout API is a server-to-server integration for disbursing funds to
          bank beneficiaries. Every request uses a short-lived bearer token plus{' '}
          <strong>AES-256-GCM authenticated payload encryption</strong>. The flow is three steps:
          exchange your credentials for a token, then send encrypted payout and status requests.
        </DocsP>

        <DocsTable
          headers={['Property', 'Description']}
          rows={[
            [<strong key="b">Base URL</strong>, <InlineCode key="v">{PAYOUT_BASE_URL}</InlineCode>],
            [
              <strong key="b">Auth model</strong>,
              'API-Key + Secret-Key → bearer token (1 hour TTL)',
            ],
            [
              <strong key="b">Encryption</strong>,
              'AES-256-GCM (AEAD); fresh 12-byte nonce per call; base64(nonce ‖ ciphertext ‖ tag)',
            ],
            [<strong key="b">Currency</strong>, 'INR only'],
            [
              <strong key="b">Idempotency</strong>,
              <span key="v">
                <InlineCode>Idempotency-Key</InlineCode> header on payout init (strongly
                recommended)
              </span>,
            ],
            [<strong key="b">Rate limit</strong>, 'Per source IP, default 100 requests / minute'],
            [<strong key="b">Errors</strong>, 'Plain JSON, never encrypted'],
          ]}
        />

        <DocsH3>The flow</DocsH3>
        <DocsUl>
          <li>
            <strong>1. Token</strong> — <InlineCode>POST /merchant/auth/token</InlineCode> with your{' '}
            <InlineCode>X-API-Key</InlineCode> + <InlineCode>X-Secret-Key</InlineCode> headers
            returns a bearer token.
          </li>
          <li>
            <strong>2. Initiate</strong> — <InlineCode>POST /merchant/payouts</InlineCode> with the
            bearer token and an encrypted body returns an encrypted payout result.
          </li>
          <li>
            <strong>3. Status</strong> — <InlineCode>POST /merchant/payouts/status</InlineCode>{' '}
            polls the payout until it reaches a terminal state.
          </li>
          <li>
            <strong>Balance</strong> — <InlineCode>POST /merchant/payouts/balance</InlineCode>{' '}
            checks wallet balances any time (one wallet, or all of them).
          </li>
        </DocsUl>

        <Callout tone="info">
          <DocsP className="text-inherit">
            Your servers must be IP-allowlisted (<InlineCode>API_TRANSACTIONS</InlineCode>) and your
            credentials are valid for 90 days. Configure both in the merchant dashboard under
            Settings.
          </DocsP>
        </Callout>
      </DocsSection>

      <DocsSection id="authentication" title="Authentication">
        <Endpoint method="POST" path="/api/v1/merchant/auth/token" />
        <DocsP>
          The headers <InlineCode>X-API-Key</InlineCode> and <InlineCode>X-Secret-Key</InlineCode>{' '}
          <em>are</em> the authentication — no bearer token yet, no encryption. This is the
          bootstrap. No request body is required.
        </DocsP>
        <DocsH3>Response (200)</DocsH3>
        <CodeBlock code={tokenResponse} lang="json" />
        <DocsUl>
          <li>
            <InlineCode>token</InlineCode> — an HS256 JWT (
            <InlineCode>iss=&quot;merchant:api&quot;</InlineCode>, <InlineCode>mid</InlineCode> =
            merchant id). Send it as <InlineCode>Authorization: Bearer &lt;token&gt;</InlineCode> on
            every subsequent call.
          </li>
          <li>
            <InlineCode>expires_in</InlineCode> — seconds until expiry (default 3600). Cache the
            token; refresh on a 401 or proactively before it lapses.
          </li>
        </DocsUl>
        <DocsP>
          The credential row is re-validated on every request, so rotating or revoking keys
          invalidates outstanding tokens on their next call.
        </DocsP>
      </DocsSection>

      <DocsSection id="encryption" title="Encryption spec (AES-256-GCM)">
        <DocsP>
          Every payout and status body is an encrypted envelope. GCM is an authenticated cipher —
          the 16-byte tag is verified before decryption, and your <InlineCode>api_key</InlineCode>{' '}
          is bound in as the GCM <strong>AAD</strong> so a captured envelope cannot be replayed
          under a different credential.
        </DocsP>
        <DocsTable
          headers={['Parameter', 'Value']}
          rows={[
            ['Algorithm', 'AES-256-GCM (AEAD)'],
            [
              'Key',
              <span key="v">
                32 bytes — <InlineCode>hex.decode(salt_key)</InlineCode>
              </span>,
            ],
            ['Nonce', '12 random bytes per call (CSPRNG, never reused with the same key)'],
            ['Tag', '16 bytes, appended after the ciphertext'],
            [
              'AAD',
              <span key="v">
                your <InlineCode>api_key</InlineCode> as raw UTF-8 bytes (NOT hex-decoded)
              </span>,
            ],
            ['Wire format', <InlineCode key="v">base64(nonce ‖ ciphertext ‖ tag)</InlineCode>],
            ['Charset', 'Standard base64 (+, /, =) — NOT URL-safe'],
            ['Envelope', <InlineCode key="v">{`{"data": "<base64>"}`}</InlineCode>],
          ]}
        />
        <Callout tone="warning">
          <DocsUl>
            <li>
              <strong>Nonce reuse is catastrophic</strong> under GCM — always draw a fresh 12-byte
              nonce from a CSPRNG.
            </li>
            <li>
              <strong>Hex-decode the salt_key</strong> to 32 raw bytes before using it as the key.
            </li>
            <li>
              Use <strong>standard</strong> base64, not URL-safe. Keep{' '}
              <InlineCode>Content-Type: application/json</InlineCode> — the cipher lives inside the
              JSON.
            </li>
          </DocsUl>
        </Callout>
        <DocsH3>Reference implementation</DocsH3>
        <CodeTabs
          samples={[
            { label: 'Node.js', lang: 'javascript', code: encryptNode },
            { label: 'Python', lang: 'python', code: encryptPython },
          ]}
        />
        <DocsP>
          Want to see this run? The{' '}
          <a className="text-link underline" href="#playground">
            Playground
          </a>{' '}
          encrypts a payout body live in your browser and shows the exact wire envelope.
        </DocsP>
      </DocsSection>

      <DocsSection id="initiate-payout" title="Initiate a payout">
        <Endpoint method="POST" path="/api/v1/merchant/payouts" />
        <DocsP>
          Send the bearer token and an encrypted body. Include an{' '}
          <InlineCode>Idempotency-Key</InlineCode> header (UUID v4 recommended) so retries replay
          the cached result instead of double-disbursing.
        </DocsP>

        <DocsH3>Request fields (plaintext, before encryption)</DocsH3>
        <DocsTable
          headers={['Field', 'Type', 'Req', 'Notes']}
          rows={[
            ['amount', 'number', 'yes', 'INR major units, max 2 decimals, > 0'],
            ['payment_mode', 'string', 'yes', 'One of NEFT, IMPS, RTGS'],
            ['beneficiary_name', 'string', 'yes', '1–120 chars'],
            ['beneficiary_account', 'string', 'yes', '6–34 chars'],
            ['beneficiary_ifsc', 'string', 'yes', 'exactly 11 chars'],
            ['bank_name', 'string', 'yes', '1–120 chars'],
            ['beneficiary_address', 'string', 'no', '≤ 255 chars'],
            ['reference_id', 'string', 'no', '≤ 64 chars, unique per merchant (forever)'],
            ['remarks', 'string', 'no', '≤ 255 chars'],
            [
              'wallet_id',
              'string (UUID)',
              'no',
              'target a specific PAYOUT wallet; omit for smart routing',
            ],
          ]}
        />
        <CodeBlock code={payoutPlaintext} lang="json" label="plaintext payload" />

        <DocsH3>Response (201, decrypted)</DocsH3>
        <CodeBlock code={payoutResponse} lang="json" />

        <DocsH3>Status lifecycle</DocsH3>
        <div className="flex flex-wrap items-center gap-2">
          {statusLifecycle.map(s => (
            <span
              key={s.label}
              className={`rounded border px-2 py-0.5 font-mono text-xs font-semibold ${s.tone}`}
            >
              {s.label}
            </span>
          ))}
        </div>
        <DocsP>
          On <InlineCode>INITIATED</InlineCode> the funds are placed on HOLD.{' '}
          <InlineCode>SUCCESS</InlineCode> settles the debit; <InlineCode>FAILED</InlineCode> /{' '}
          <InlineCode>REVERSED</InlineCode> release the HOLD. A late{' '}
          <InlineCode>REVERSED</InlineCode> after <InlineCode>SUCCESS</InlineCode> is rare but
          possible — re-check status at T+1 for anything you credit downstream.
        </DocsP>

        <DocsH3>Full example</DocsH3>
        <CodeTabs samples={initiateSamples} />
      </DocsSection>

      <DocsSection id="check-status" title="Check payout status">
        <Endpoint method="POST" path="/api/v1/merchant/payouts/status" />
        <DocsP>
          Same auth and encryption as initiate (no <InlineCode>Idempotency-Key</InlineCode> —
          it&apos;s a read). The encrypted body wraps one of{' '}
          <InlineCode>{`{"transaction_id": "..."}`}</InlineCode> or{' '}
          <InlineCode>{`{"reference_id": "..."}`}</InlineCode>. If both are supplied,{' '}
          <InlineCode>transaction_id</InlineCode> wins.
        </DocsP>
        <DocsH3>Response (200, decrypted)</DocsH3>
        <CodeBlock code={statusResponse} lang="json" />
        <DocsP>
          <InlineCode>external_ref</InlineCode> is the PSP&apos;s UTR / NPCI reference — always
          present, but an empty string until the PSP settles. Poll no faster than every 5 seconds:{' '}
          5s, 10s, 30s, 60s, then once per minute until terminal.
        </DocsP>
      </DocsSection>

      <DocsSection id="check-balance" title="Check balance">
        <Endpoint method="POST" path="/api/v1/merchant/payouts/balance" />
        <DocsP>
          Same auth and encryption as the other calls (no <InlineCode>Idempotency-Key</InlineCode> —
          it&apos;s a read). The encrypted body wraps{' '}
          <InlineCode>{`{"wallet_code": "..."}`}</InlineCode> to fetch a single wallet, or an empty{' '}
          <InlineCode>{`{}`}</InlineCode> to return <strong>every</strong> active PAYOUT wallet
          assigned to your account. <InlineCode>wallet_code</InlineCode> is optional (max 64 chars).
        </DocsP>
        <DocsH3>Response (200, decrypted)</DocsH3>
        <CodeBlock code={balanceResponse} lang="json" />
        <DocsP>
          The response is always a <InlineCode>wallets</InlineCode> array (a single element when a{' '}
          <InlineCode>wallet_code</InlineCode> is supplied).{' '}
          <InlineCode>available_balance</InlineCode> is what you can spend now,{' '}
          <InlineCode>hold_balance</InlineCode> is reserved for in-flight payouts, and{' '}
          <InlineCode>balance</InlineCode> is the total (available + hold). All amounts are in
          rupees and <InlineCode>currency</InlineCode> is <InlineCode>INR</InlineCode>.
        </DocsP>
        <Callout tone="info">
          <DocsP className="text-inherit">
            An unknown <InlineCode>wallet_code</InlineCode> — or an account with no active PAYOUT
            wallet yet — returns <InlineCode>404 PAYOUT_WALLET_NOT_FOUND</InlineCode>.
          </DocsP>
        </Callout>
      </DocsSection>

      <DocsSection id="webhooks" title="Webhooks">
        <Callout tone="info">
          <DocsP className="text-inherit">
            <strong>Preview.</strong> Outbound webhooks are on the roadmap. Until they ship,
            reconcile by polling <InlineCode>/merchant/payouts/status</InlineCode> (re-check at T+1
            for anything you credit downstream). The event shape and signing below are the planned
            contract — build against them now and they&apos;ll light up without code changes.
          </DocsP>
        </Callout>

        <DocsP>
          When a payout reaches a terminal state, Settlor.Money will POST a signed JSON event to
          your configured endpoint so you don&apos;t have to poll. Events carry status fields only —
          never beneficiary PII.
        </DocsP>

        <DocsH3>Event types</DocsH3>
        <DocsTable
          headers={['Event', 'Fires when']}
          rows={[
            [
              <InlineCode key="e">payout.succeeded</InlineCode>,
              'Payout settled — funds left the wallet',
            ],
            [
              <InlineCode key="e">payout.failed</InlineCode>,
              'PSP rejected the payout — HOLD released',
            ],
            [
              <InlineCode key="e">payout.reversed</InlineCode>,
              'A settled payout was reversed (rare, ops-initiated)',
            ],
          ]}
        />

        <DocsH3>Delivery headers</DocsH3>
        <DocsTable
          headers={['Header', 'Notes']}
          rows={[
            [
              <InlineCode key="h">X-Settlor-Event</InlineCode>,
              'The event type, e.g. payout.succeeded',
            ],
            [
              <InlineCode key="h">X-Settlor-Delivery</InlineCode>,
              'Unique delivery id — dedupe on this (retries reuse it)',
            ],
            [
              <InlineCode key="h">X-Settlor-Signature</InlineCode>,
              'HMAC-SHA256 (hex) of the raw body, keyed with your salt_key',
            ],
          ]}
        />

        <DocsH3>Sample event</DocsH3>
        <CodeBlock code={webhookHeaders} lang="http" label="request" />
        <CodeBlock code={webhookPayload} lang="json" label="body" />

        <DocsH3>Verify the signature</DocsH3>
        <DocsP>
          Compute <InlineCode>HMAC-SHA256</InlineCode> over the <strong>raw</strong> request body
          (keyed with your <InlineCode>salt_key</InlineCode>) and compare it to{' '}
          <InlineCode>X-Settlor-Signature</InlineCode> in constant time. Reject with{' '}
          <InlineCode>401</InlineCode> on a mismatch, and never re-serialize the parsed JSON before
          hashing.
        </DocsP>
        <CodeTabs
          samples={[
            { label: 'Node.js', lang: 'javascript', code: verifyNode },
            { label: 'Python', lang: 'python', code: verifyPython },
          ]}
        />

        <DocsH3>Delivery semantics</DocsH3>
        <DocsUl>
          <li>Respond with a 2xx quickly (within ~5s); do heavy work asynchronously.</li>
          <li>
            Non-2xx or timeout is retried with exponential backoff — make your handler{' '}
            <strong>idempotent</strong> by keying on <InlineCode>delivery_id</InlineCode>.
          </li>
          <li>
            Treat status as advisory until verified — the{' '}
            <a className="text-link underline" href="#check-status">
              status endpoint
            </a>{' '}
            is always the source of truth.
          </li>
        </DocsUl>
      </DocsSection>

      <DocsSection id="playground" title="Playground">
        <DocsP>
          Build a payout request below and watch it become the encrypted wire envelope — all
          computed in your browser with the Web Crypto API. Nothing is sent anywhere; this is a
          learning tool for the encryption format and a generator for ready-to-run code.
        </DocsP>
        <PayoutPlayground />
      </DocsSection>

      <DocsSection id="errors" title="Error reference">
        <DocsP>
          All errors return plain JSON (never encrypted) in the standard envelope:{' '}
          <InlineCode>{`{ "success": false, "error": { "code": "...", "message": "..." } }`}</InlineCode>
        </DocsP>
        <DocsTable
          headers={['HTTP', 'Code', 'Meaning']}
          rows={[
            [
              '400',
              <InlineCode key="c">MERCHANT_PAYLOAD_ENCODING_INVALID</InlineCode>,
              'Body not JSON or missing the data field',
            ],
            [
              '400',
              <InlineCode key="c">MERCHANT_PAYLOAD_DECRYPTION_FAILED</InlineCode>,
              'Wrong key, tampered ciphertext, or rotated salt',
            ],
            [
              '400',
              <InlineCode key="c">VALIDATION_ERROR</InlineCode>,
              'A decrypted field failed validation',
            ],
            [
              '401',
              <InlineCode key="c">MERCHANT_AUTH_MISSING_HEADERS</InlineCode>,
              'X-API-Key or X-Secret-Key missing',
            ],
            [
              '401',
              <InlineCode key="c">MERCHANT_AUTH_INVALID_CREDENTIALS</InlineCode>,
              'Wrong api_key or secret-key',
            ],
            [
              '401',
              <InlineCode key="c">MERCHANT_AUTH_CREDENTIALS_REVOKED</InlineCode>,
              'Credential rotated / deactivated',
            ],
            [
              '401',
              <InlineCode key="c">MERCHANT_AUTH_CREDENTIALS_EXPIRED</InlineCode>,
              '90-day expiry passed',
            ],
            [
              '401',
              <InlineCode key="c">MERCHANT_AUTH_TOKEN_INVALID</InlineCode>,
              'Bearer token missing / malformed / expired',
            ],
            [
              '403',
              <InlineCode key="c">MERCHANT_API_IP_NOT_WHITELISTED</InlineCode>,
              'Source IP not in your allowlist',
            ],
            [
              '404',
              <InlineCode key="c">PAYOUT_WALLET_NOT_FOUND</InlineCode>,
              'No PAYOUT wallet — account not approved yet',
            ],
            [
              '404',
              <InlineCode key="c">PAYOUT_NOT_FOUND</InlineCode>,
              'No matching payout for this merchant',
            ],
            [
              '409',
              <InlineCode key="c">PAYOUT_WALLET_SUSPENDED</InlineCode>,
              'Wallet suspended or closed',
            ],
            [
              '409',
              <InlineCode key="c">PAYOUT_INSUFFICIENT_BALANCE</InlineCode>,
              'Selected wallet balance < net amount',
            ],
            [
              '409',
              <InlineCode key="c">INSUFFICIENT_WALLET_BALANCE</InlineCode>,
              'No eligible wallet (smart routing)',
            ],
            [
              '409',
              <InlineCode key="c">PAYOUT_WALLET_NOT_ELIGIBLE</InlineCode>,
              'Explicit wallet_id not eligible',
            ],
            [
              '409',
              <InlineCode key="c">PAYOUT_DUPLICATE_REFERENCE</InlineCode>,
              'reference_id already used',
            ],
            [
              '409',
              <InlineCode key="c">PAYOUT_IDEMPOTENCY_CONFLICT</InlineCode>,
              'Same Idempotency-Key, different payload',
            ],
            [
              '409',
              <InlineCode key="c">PAYOUT_CONCURRENT_UPDATE</InlineCode>,
              'Same key raced — retry after backoff',
            ],
            ['429', <InlineCode key="c">RATE_LIMIT_EXCEEDED</InlineCode>, 'Slow down'],
            ['500', <InlineCode key="c">INTERNAL_ERROR</InlineCode>, 'Server fault, retry later'],
          ]}
        />
      </DocsSection>

      <DocsSection id="pitfalls" title="Rate limits & common pitfalls">
        <DocsH3>Rate limits</DocsH3>
        <DocsP>
          A sliding-window limiter, keyed per source IP, allows 100 requests / minute across all{' '}
          <InlineCode>/api/v1/</InlineCode> endpoints. <InlineCode>X-RateLimit-*</InlineCode>{' '}
          headers are returned on every response so you can pace your client.
        </DocsP>
        <DocsH3>Common pitfalls</DocsH3>
        <DocsUl>
          <li>Don&apos;t reuse nonces — fresh CSPRNG nonce per encryption call.</li>
          <li>Standard base64, not URL-safe; hex-decode the salt_key to 32 bytes first.</li>
          <li>
            Pass <InlineCode>api_key</InlineCode> as raw UTF-8 for the AAD — it looks hex but is an
            opaque identifier.
          </li>
          <li>
            Always retry with the <strong>same</strong> <InlineCode>Idempotency-Key</InlineCode> —
            without it, retries can double-disburse.
          </li>
          <li>
            <InlineCode>reference_id</InlineCode> uniqueness is per-merchant and permanent, even for
            failed payouts.
          </li>
          <li>Token TTL is 1 hour — cache it; rotating keys invalidates in-flight tokens.</li>
          <li>The IP allowlist applies to the token endpoint too.</li>
        </DocsUl>
      </DocsSection>
    </>
  )
}
