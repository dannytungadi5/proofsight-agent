// ProofSight self-hosted x402 facilitator (testnet).
// Verifies partially-signed sponsored payments and settles them on-chain by
// adding the sponsor signature (the sponsor pays the transaction fee).
import http from 'node:http';
import { ExactConcordiumScheme } from '@x402/concordium/exact/facilitator';
import { toConcordiumFacilitatorSigner, CONCORDIUM_TESTNET_CAIP2 } from '@x402/concordium';
import { roleAccount, grpcClient, NETWORK } from './accounts.mjs';

const fac = roleAccount('facilitator');
const signer = toConcordiumFacilitatorSigner(fac.address, fac.privateKey, {
    host: 'grpc.testnet.concordium.com',
    port: 20000,
    useTls: true,
    network: NETWORK,
});
const scheme = new ExactConcordiumScheme({ signer: [signer], requireFinalization: true });

const server = http.createServer(async (req, res) => {
    const send = (code, obj) => {
        res.writeHead(code, { 'content-type': 'application/json' });
        res.end(JSON.stringify(obj));
    };
    if (req.method === 'GET' && req.url === '/supported') {
        return send(200, {
            kinds: [{ x402Version: 2, scheme: 'exact', network: CONCORDIUM_TESTNET_CAIP2, extra: { feePayer: fac.address } }],
            signers: { [CONCORDIUM_TESTNET_CAIP2]: [fac.address] },
        });
    }
    if (req.method === 'POST' && (req.url === '/verify' || req.url === '/settle')) {
        let body = '';
        for await (const chunk of req) body += chunk;
        try {
            const { paymentPayload, paymentRequirements } = JSON.parse(body);
            const result =
                req.url === '/verify'
                    ? await scheme.verify(paymentPayload, paymentRequirements)
                    : await scheme.settle(paymentPayload, paymentRequirements);
            return send(200, result);
        } catch (e) {
            return send(400, { error: e.message });
        }
    }
    send(404, { error: 'not found' });
});

const port = process.env.PORT ?? 8402;
server.listen(port, () => console.log(`facilitator on :${port}, feePayer ${fac.address}`));
