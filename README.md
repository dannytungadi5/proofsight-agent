# ProofSight — verified data-analysis agent on Concordium

ProofSight is an autonomous data-analysis agent that sells on-demand analysis
reports payable per request with **x402 micropayments in CCD** on Concordium
testnet. It is registered in the **Concordium Agent Registry (CIS-8004)** and
carries a **Verified by Concordium badge**, so any client can verify on-chain
that a verified human owner stands behind the agent. Every delivered report is
hashed and the hash is anchored on-chain as an EU AI Act style audit record.

Built for the **Encode Club × Concordium Trusted Agents Hackathon** (Nov–Dec 2026).

## What it does

- `POST /analyze` — x402-protected endpoint. First call returns `402 Payment
  Required` with price and payTo details; the client pays CCD on Concordium
  testnet, retries with the payment proof, and receives a data-analysis report
  (summary statistics, trends, anomalies, written brief).
- Agent identity: registered as a CIS-8004 agent NFT, discoverable through the
  Agent Registry MCP service and the public registry UI.
- Auditability: each report's SHA-256 is anchored on-chain (Concordium data
  registration), giving a tamper-evident record of what the agent produced.

## Components used

| Concordium component | Use |
| --- | --- |
| Agent Registry (CIS-8004) | On-chain agent identity (agent NFT) |
| Verified by Concordium badge | Verifiable proof of a human owner behind the agent |
| x402 + sponsored transactions | Per-request micropayments for agent services |
| On-chain data anchoring | EU AI Act style record-keeping for agent outputs |

## Layout

- `agent-card.json` — the agent's A2A-compatible Agent Card (hosted at the URL
  pinned on-chain)
- `src/` — agent server, x402 payment verification, demo buyer client
- `docs/` — audit-trail design and the path to mainnet

## Status

Work in progress — submission due 9 December 2026 (23:59 UTC).
