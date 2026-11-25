// Create another account credential on the same identity.
// Usage: node create-additional-account.mjs <credNumber> <label>
import * as ccd from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient, credentials } from '@concordium/web-sdk/nodejs';
import fs from 'node:fs';

const credNumber = parseInt(process.argv[2], 10);
const label = process.argv[3];

const seedHex = fs.readFileSync('secrets/seed.hex', 'utf8').trim();
const identityObject = JSON.parse(fs.readFileSync('out/identity-object.json', 'utf8'));
const { ipInfo, arsInfos } = JSON.parse(fs.readFileSync('out/identity-context.json', 'utf8'));

const client = new ConcordiumGRPCNodeClient('grpc.testnet.concordium.com', 20000, credentials.createSsl(), {}, 30000);
const cryptographicParameters = await client.getCryptographicParameters();

const input = {
    ipInfo,
    globalContext: cryptographicParameters,
    arsInfos,
    idObject: identityObject.value,
    revealedAttributes: [],
    seedAsHex: seedHex,
    net: 'Testnet',
    identityIndex: 0,
    credNumber,
};
const expiry = ccd.TransactionExpiry.fromDate(new Date(Date.now() + 3600000));
const credTx = ccd.createCredentialPayload(input, expiry);
const wallet = ccd.ConcordiumHdWallet.fromHex(seedHex, 'Testnet');
const signingKey = wallet.getAccountSigningKey(ipInfo.ipIdentity, 0, credNumber);
const signatures = [await ccd.signCredentialTransaction(credTx, signingKey.toString('hex'))];
const accountAddress = ccd.getAccountAddress(credTx.unsignedCdi.credId);
console.log(label, 'ADDRESS:', accountAddress.address);
const payload = ccd.serializeCredentialDeploymentPayload(signatures, credTx);
await client.sendCredentialDeploymentTransaction(payload, expiry);
console.log('submitted; address saved');
fs.writeFileSync(`out/account-${label}.json`, JSON.stringify({ address: accountAddress.address, identityIndex: 0, credNumber, label }, null, 1));
