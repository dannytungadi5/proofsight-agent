// Step 2b: walk the issuance chain, then fetch and submit the test attribute form.
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
async function hopOnce(u) {
    const res = await fetch(u, { redirect: 'manual', headers: cookie ? { cookie } : {} });
    const setCookies = res.headers.getSetCookie?.() ?? [];
    if (setCookies.length) cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
    return res;
}

// hop 0: expect 302 to id-verifier form
const r0 = await hopOnce(url);
const formUrl = r0.headers.get('location');
console.log('form URL:', formUrl?.slice(0, 160));
fs.writeFileSync('out/form-url.txt', formUrl ?? '');

const r1 = await hopOnce(formUrl);
const html = await r1.text();
fs.writeFileSync('out/idp-form.html', html);
// print form definition
const formMatch = html.match(/<form[^>]*>([\s\S]*?)<\/form>/i);
console.log('FORM TAG:', html.match(/<form[^>]*>/i)?.[0]);
const inputs = [...html.matchAll(/<(input|select)[^>]*>/gi)].map((m) => m[0]);
console.log('FIELDS:');
for (const i of inputs) console.log('  ', i);
