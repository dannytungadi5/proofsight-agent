# ProofSight: verified agent-to-agent commerce on Concordium

ProofSight is an autonomous data-analysis agent that **sells its work to other
agents** over HTTP, paid per request in CCD with
[x402](https://docs.concordium.com/en/mainnet/technical-reference/agent-registry/x402-integration.html)
micropayments, with both sides carrying a **Verified by Concordium** badge from
the [Concordium Agent Registry](https://docs.concordium.com/en/mainnet/technical-reference/agent-registry/index.html)
(CIS-8004). Every report it delivers is hashed and the hash anchored on-chain,
so there is a tamper-proof, EU AI Act style audit record of what the agent
produced, for whom, and when.

Built by **Septian Panjaya** for the **Concordium Trusted Agents Hackathon** (Encode Club, Nov-Dec 2026).

## The flow

```
ProofSight Buyer (agent)                    ProofSight (seller agent)
badge JyP9Y27twsq5YEYidFCan                 badge JyP9XuZ1MiqWZV82gCRTo
        |                                            |
        | 1. look up seller in Agent Registry        |
        |    (CIS-8004 testnet <12802,0>)            |
        | 2. verify badge: Active status, verified   |
        |    human owner, card hash == on-chain hash |
        | 3. POST /analyze                           |
        |------------------------------------------->|
        |            4. HTTP 402 Payment Required    |
        |<-------------------------------------------|
        | 5. retry with signed x402 payment (1 CCD)  |
        |------------------------------------------->|
        |              facilitator verifies + settles|
        |              (sponsors network fees)       |
        | 6. 200 OK: analysis report                 |
        |    + on-chain audit anchor tx (report hash |
        |    written via RegisterData)               |
        |<-------------------------------------------|
```

1. The buyer discovers the seller's agent card and **verifies its Concordium
   badge** before trusting it: the registry confirms the agent NFT is Active,
   a verified human identity stands behind the owner account, and the served
   card's SHA-256 matches the hash pinned on-chain.
2. The buyer calls `POST /analyze` and gets `402 Payment Required` with an
   x402 payment requirement (1 CCD, Concordium testnet).
3. The buyer signs the payment with its Concordium account and retries.
4. A self-hosted **x402 facilitator** (`src/facilitator.mjs`,
   `@x402/concordium`) verifies and settles the payment on-chain, sponsoring
   the network fee, so the buyer only pays the 1 CCD price.
5. The seller returns the report and **anchors the report's SHA-256 on-chain**
   with a RegisterData transaction: a permanent audit record.

Both agents are registered CIS-8004 agents with valid badges, so the demo is
verified agent-to-agent commerce in both directions.

## Why Concordium

- **Accountable agents**: the Agent Registry badge ties each agent to an
  identity-verified owner, which is exactly what "trusted agents" need and
  what other chains don't offer natively.
- **Micropayments that make sense**: x402 scheme `exact` on Concordium settles
  a 1-CCD payment in seconds for a fraction of a cent, and the facilitator can
  sponsor fees so agents don't need gas management.
- **Compliance-ready audit trail**: RegisterData anchors give an EU AI Act
  style record-keeping trail for agent output with one cheap transaction.

## Live testnet evidence

Everything below is real, finalised Concordium testnet activity. Verify any
badge at `https://agent-registry-mcp.concordium.com/v1/badge-check/<badge>?network=testnet`.

| Item | Value |
| --- | --- |
| Seller agent (ProofSight) | token_id 1493, badge `JyP9XuZ1MiqWZV82gCRTo`, status Active |
| Seller agent card | https://dannytungadi5.github.io/proofsight-agent/agent-card.json (hash pinned on-chain) |
| Buyer agent (ProofSight Buyer) | token_id 1499, badge `JyP9Y27twsq5YEYidFCan`, status Active |
| Buyer agent card | https://dannytungadi5.github.io/proofsight-agent/buyer-agent-card.json (hash pinned on-chain) |
| Seller register tx | https://ccdexplorer.io/testnet/transaction/e65fa0c4c229ccc83239bb634e23b1f59f3fbd5fc653fe1795e7962dbceba0d8 |
| Buyer register tx | https://ccdexplorer.io/testnet/transaction/e64c08ff312525871bd2d656d4fe6796076821880502894588ba3589e53d5877 |
| x402 payment 1 (1 CCD) | https://ccdexplorer.io/testnet/transaction/b35613f9a835e3a5ce774fe417f0640d0ab260e71022c17ae3d8013494b6672f |
| Audit anchor for payment 1 | https://ccdexplorer.io/testnet/transaction/4ee4ae672de8d8c4136b5519164c7fc5238084dff3382d85cd8221b855b941f4 |
| x402 payment 2 (1 CCD) | https://ccdexplorer.io/testnet/transaction/18df66568dff32d0f272222b25410cc07c670217b339cc97b8d7e78e7dbe20e0 |
| x402 payments 3-5 + anchors | full table on the live site: https://proofsight.pages.dev/#evidence |
| x402 payment 6 (1 CCD, scenario 2 self-audit order) | https://ccdexplorer.io/testnet/transaction/0b32d6c59ff04067c332c9e3d00eb48b7815c16483cbd68856013cd74d8f4796 |
| Audit anchor for payment 6 (scenario 2 report hash) | https://ccdexplorer.io/testnet/transaction/274ca3604145f5ea40e2b786c86670e3b6ad21c070c1bf8960ed3ce95c90f3a9 |
| Accounts | seller `3YWKbsQVyV2QTJGLw8gsVyN6TJPvjyWoqfZxtybuWC9wDn2iei`, buyer `46MZRmiYH2uiEC5fAAnw4vto5PDzpKMLdxFo5aNLbKZdX2AXHC`, facilitator `3CBmfAFQp4A3Twr3g81i8HGwPwpwQShLUwokqpu7ps9aPGAXZL` (all derived from one identity-verified testnet account) |

## Repo layout

- `src/server.mjs`: the ProofSight seller. Express server on :3000. `POST
  /analyze` returns 402 + x402 requirements, then (after payment) the report,
  and fires the audit-anchor transaction. Uses `@x402/concordium` server
  helpers with a self-hosted facilitator.
- `src/facilitator.mjs`: self-hosted x402 facilitator on :8402 (verify +
  settle), sponsoring network fees from the facilitator account.
- `scripts/buyer.mjs`: the buyer agent. Checks the seller's badge via the
  Agent Registry, pays 1 CCD over x402, prints the report.
- `scripts/anchor-audit.mjs`: anchors any report hash on-chain (RegisterData).
- `submit-update-contract.mjs`: signs + submits any UpdateContract spec built
  by the Agent Registry MCP service (register, setAgentURI, ...).
- `agent-card.json`, `buyer-agent-card.json`: A2A agent cards with the
  Concordium badge extension, served via GitHub Pages and hash-pinned on-chain.

## Scenario 2: self-audit on real chain data

The second demo order uses no sample numbers: the buyer asks ProofSight to
analyse ProofSight's **own real on-chain activity**. `scripts/scenario-self-audit.mjs`
fetches the seller account's first 15 testnet transactions (faucet funding,
CIS-8004 registration, 5 x402 payments, audit anchors) from the public
wallet-proxy API - data anyone can re-fetch and verify on CCDExplorer - builds
the cadence series (seconds between consecutive actions), then buys the
analysis over x402 like any other order. The delivered report's SHA-256 is
anchored on-chain (see the evidence table), so the exact report that was sold
is permanently provable.

Findings from the real data: payment/anchor pairs settle 6-36 seconds apart
(median gap 56s), and the only anomalies (|z| > 2) are the pauses between
demo sessions.

```bash
node scripts/scenario-self-audit.mjs   # fetch real chain data -> badge check -> 402 -> pay 1 CCD -> report
```

## Run it yourself

Requirements: Node 20+, a Concordium testnet account with some CCD (faucet:
`https://wallet-proxy.testnet.concordium.com/v0/testnetGTUDrop/<address>`).

```bash
npm install
# secrets/seed.hex holds the HD seed (gitignored); out/account*.json map roles.
node src/facilitator.mjs &   # :8402
node src/server.mjs &        # :3000
node scripts/buyer.mjs       # badge check -> 402 -> pay 1 CCD -> report
node scripts/scenario-self-audit.mjs   # scenario 2: same flow on real chain data
```

## Path to mainnet

1. **The contracts already exist on mainnet.** The Agent Registry (CIS-8004),
   the CIS-8 key registry and the badge flow are Concordium platform
   infrastructure, deployed by Concordium on mainnet. Moving is a config
   change: `network: "mainnet"`, the mainnet CAIP-2 id, mainnet contract
   addresses from `contract_info`, and a mainnet identity (the same scripted
   identity flow works against the mainnet identity provider).
2. **Real economics are already correct.** The demo charges 1 CCD per report.
   On mainnet that is real revenue to the seller account; the facilitator
   sponsorship (~0.05 CCD/settle on testnet) is the seller's customer-
   acquisition cost and can be priced in.
3. **Identity is the differentiator we lean into.** Both agents are backed by
   an identity-verified human today on testnet; the same holds on mainnet,
   where it actually matters commercially (a buyer can require
   `badge_valid == true` before paying anything).
4. **Next steps beyond the demo**: buyer-side requirement of counterparty
   badges as a policy hook, dispute evidence from the audit anchors, and
   payment in a Concordium PLT stablecoin instead of CCD once available.

## Hackathon submission checklist

- [x] Public repo: https://github.com/dannytungadi5/proofsight-agent
- [x] Description: this README
- [x] CCDExplorer links: evidence table above
- [x] Working end-to-end demo: x402 payment + badge verification + audit anchor, all finalised on testnet
- [x] Path to mainnet: section above
- [x] Demo video (1 min 40 s): https://dannytungadi5.github.io/proofsight-agent/docs/proofsight-demo.mp4 and embedded on https://proofsight.pages.dev
