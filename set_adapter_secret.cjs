const { execSync } = require('child_process');
const crypto = require('crypto');

try {
    const secret = crypto.randomBytes(32).toString('base64');
    console.log(`Setting CONVEX_AUTH_ADAPTER_SECRET...`);
    const npxPath = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    execSync(`${npxPath} convex env set CONVEX_AUTH_ADAPTER_SECRET ${secret}`, { stdio: 'inherit' });
    console.log('Successfully set CONVEX_AUTH_ADAPTER_SECRET');
} catch (error) {
    console.error('Failed to set adapter secret:', error.message);
}
