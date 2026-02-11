const crypto = require('crypto');
const fs = require('fs');

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

const psContent = `
$key = @'
${privateKey}
'@
$jwks = @'
${jwks}
'@
npx convex env set JWT_PRIVATE_KEY -- $key
npx convex env set CONVEX_AUTH_PRIVATE_KEY -- $key
npx convex env set JWKS -- $jwks
npx convex env set AUTH_SECRET -- "${crypto.randomBytes(32).toString('base64')}"
`;

fs.writeFileSync('set_keys.ps1', psContent);
console.log('Generated set_keys.ps1');
