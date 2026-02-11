const crypto = require('crypto');
const { spawnSync } = require('child_process');

function setEnv(name, value) {
    const npxPath = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const result = spawnSync(npxPath, ['convex', 'env', 'set', '--', name, value], { encoding: 'utf8' });
    if (result.status === 0) {
        console.log(`PASS: ${name}`);
    } else {
        console.log(`FAIL: ${name} - ${result.stderr}`);
    }
}

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const jwk = crypto.createPublicKey(publicKey).export({ format: 'jwk' });
jwk.kid = crypto.randomBytes(16).toString('hex');
jwk.alg = 'RS256';
jwk.use = 'sig';
const jwks = JSON.stringify({ keys: [jwk] });

setEnv('CONVEX_AUTH_PRIVATE_KEY', privateKey);
setEnv('JWT_PRIVATE_KEY', privateKey);
setEnv('JWKS', jwks);
setEnv('CONVEX_AUTH_ADAPTER_SECRET', crypto.randomBytes(32).toString('base64'));
