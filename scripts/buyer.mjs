// ProofSight demo buyer agent: verifies the seller badge, pays 1 CCD via x402, prints the report.
import { ExactConcordiumScheme } from '@x402/concordium/exact/client';
import { AccountAddress } from '@concordium/web-sdk';
import { roleAccount, BADGE } from '../src/accounts.mjs';

const SELLER = process.env.SELLER_URL ?? 'http://localhost:3000';

// 1. Verify the seller's badge before paying anyone.
const check = await fetch(`https://agent-registry-mcp.concordium.com/v1/check-badge/${BADGE}?network=testnet`).then((r) => r.json());
console.log('seller badge_valid:', check.badge_valid, '| status:', check.on_chain?.status);
if (!check.badge_valid) throw new Error('seller badge invalid - refusing to pay');

// 2. Request the resource; expect 402 with payment requirements.
const order = { dataset: { topic: 'Daily CCD testnet transfer counts (sample)', series: [120, 135, 128, 141, 155, 149, 162, 171, 168, 180, 191, 187, 205, 199, 214, 230, 226, 241, 255, 263] } };
const r1 = await fetch(`${SELLER}/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(order) });
console.log('first response:', r1.status);
if (r1.status !== 402) throw new Error('expected 402');
const req402 = await r1.json();
const requirements = req402.accepts[0];
console.log('price:', requirements.amount, 'microCCD to', requirements.payTo.slice(0, 12) + '…', '| feePayer:', requirements.extra.feePayer.slice(0, 12) + '…');

// 3. Build and sign the sponsored payment as the buyer.
const buyer = roleAccount('buyer');
const client = new ExactConcordiumScheme({ accountAddress: AccountAddress.fromBase58(buyer.address), signer: buyer.signer });
const partial = await client.createPaymentPayload(2, requirements);
// attach the accepted requirements (scheme/network) so the facilitator can verify
partial.accepted = requirements;
partial.resource = req402.resource;

// 4. Retry with the payment.
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
