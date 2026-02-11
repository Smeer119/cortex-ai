const crypto = require('crypto');
const { spawnSync } = require('child_process');

const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Single line version just in case
const singleLine = privateKey.replace(/\r?\n/g, '\\n');

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

console.log('Attempting to set JWT_PRIVATE_KEY...');
const res = spawnSync(npx, ['convex', 'env', 'set', '--', 'JWT_PRIVATE_KEY', privateKey], { encoding: 'utf8' });
console.log('Status:', res.status);
if (res.status !== 0) console.log('Error:', res.stderr);

spawnSync(npx, ['convex', 'env', 'set', '--', 'CONVEX_AUTH_PRIVATE_KEY', privateKey], { encoding: 'utf8' });
spawnSync(npx, ['convex', 'env', 'set', '--', 'AUTH_SECRET', crypto.randomBytes(32).toString('base64')], { encoding: 'utf8' });
