# ProofSight build state (as of 2026-11-25 13:05 WITA)

## On-chain identity (Concordium testnet)

- Identity: issued by the Concordium testnet identity provider; attributes held locally in `out/identity-object.json` (gitignored).
- HD seed: backed up in Instinct vault as "Concordium testnet seed (ProofSight)".
  Local copy: `secrets/seed.hex` (gitignored). Key derivation:
  `wallet.getAccountSigningKey(0, identityIndex=0, credNumber)`.

| Role | Account | credNumber |
| --- | --- | --- |
| seller (ProofSight owner) | `3YWKbsQVyV2QTJGLw8gsVyN6TJPvjyWoqfZxtybuWC9wDn2iei` | 0 |
| buyer (demo client) | `46MZRmiYH2uiEC5fAAnw4vto5PDzpKMLdxFo5aNLbKZdX2AXHC` | 1 |

Buyer is also a registered agent: token_id **1499**, badge
**`JyP9Y27twsq5YEYidFCan`**, status Active, card
`https://dannytungadi5.github.io/proofsight-agent/buyer-agent-card.json`
(hash pinned via setAgentURI tx
`430bd28295c76076990abaafaf69ac507e4ca0ef8033505ac8203f857145c644`;
register tx `e64c08ff312525871bd2d656d4fe6796076821880502894588ba3589e53d5877`).
check-badge = badge_valid true.

## Public name change (25 Nov 13:45 WITA)
User decision: public-facing name = **Septian Panjaya** everywhere (cards,
README, submission form). Provider field scrubbed in both cards; hashes
re-pinned: seller setAgentURI tx
`40814ff9ca212e30c9eb1176c8e902a75f05dc1e0b24c1129b2dd2dfeda55de0`, buyer
setAgentURI tx `f368867e22d5e6cb73a4ad0702aa5633bcf0246c529d2adb83548ea65d37164c`.
Both check-badge = badge_valid true after re-pin. Future git commits authored
as Septian Panjaya <dannytungadi5@gmail.com>. Note: the testnet identity
object itself was issued under the user's real name (immutable, not publicly
displayed by the badge).
| facilitator (fee sponsor) | `3CBmfAFQp4A3Twr3g81i8HGwPwpwQShLUwokqpu7ps9aPGAXZL` | 2 |

Account creation tx (seller): `0f4e14ca290802b6bbc272afe86b751440d5f65356bbdb375a1fa4ea7e86b3be`.
All three funded via testnet faucet (20,000 CCD each).

## Agent Registry (CIS-8004 testnet, contract `<12802,0>`)

- token_id **1493**, badge **`JyP9XuZ1MiqWZV82gCRTo`**, status Active.
- Register tx: `e65fa0c4c229ccc83239bb634e23b1f59f3fbd5fc653fe1795e7962dbceba0d8`.
- Card: `https://dannytungadi5.github.io/proofsight-agent/agent-card.json`
  (GitHub Pages from this repo, branch `main`; hash pinned on-chain via
  setAgentURI tx `a5f7c28bd38acdf4d87e7e64fe54c446d34ea77236aed149684af5a89450ed88`).
- `check-badge` = all 15 checks pass. **Rule: after every card change, push,
  wait for Pages, verify served sha256, then re-pin via
  `v1/build-set-agent-uri/<badge>?network=testnet&metadata_hash_hex=…&sender=…`
  and `node submit-update-contract.mjs out/seturi-spec.json out/seturi-tx.json`.**

## x402 E2E (working)

- `src/server.mjs` (seller, :3000): `/analyze` 402 → verify → settle → report + on-chain audit anchor (RegisterData).
- `src/facilitator.mjs` (:8402): self-hosted facilitator, sponsors fees.
- `scripts/buyer.mjs`: badge-checks seller, pays 1 CCD, prints report.
- `scripts/anchor-audit.mjs <sha256>`: manual anchor.
- `scripts/submit-update-contract.mjs` → actually `submit-update-contract.mjs` (repo root):
  signs + submits any MCP-built UpdateContract spec.

Verified payments (buyer → seller, 1.000000 CCD each, facilitator-sponsored):

| # | payment tx | audit anchor tx |
| --- | --- | --- |
| 1 | `b35613f9a835e3a5ce774fe417f0640d0ab260e71022c17ae3d8013494b6672f` | `4ee4ae672de8d8c4136b5519164c7fc5238084dff3382d85cd8221b855b941f4` |
| 2 | `18df66568dff32d0f272222b25410cc07c670217b339cc97b8d7e78e7dbe20e0` | `a2d3c5b42f8cc7a4…` (see `out/audit-log.json`) |
| 3 | `cf2689fab224402f7da5db6b5632afc5be93589248b8d30f19f825e8dda3884a` | report hash identical to payment 1 (deterministic demo data); re-anchored as `797de8304b8712cffe59392de2d95416a0a47e8606bb471885d1b04e23371672` |

Pipeline re-verified end-to-end 25 Nov 13:10 WITA (payment 3) after buyer
registration; buyer badge `JyP9Y27twsq5YEYidFCan` check-badge = badge_valid true.

## Public name change (25 Nov 13:45 WITA)
User decision: public-facing name = **Septian Panjaya** everywhere (cards,
README, submission form). Provider field scrubbed in both cards; hashes
re-pinned: seller setAgentURI tx
`40814ff9ca212e30c9eb1176c8e902a75f05dc1e0b24c1129b2dd2dfeda55de0`, buyer
setAgentURI tx `f368867e22d5e6cb73a4ad0702aa5633bcf0246c529d2adb83548ea65d37164c`.
Both check-badge = badge_valid true after re-pin. Future git commits authored
as Septian Panjaya <dannytungadi5@gmail.com>. Note: the testnet identity
object itself was issued under the user's real name (immutable, not publicly
displayed by the badge).

Explorer base: `https://ccdexplorer.io/testnet/transaction/<hash>`.

## Remaining work (in order)

1. ~~Register the buyer as a second agent~~ DONE (badge valid, hash pinned).
2. ~~README~~ DONE (architecture, evidence table, path to mainnet).
3. ~~Public deployment~~ DONE 25 Nov ~14:45 WITA: https://proofsight.pages.dev
   (Cloudflare Pages Direct Upload on the user's own account, pages.dev only;
   demo video embedded). Submitter name for the Encode Club form:
   Septian Panjaya. Public-facing name everywhere: Septian Panjaya.
4. Record demo video ≤3 min (badge check → 402 → pay → report → explorer +
   audit anchor). Upload (YouTube unlisted on dannytungadi5 Google, or Drive link).
5. Submit via Encode Club dashboard (registered 25 Nov 12:46). Deadline:
   **9 Dec 2026 23:59 UTC = 10 Dec 07:59 WITA**. Aim to submit 5–7 Dec.
6. Optional stretch: sponsored-transaction UX for buyers without CCD,
   MCP-server entry for ProofSight, PLT payment option.

## Hackathon facts

- Encode Club "Concordium Trusted Agents Hackathon"; submission needs: public
  repo, description, video ≤3 min, CCDExplorer link, path to mainnet.
- Workshops Mon/Wed 15:00 UTC (22:00 WITA). Judging 10–11 Dec.
- Encode Club account: dannytungadi5@gmail.com (password in vault).
