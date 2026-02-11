const { execSync } = require('child_process');
const crypto = require('crypto');

function run(cmd) {
    try {
        console.log(`Running: ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

console.log('--- RESETTING AUTH ENVIRONMENT ---');

// 1. Unset old asymmetric keys that were causing formatting issues
const keysToRemove = ['JWT_PRIVATE_KEY', 'CONVEX_AUTH_PRIVATE_KEY', 'JWKS', 'JWT_PUBLIC_KEY'];
for (const key of keysToRemove) {
    run(`${npx} convex env remove ${key}`);
}

// 2. Set a fresh high-entropy symmetric secret
const secret = crypto.randomBytes(32).toString('base64');
console.log('--- SETTING SYMMETRIC AUTH_SECRET ---');
run(`${npx} convex env set AUTH_SECRET "${secret}"`);

console.log('--- AUTH ENVIRONMENT STABILIZED ---');
