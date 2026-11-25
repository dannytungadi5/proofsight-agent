// Step 2 (probe): walk the testnet IdP issuance redirect chain with manual redirects
// and print each hop so we can script the real flow.
import fs from 'node:fs';

const identityRequest = JSON.parse(fs.readFileSync('out/identity-request.json', 'utf8'));
const redirectUri = 'ConcordiumRedirectToken';
const params = new URLSearchParams({
    scope: 'identity',
    response_type: 'code',
    redirect_uri: redirectUri,
    state: JSON.stringify({ idObjectRequest: identityRequest }),
});
let url = 'https://id-service.testnet.concordium.com/api/v0/identity?' + params.toString();

let cookie = '';
for (let hop = 0; hop < 10; hop++) {
    const res = await fetch(url, { redirect: 'manual', headers: cookie ? { cookie } : {} });
    const setCookies = res.headers.getSetCookie?.() ?? [];
    if (setCookies.length) {
        cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
    }
    const loc = res.headers.get('location');
    console.log(`hop ${hop}: ${res.status} ${url.slice(0, 120)}`);
    if (loc) console.log(`   -> Location: ${loc.slice(0, 300)}`);
    const ct = res.headers.get('content-type') ?? '';
    if (!loc || (res.status >= 200 && res.status < 300)) {
        const body = await res.text();
        console.log(`   body[${ct}]: ${body.slice(0, 1500)}`);
        if (!loc) break;
    }
    if (!loc) break;
    url = new URL(loc, url).toString();
    if (url.startsWith(redirectUri)) {
        console.log('REACHED CALLBACK:', url.slice(0, 200));
        break;
    }
}
