---
id: connectWithProof
name: Connect with Proof
summary: Open wallet modal requesting TonProof signature.
links:
  - title: Protocol Spec
    url: https://github.com/ton-blockchain/ton-connect/blob/main/requests-responses.md
---

## Purpose

Opens wallet connection modal with TonProof request attached.
Wallet will sign the challenge from Step 1.

## Request sent to wallet

```json
{
  "items": [
    { "name": "ton_addr" },
    { "name": "ton_proof", "payload": "<challenge_hash>" }
  ]
}
```

## Response from wallet

```json
{
  "account": { "address": "...", "publicKey": "..." },
  "connectItems": {
    "tonProof": {
      "proof": {
        "timestamp": 1234567890,
        "domain": { "value": "example.com" },
        "payload": "<original_challenge>",
        "signature": "<base64_ed25519_sig>"
      }
    }
  }
}
```

## Important

- Proof can ONLY be requested at connection time
- Cannot request proof after already connected
- If wallet doesn't support TonProof → error code 400
