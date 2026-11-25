// Step 2: run testnet identity issuance against /api/v1/identity, following redirects.
import fs from 'node:fs';

const identityRequest = JSON.parse(fs.readFileSync('out/identity-request.json', 'utf8'));
const params = new URLSearchParams({
    scope: 'identity',
    response_type: 'code',
    redirect_uri: 'ConcordiumRedirectToken',
    state: JSON.stringify({ idObjectRequest: identityRequest }),
});
let url = 'https://id-service.testnet.concordium.com/api/v1/identity?' + params.toString();

let cookie = '';
for (let hop = 0; hop < 15; hop++) {
    const res = await fetch(url, { redirect: 'manual', headers: cookie ? { cookie } : {} });
    const setCookies = res.headers.getSetCookie?.() ?? [];
    if (setCookies.length) cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
    const loc = res.headers.get('location');
    console.log(`hop ${hop}: ${res.status} ${url.slice(0, 110)}${url.length > 110 ? '…' : ''}`);
    if (loc) console.log(`   -> ${loc.slice(0, 250)}${loc.length > 250 ? '…' : ''}`);
    if (loc && loc.startsWith('ConcordiumRedirectToken')) {
        fs.writeFileSync('out/identity-redirect.txt', loc);
        console.log('REACHED CALLBACK (saved to out/identity-redirect.txt)');
        break;
    }
    if (!loc) {
        const ct = res.headers.get('content-type') ?? '';
        const body = await res.text();
        console.log(`   body[${ct}] len=${body.length}: ${body.slice(0, 2000)}`);
        break;
    }
    url = new URL(loc, url).toString();
}
