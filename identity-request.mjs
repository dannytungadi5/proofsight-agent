// Step 1: create a Concordium testnet identity request.
// Generates (or reuses) a seed in ./secrets/seed.hex (gitignored), fetches the
// testnet identity provider list, and writes ./out/identity-request.json.
import * as ccd from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient, credentials } from '@concordium/web-sdk/nodejs';
import fs from 'node:fs';
import crypto from 'node:crypto';

const NET = 'Testnet';
const WALLET_PROXY = 'https://wallet-proxy.testnet.concordium.com';

fs.mkdirSync('secrets', { recursive: true });
fs.mkdirSync('out', { recursive: true });
fs.chmodSync('secrets', 0o700);

let seedHex;
if (fs.existsSync('secrets/seed.hex')) {
    seedHex = fs.readFileSync('secrets/seed.hex', 'utf8').trim();
    console.log('reusing existing seed');
} else {
    seedHex = crypto.randomBytes(64).toString('hex');
    fs.writeFileSync('secrets/seed.hex', seedHex, { mode: 0o600 });
    console.log('generated new seed (stored in secrets/seed.hex)');
}

const ipInfoList = await (await fetch(`${WALLET_PROXY}/v0/ip_info`)).json();
const identityProvider = ipInfoList.find((ip) => ip.ipInfo.ipIdentity === 0);
console.log('IP:', identityProvider.ipInfo.ipDescription.name, '| issuance:', identityProvider.metadata.issuanceStart);

// gRPC client for cryptographic parameters
const client = new ConcordiumGRPCNodeClient('grpc.testnet.concordium.com', 20000, credentials.createSsl(), {}, 30000);
const cryptographicParameters = await client.getCryptographicParameters();
console.log('got cryptographic parameters');

const wallet = ccd.ConcordiumHdWallet.fromHex(seedHex, NET);
const identityIndex = 0;
const ipIdentity = identityProvider.ipInfo.ipIdentity;

const input = {
    arsInfos: identityProvider.arsInfos,
    arThreshold: Math.min(Object.keys(identityProvider.arsInfos).length - 1, 255),
    ipInfo: identityProvider.ipInfo,
    globalContext: cryptographicParameters,
    idCredSec: wallet.getIdCredSec(ipIdentity, identityIndex).toString('hex'),
    prfKey: wallet.getPrfKey(ipIdentity, identityIndex).toString('hex'),
    blindingRandomness: wallet.getSignatureBlindingRandomness(ipIdentity, identityIndex).toString('hex'),
};

const identityRequest = ccd.createIdentityRequestWithKeys(input);
fs.writeFileSync('out/identity-request.json', JSON.stringify(identityRequest));
// keep ipInfo/arsInfos/global for the later credential step
fs.writeFileSync('out/identity-context.json', JSON.stringify({ ipInfo: identityProvider.ipInfo, arsInfos: identityProvider.arsInfos }));

const redirectUri = 'concordiumwallet://identity-issuer/callback';
const params = new URLSearchParams({
    scope: 'identity',
    response_type: 'code',
    redirect_uri: redirectUri,
    state: JSON.stringify({ identityRequest }),
});
console.log('ISSUANCE_URL=' + identityProvider.metadata.issuanceStart + '?' + params.toString());
