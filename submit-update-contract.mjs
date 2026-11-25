// Generic: sign + submit an UpdateContract transaction built by the Agent Registry MCP service.
// Usage: node submit-update-contract.mjs '<json>' where json = {parameter_hex, contract_address:{index,subindex}, receive_name, suggested_energy}
import * as ccd from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient, credentials } from '@concordium/web-sdk/nodejs';
import fs from 'node:fs';

const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const seedHex = fs.readFileSync('secrets/seed.hex', 'utf8').trim();
const account = JSON.parse(fs.readFileSync('out/account.json', 'utf8'));

const wallet = ccd.ConcordiumHdWallet.fromHex(seedHex, 'Testnet');
const signingKey = wallet.getAccountSigningKey(0, account.identityIndex, account.credNumber).toString('hex');
const signer = ccd.buildBasicAccountSigner(signingKey);

const client = new ConcordiumGRPCNodeClient('grpc.testnet.concordium.com', 20000, credentials.createSsl(), {}, 30000);
const sender = ccd.AccountAddress.fromBase58(account.address);
const { nonce } = await client.getNextAccountNonce(sender);

const transaction = {
    header: {
        expiry: ccd.TransactionExpiry.fromDate(new Date(Date.now() + 3600000)),
        nonce,
        sender,
    },
    payload: {
        amount: ccd.CcdAmount.zero(),
        address: ccd.ContractAddress.create(BigInt(spec.contract_address.index), BigInt(spec.contract_address.subindex)),
        receiveName: ccd.ReceiveName.fromString(spec.receive_name),
        message: ccd.Parameter.fromHexString(spec.parameter_hex),
        maxContractExecutionEnergy: ccd.Energy.create(BigInt(spec.suggested_energy)),
    },
    type: ccd.AccountTransactionType.Update,
};

const signature = await ccd.signTransaction(transaction, signer);
const txHash = await client.sendAccountTransaction(transaction, signature);
console.log('TX HASH:', txHash.toString());

const result = await client.waitForTransactionFinalization(txHash);
const summary = result.summary;
console.log('STATUS:', summary.type, '| outcome tag:', summary.transactionType ?? '');
if (summary.type === 'accountTransaction' && summary.summary?.type === 'update') {
    console.log('events:', JSON.stringify(summary.summary.events ?? []).slice(0, 500));
}
fs.writeFileSync(process.argv[3] ?? 'out/last-tx.json', JSON.stringify({
    txHash: txHash.toString(),
    receiveName: spec.receive_name,
    summary: JSON.parse(JSON.stringify(summary, (k, v) => (typeof v === 'bigint' ? v.toString() : v))),
}, null, 1));
console.log('done');
