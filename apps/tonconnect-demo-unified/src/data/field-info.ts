export interface FieldInfo {
  id: string
  name: string
  summary: string
  content: string
  links?: { title: string; url: string }[]
}

export const transactionFields: FieldInfo[] = [
  {
    id: "validUntil",
    name: "Valid Until",
    summary: "Unix timestamp (seconds) — deadline after which the transaction will be rejected.",
    content: `## How it works

**Wallet app level:**
- Shows countdown until expiration
- May reject if expired before user confirmation
- Can override this value with a smaller one for security

**Blockchain level (smart contract):**
- Wallet v2+ checks \`now() <= valid_until\`
- If expired → **exit code 35**
- Protection against replay attacks together with seqno

## Recommended values

**5 minutes** is the standard.

- Shorter — time-sensitive conditions (DEX swaps, limited offers)
- Longer — user needs time to review complex transactions

**Note:** This only affects acceptance of the first external message. Once accepted, all internal messages execute regardless of this value.

## Technical details

- Type: \`number\` (Unix seconds, not ms!)
- Required field
- SDK warns if > 5 minutes

\`\`\`ts
// Correct
validUntil: Math.floor(Date.now() / 1000) + 300

// Wrong (milliseconds!)
validUntil: Date.now() + 300000
\`\`\``,
    links: [
      { title: "TonConnect Spec", url: "https://github.com/ton-blockchain/ton-connect/blob/main/requests-responses.md" },
      { title: "Wallet Contracts", url: "https://docs.ton.org/v3/documentation/smart-contracts/contracts-specs/wallet-contracts" }
    ]
  },
  {
    id: "network",
    name: "Network",
    summary: "Network ID for sending the transaction.",
    content: `## Values
- \`-239\` — mainnet
- \`-3\` — testnet

## Behavior
If the network in the request doesn't match the connected wallet's network, the transaction will be blocked at the TonConnect level.

Field is optional — if not specified, the wallet's network is used.`,
  },
  {
    id: "from",
    name: "From",
    summary: "Sender address for the transaction.",
    content: `## When to use
Useful for wallets with multiple accounts — allows specifying a particular address for sending.

## Format
\`<workchain>:<hex>\`, for example:
- \`0:abc123...\` (basechain)
- \`-1:abc123...\` (masterchain)

Field is optional.`,
  },
  {
    id: "address",
    name: "Address",
    summary: "Recipient address in TON format.",
    content: `## Supported formats
- \`EQB...\` — user-friendly bounceable (mainnet)
- \`UQB...\` — user-friendly non-bounceable (mainnet)
- \`kQB...\` — user-friendly bounceable (testnet)
- \`0:abc...\` — raw format (workchain:hex)
- \`-1:abc...\` — masterchain address

## Bounceable vs Non-bounceable
- **Bounceable (EQ, kQ)** — if the contract doesn't exist, funds will be returned
- **Non-bounceable (UQ)** — funds will remain at the address even if there's no contract`,
    links: [{ title: "TON Addresses", url: "https://docs.ton.org/learn/overviews/addresses" }]
  },
  {
    id: "amount",
    name: "Amount",
    summary: "Transfer amount in nanotons.",
    content: `## Conversion
\`\`\`
1 TON = 1,000,000,000 nano (10^9)
0.1 TON = 100,000,000 nano
0.001 TON = 1,000,000 nano
\`\`\`

## Format
String with digits (not a number!). This avoids JavaScript precision issues for large values.

\`\`\`ts
// Correct
amount: "1000000000"

// Wrong
amount: 1000000000
\`\`\``,
  },
  {
    id: "payload",
    name: "Payload",
    summary: "Data for the smart contract in Base64 BOC format.",
    content: `## Use cases
- Text comments for transfers
- Jetton transfers (transfer#0f8a7ea5)
- NFT transfers
- Contract method calls

## Format
Base64-encoded BoC (Bag of Cells), starts with \`te6cc...\`

## Comment example
\`\`\`ts
import { beginCell } from '@ton/core'

const comment = beginCell()
  .storeUint(0, 32) // op code for comment
  .storeStringTail("Hello!")
  .endCell()

payload: comment.toBoc().toString('base64')
\`\`\``,
  },
  {
    id: "stateInit",
    name: "State Init",
    summary: "Contract initialization for deployment.",
    content: `## When to use
Only when deploying a new contract. Contains:
- **code** — smart contract code
- **data** — initial contract data

## Format
Base64-encoded BoC with StateInit structure.

## Important
For regular transfers, this field is not needed. Use only if you know exactly what you're doing.`,
  },
]

export const signDataFields: FieldInfo[] = [
  {
    id: "dataType",
    name: "Data Type",
    summary: "Data format for signing.",
    content: `## Types

**text** — readable text
- Wallet shows the text to the user
- Safe for the user

**binary** — arbitrary bytes
- Wallet shows a warning
- User doesn't see what they're signing
- Use only when text is not possible

**cell** — blockchain data
- Requires schema for parsing
- Wallet can display the structure`,
    links: [{ title: "Sign Data Spec", url: "https://github.com/ton-blockchain/ton-connect/blob/main/requests-responses.md#sign-data" }]
  },
  {
    id: "text",
    name: "Text",
    summary: "UTF-8 text for signing.",
    content: `The wallet will display this text to the user before signing. Use for:
- Authentication (proof of ownership)
- Action confirmation
- Message signing

Maximum length depends on the wallet.`,
  },
  {
    id: "bytes",
    name: "Bytes",
    summary: "Base64-encoded binary data.",
    content: `## Warning
The wallet will show the user a warning that they are signing opaque data.

Use only when:
- Data cannot be represented as text
- User understands what they're signing`,
  },
  {
    id: "schema",
    name: "Schema",
    summary: "TL-B schema of the cell structure.",
    content: `## Format
\`\`\`
message#_ text:string = Message;
transfer#0f8a7ea5 amount:Coins = Transfer;
\`\`\`

## Why needed
Allows the wallet to parse the cell and show the user its contents in a readable form.`,
    links: [{ title: "TL-B Format", url: "https://docs.ton.org/develop/data-formats/tl-b-language" }]
  },
  {
    id: "cell",
    name: "Cell",
    summary: "Base64 BOC with data for signing.",
    content: `## Requirements
- One root cell
- Must match the specified schema
- Format: Base64 (starts with \`te6cc...\`)

## Example
\`\`\`ts
import { beginCell } from '@ton/core'

const cell = beginCell()
  .storeUint(0x0f8a7ea5, 32) // op code
  .storeCoins(1000000000n)   // 1 TON
  .endCell()

cell: cell.toBoc().toString('base64')
\`\`\``,
    links: [{ title: "BoC Format", url: "https://docs.ton.org/develop/data-formats/cell-boc" }]
  },
]

const allFields = [...transactionFields, ...signDataFields]

export function getFieldInfo(fieldId: string): FieldInfo | undefined {
  return allFields.find(f => f.id === fieldId)
}
