// Step 3: deploy the initial account credential on Concordium testnet.
import * as ccd from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient, credentials } from '@concordium/web-sdk/nodejs';
import fs from 'node:fs';

const seedHex = fs.readFileSync('secrets/seed.hex', 'utf8').trim();
const identityObject = JSON.parse(fs.readFileSync('out/identity-object.json', 'utf8'));
const { ipInfo, arsInfos } = JSON.parse(fs.readFileSync('out/identity-context.json', 'utf8'));

const client = new ConcordiumGRPCNodeClient('grpc.testnet.concordium.com', 20000, credentials.createSsl(), {}, 30000);
const cryptographicParameters = await client.getCryptographicParameters();

const identityIndex = 0;
const credNumber = 0;
const input = {
    ipInfo,
    globalContext: cryptographicParameters,
    arsInfos,
    idObject: identityObject.value,
    revealedAttributes: [],
    seedAsHex: seedHex,
    net: 'Testnet',
    identityIndex,
    credNumber,
};
const expiry = ccd.TransactionExpiry.fromDate(new Date(Date.now() + 3600000));
const credTx = ccd.createCredentialPayload(input, expiry);

const wallet = ccd.ConcordiumHdWallet.fromHex(seedHex, 'Testnet');
const signingKey = wallet.getAccountSigningKey(ipInfo.ipIdentity, identityIndex, credNumber);
const signatures = [await ccd.signCredentialTransaction(credTx, signingKey.toString('hex'))];

const accountAddress = ccd.getAccountAddress(credTx.unsignedCdi.credId);
console.log('ACCOUNT ADDRESS:', accountAddress.address);

const payload = ccd.serializeCredentialDeploymentPayload(signatures, credTx);
const txHash = ccd.getCredentialDeploymentTransactionHash(credTx, signatures);
console.log('TX HASH:', txHash);

const success = await client.sendCredentialDeploymentTransaction(payload, expiry);
console.log('node accepted:', success);

const status = await client.waitForTransactionFinalization(txHash);
console.log('finalized. status:', JSON.stringify(status.status ?? status, null, 0).slice(0, 300));

fs.writeFileSync('out/account.json', JSON.stringify({
    address: accountAddress.address,
    credentialDeploymentTxHash: txHash,
    identityIndex,
    credNumber,
}, null, 2));
console.log('saved out/account.json');
