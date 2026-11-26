// Scenario 2 - self-audit on real chain data.
// The buyer orders an analysis of ProofSight's OWN real on-chain activity:
// every input number is a public Concordium testnet fact that anyone can
// re-fetch and verify (wallet-proxy + CCDExplorer). The dataset is pinned to
// the seller's first 15 transactions (up to block 51265518) so the analysis
// is reproducible; the report itself is sold over x402 and hash-anchored
// on-chain like any other order.
//
// Usage: node scripts/scenario-self-audit.mjs   (seller + facilitator running)
import { ExactConcordiumScheme } from '@x402/concordium/exact/client';
import { AccountAddress } from '@concordium/web-sdk';
import { roleAccount, BADGE } from '../src/accounts.mjs';

const SELLER = process.env.SELLER_URL ?? 'http://localhost:3000';
const SELLER_ACCOUNT = '3YWKbsQVyV2QTJGLw8gsVyN6TJPvjyWoqfZxtybuWC9wDn2iei';
const PIN_MAX_BLOCK = 51265518; // snapshot: the seller's first 15 on-chain actions
const PIN_COUNT = 15;

// 1. Build the dataset from real, public chain data (no keys needed).
const url = `https://wallet-proxy.testnet.concordium.com/v1/accTransactions/${SELLER_ACCOUNT}?order=asc&limit=50`;
const res = await fetch(url);
if (!res.ok) throw new Error(`wallet-proxy ${res.status}`);
const { transactions } = await res.json();
const pinned = transactions.filter((t) => t.blockHeight <= PIN_MAX_BLOCK).slice(0, PIN_COUNT);
if (pinned.length < PIN_COUNT) throw new Error(`expected ${PIN_COUNT} pinned txs, got ${pinned.length}`);
const deltas = pinned.slice(1).map((t, i) => Math.round(t.blockTime - pinned[i].blockTime));
console.log(`dataset: ${pinned.length} real txs from wallet-proxy, ${deltas.length} cadence deltas (s):`, deltas.join(', '));

const order = {
    dataset: {
        topic: "ProofSight's own on-chain cadence - seconds between consecutive transactions in its first 15 real testnet actions (x402 payments, audit anchors, registrations)",
        series: deltas,
    },
};

// 2. Verify the seller's badge before paying anyone.
const check = await fetch(`https://agent-registry-mcp.concordium.com/v1/check-badge/${BADGE}?network=testnet`).then((r) => r.json());
console.log('seller badge_valid:', check.badge_valid, '| status:', check.on_chain?.status);
if (!check.badge_valid) throw new Error('seller badge invalid - refusing to pay');

// 3. Request the analysis; expect 402 with payment requirements.
const r1 = await fetch(`${SELLER}/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(order) });
console.log('first response:', r1.status);
if (r1.status !== 402) throw new Error('expected 402');
const req402 = await r1.json();
const requirements = req402.accepts[0];
console.log('price:', requirements.amount, 'microCCD to', requirements.payTo.slice(0, 12) + '... | feePayer:', requirements.extra.feePayer.slice(0, 12) + '...');

// 4. Build and sign the sponsored payment as the buyer.
const buyer = roleAccount('buyer');
const client = new ExactConcordiumScheme({ accountAddress: AccountAddress.fromBase58(buyer.address), signer: buyer.signer });
const partial = await client.createPaymentPayload(2, requirements);
partial.accepted = requirements;
partial.resource = req402.resource;

// 5. Retry with the payment.
const header = Buffer.from(JSON.stringify(partial)).toString('base64');
const r2 = await fetch(`${SELLER}/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'payment-signature': header },
    body: JSON.stringify(order),
});
const out = await r2.json();
console.log('second response:', r2.status);
if (r2.status !== 200) {
    console.log(JSON.stringify(out));
    process.exit(1);
}
console.log('--- REPORT ---');
console.log(out.report);
console.log('--- SETTLEMENT ---');
console.log('txHash:', out.settlement.txHash);
console.log('explorer:', out.settlement.explorer);
console.log('reportSha256:', out.reportSha256);
console.log('auditAnchorTx:', out.settlement.auditAnchorTx);
console.log('auditAnchorExplorer:', out.settlement.auditAnchorExplorer);
