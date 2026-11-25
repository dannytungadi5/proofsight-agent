// Step 2c: full issuance run - start, get form, submit Alex's test attributes,
// follow the callback, and retrieve the identity object.
import fs from 'node:fs';

const identityRequest = JSON.parse(fs.readFileSync('out/identity-request.json', 'utf8'));
const params = new URLSearchParams({
    scope: 'identity',
    response_type: 'code',
    redirect_uri: 'ConcordiumRedirectToken',
    state: JSON.stringify({ idObjectRequest: identityRequest }),
});
const startUrl = 'https://id-service.testnet.concordium.com/api/v1/identity?' + params.toString();

let cookie = '';
async function req(u, opts = {}) {
    const res = await fetch(u, {
        redirect: 'manual',
        ...opts,
        headers: { ...(opts.headers ?? {}), ...(cookie ? { cookie } : {}) },
    });
    const setCookies = res.headers.getSetCookie?.() ?? [];
    if (setCookies.length) cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
    return res;
}

const r0 = await req(startUrl);
const formUrl = r0.headers.get('location');
if (!formUrl) throw new Error('no form redirect: ' + r0.status);
console.log('form:', formUrl.slice(0, 100));
const r1 = await req(formUrl);
const html = await r1.text();
const val = (name) => html.match(new RegExp(`name="${name}" value="([^"]*)"`))?.[1] ?? '';

const body = new URLSearchParams({
    id_cred_pub: val('id_cred_pub'),
    endpoint_version: val('endpoint_version'),
    id_cred_pub_signature: val('id_cred_pub_signature'),
    expiry: '2030-12',
    firstName: 'Alex',
    lastName: 'Panjaya',
    sex: '1',
    dob: '19940916',
    countryOfResidence: 'ID',
    nationality: 'ID',
    idDocType: '1',
    idDocNo: 'B0192406',
    idDocIssuer: 'ID',
    idDocIssuedAt: '20240101',
    idDocExpiresAt: '20340101',
    nationalIdNo: 'N-160994',
    taxIdNo: 'T-160994',
});

const r2 = await req(new URL('/api/submit', formUrl).toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
});
console.log('submit status:', r2.status);
const loc2 = r2.headers.get('location');
console.log('submit redirect:', (loc2 ?? '(none)').slice(0, 200));

let callback = loc2;
if (!callback) {
    const t = await r2.text();
    console.log('submit body:', t.slice(0, 800));
    throw new Error('unexpected submit response');
}
// the submit response may itself be the callback (ConcordiumRedirectToken#code_uri=...)
if (callback.startsWith('ConcordiumRedirectToken')) {
    console.log('CALLBACK:', callback.slice(0, 120));
} else {
    // follow remaining hops
    let u = new URL(callback, formUrl).toString();
    for (let i = 0; i < 10; i++) {
        const r = await req(u);
        const loc = r.headers.get('location');
        console.log(`hop ${i}: ${r.status} -> ${(loc ?? '(final)').slice(0, 140)}`);
        if (!loc) {
            console.log('final body:', (await r.text()).slice(0, 500));
            throw new Error('chain ended without callback');
        }
        if (loc.startsWith('ConcordiumRedirectToken')) {
            callback = loc;
            break;
        }
        u = new URL(loc, u).toString();
    }
}
fs.writeFileSync('out/identity-callback.txt', callback);
const codeUri = callback.split('#code_uri=')[1];
if (!codeUri) throw new Error('no code_uri in callback: ' + callback.slice(0, 200));
console.log('code_uri:', codeUri);

// poll for the identity object
for (let attempt = 0; attempt < 30; attempt++) {
    const r = await fetch(codeUri);
    const j = await r.json();
    console.log(`poll ${attempt}: status=${j.status}`);
    if (j.status === 'done') {
        fs.writeFileSync('out/identity-object.json', JSON.stringify(j.token.identityObject));
        console.log('IDENTITY OBJECT SAVED to out/identity-object.json');
        process.exit(0);
    }
    if (j.status === 'error') throw new Error('IdP error: ' + j.detail);
    await new Promise((r_) => setTimeout(r_, 5000));
}
throw new Error('identity still pending after polling');
