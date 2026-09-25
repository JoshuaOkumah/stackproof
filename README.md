# StackProof

**Prove it. Put it on-chain.** StackProof is a small full-stack Stacks dApp where anyone can publish a short on-chain proof of something they built. Every proof is stored in a Clarity contract on the Stacks testnet and displayed in a clean, responsive web UI.

Built with [Scaffold Stacks](https://scaffoldstacks.mintlify.app/) (`stacksdapp`).

## Features

- **On-chain proofs** — `submit-proof` stores `(author, content, timestamp)` and returns a sequential proof id.
- **Read-only queries** — `get-proof` (by id) and `get-total-proofs`.
- **Wallet publishing** — connect Leather/Xverse, approve one `stx_callContract` transaction.
- **Live proof board** — newest-first list read directly from the chain (no backend, no database).
- **Input validation** — empty content rejected, content longer than 280 characters rejected, both with dedicated error codes.

## Repository layout

```
contracts/
  contracts/stackproof.clar   # Clarity contract (source of truth)
  tests/stackproof.test.ts    # 13 vitest tests (simnet)
  settings/                   # deployer settings (mnemonics go here, never committed)
frontend/
  src/app/                    # Next.js app router pages + theme
  src/components/             # Header, SubmitProof, ProofBoard, wallet
  src/generated/              # generated bindings (never edit by hand)
  src/lib/proofs.ts           # Clarity-value parsing helpers
  .env.local                  # NEXT_PUBLIC_NETWORK=testnet
```

## Prerequisites

- Node.js 20+
- [Clarinet](https://clarinet.xyz/) and the Stacks CLI — or use `stacksdapp doctor` to verify your setup
- A Stacks wallet (Leather or Xverse) on **testnet**

## Quickstart

```bash
npm install                # root: contracts workspace deps
npm install --prefix frontend

stacksdapp doctor          # verify toolchain
stacksdapp check           # type-check Clarity
stacksdapp test            # contract tests + frontend tests
stacksdapp generate        # regenerate TS bindings
stacksdapp dev --network testnet   # frontend on http://localhost:3000
```

### Run only parts

```bash
npm test --prefix contracts    # contract tests
npm run typecheck --prefix frontend
npm run build --prefix frontend
```

## Contract API (`SP...testnet` placeholder until deployed)

```clarity
(submit-proof (content (string-utf8 280)))  ;; -> (response uint uint)
(get-proof (id uint))                       ;; -> (optional (tuple ...))
(get-total-proofs)                          ;; -> uint
```

| Error | Code | Meaning |
| --- | --- | --- |
| `ERR-EMPTY-CONTENT` | `u100` | content is `u0` bytes |
| `ERR-CONTENT-TOO-LONG` | `u101` | content exceeds 280 bytes |

Each successful submission stores `tx-sender` and `stacks-block-height` as the timestamp, then increments `next-proof-id`.

## Design decisions

- **One accent color** (`#C2410C`) on a light `#FAFAF9` stone palette; no gradients, no glassmorphism.
- **Contract is the source of truth** — the board is rebuilt from `get-total-proofs` + `get-proof` calls; nothing is stored client-side except transient UI state.
- **Honest states** — pending / success / error are distinguished; explorer links only appear with a real transaction id.
- **Accessibility** — labels on inputs, `role="status"`/`role="alert"` on feedback, visible focus rings, AA contrast on text.

### Clarity 6 adaptations

- `block-height` was renamed to **`stacks-block-height`** in Clarity 6 (epoch 4.0); the contract uses the new name.
- Error constants use the contract's specified hyphenated names (`ERR-EMPTY-CONTENT`); Clarity accepts them, the checker only notes them.
- The proofs map key is a single-field tuple `(tuple (id uint))` — the checker flags this as an unnecessary tuple; it is kept for forward compatibility with multi-field keys.

## Verification (run locally)

| Command | Result |
| --- | --- |
| `stacksdapp check` | 1 contract checked, 0 errors, 1 intentional warning |
| `stacksdapp test` | 13/13 contract tests pass; frontend tests pass |
| `npm run typecheck --prefix frontend` | clean |
| `npm run build --prefix frontend` | Next.js production build succeeds |
| dev-server smoke test | page renders header, hero, form, board states |

## Testnet deployment

Deployments require a funded testnet deployer and are performed explicitly (never automatically):

1. Add your testnet deployer mnemonic to `contracts/settings/Testnet.toml` (keep it out of git).
2. Fund the deployer at the [Hiro testnet faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet).
3. `stacksdapp deploy --network testnet --yes`
4. `stacksdapp generate` — refreshes `frontend/src/generated/deployments.json` with the real contract id.
5. Rebuild/redeploy the frontend (`NEXT_PUBLIC_NETWORK=testnet`).

**Contract address:** _pending — filled in after testnet deployment._

## Frontend deployment (Vercel)

- Root directory: `frontend`
- Environment: `NEXT_PUBLIC_NETWORK=testnet` (see `frontend/.env.local.example`)
- Optional: `NEXT_PUBLIC_STACKS_NODE_URL`, `NEXT_PUBLIC_HIRO_API_KEY`
- No secrets belong in the frontend — signing happens in the user's wallet.

## Security notes

- No private keys or mnemonics in this repository; `contracts/settings/*.toml` for real networks must stay uncommitted.
- Post-conditions are set to `allow` for the single `submit-proof` call (no STX moves, only a contract call), so the user's tokens cannot be moved by this dApp.
