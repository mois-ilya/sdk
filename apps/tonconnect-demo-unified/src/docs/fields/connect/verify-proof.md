---
id: verifyProof
name: Verify Proof
summary: Backend cryptographic verification of wallet signature.
links:
  - title: Verification Algorithm
    url: https://docs.ton.org/v3/guidelines/ton-connect/guidelines/ton-proof#how-to-check-ton-proof-on-server-side
---

## Purpose

Backend verifies the Ed25519 signature to confirm wallet ownership.
All 6 checks must pass.

## Verification checks

| # | Check | What it verifies |
|---|-------|------------------|
| 1 | Public key | Matches wallet's StateInit |
| 2 | Address | Hash of StateInit matches address |
| 3 | Domain | In allowed domains list |
| 4 | Timestamp | Within 15 minute window |
| 5 | Payload | Matches original challenge |
| 6 | Signature | Valid Ed25519 signature |

## Signature verification

```
fullMessage = 0xffff || "ton-connect" || sha256(message)
valid = ed25519.verify(signature, sha256(fullMessage), publicKey)
```

## On success

Backend issues auth token (JWT, session, etc.) for subsequent API calls.

## On failure

- Do not reveal which check failed (security)
- Return generic "verification failed" error
- Log details server-side for debugging
