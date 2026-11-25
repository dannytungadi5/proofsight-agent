// Anchor an audit record on-chain: RegisterData with the report's SHA-256.
// Usage: node scripts/anchor-audit.mjs <reportSha256-hex>
import * as ccd from '@concordium/web-sdk';
import { roleAccount, grpcClient } from '../src/accounts.mjs';
import fs from 'node:fs';

const hashHex = process.argv[2];
if (!/^[0-9a-f]{64}$/.test(hashHex ?? '')) throw new Error('need 64-char hex report hash');

const seller = roleAccount('seller');
const client = grpcClient();
const sender = ccd.AccountAddress.fromBase58(seller.address);
const { nonce } = await client.getNextAccountNonce(sender);

const transaction = {
    header: {
        expiry: ccd.TransactionExpiry.fromDate(new Date(Date.now() + 3600000)),
        nonce,
        sender,
    },
    payload: { data: new ccd.DataBlob(hashHex) },
    type: ccd.AccountTransactionType.RegisterData,
};
const signature = await ccd.signTransaction(transaction, seller.signer);
const txHash = await client.sendAccountTransaction(transaction, signature);
console.log('ANCHOR TX:', txHash.toString());
const res = await client.waitForTransactionFinalization(txHash);
console.log('finalized:', res.summary?.type ?? 'unknown');
fs.appendFileSync(new URL('../out/anchors.jsonl', import.meta.url).pathname, JSON.stringify({ reportSha256: hashHex, txHash: txHash.toString(), ts: new Date().toISOString() }) + '\n');
