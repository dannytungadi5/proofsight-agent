// Shared account helpers: derive keys from the local seed for each role account.
import * as ccd from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient, credentials } from '@concordium/web-sdk/nodejs';
import fs from 'node:fs';

export const NETWORK = 'ccd:4221332d34e1694168c2a0c0b3fd0f27'; // Concordium testnet (CAIP-2)
export const BADGE = 'JyP9XuZ1MiqWZV82gCRTo'; // ProofSight registry token (CIS-8004 testnet <12802,0>, token_id 1493)

const seedHex = fs.readFileSync(new URL('../secrets/seed.hex', import.meta.url), 'utf8').trim();

function load(label) {
    const file = label === 'seller' ? 'account.json' : `account-${label}.json`;
    return JSON.parse(fs.readFileSync(new URL(`../out/${file}`, import.meta.url), 'utf8'));
}

export function roleAccount(label) {
    const a = load(label);
    const wallet = ccd.ConcordiumHdWallet.fromHex(seedHex, 'Testnet');
    const key = wallet.getAccountSigningKey(0, a.identityIndex ?? 0, a.credNumber).toString('hex');
    return { address: a.address, privateKey: key, signer: ccd.buildBasicAccountSigner(key) };
}

export function grpcClient(timeoutMs = 30000) {
    return new ConcordiumGRPCNodeClient('grpc.testnet.concordium.com', 20000, credentials.createSsl(), {}, timeoutMs);
}
