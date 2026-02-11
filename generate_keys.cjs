const crypto = require('crypto');
const fs = require('fs');

function generateKeys() {
    // Generate an RSA key pair in PKCS#8 format
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    // Create JWKS for the public key
    const jwk = crypto.createPublicKey(publicKey).export({ format: 'jwk' });
    jwk.kid = crypto.randomBytes(16).toString('hex');
    jwk.alg = 'RS256';
    jwk.use = 'sig';

    const jwks = JSON.stringify({ keys: [jwk] });

    const result = {
        CONVEX_AUTH_PRIVATE_KEY: privateKey,
        JWKS: jwks
    };

    fs.writeFileSync('auth_keys.json', JSON.stringify(result, null, 2));
    console.log('Keys generated and saved to auth_keys.json');
    console.log('IMPORTANT: CONVEX_AUTH_PRIVATE_KEY is now in correct PEM format.');
}

generateKeys();

