const { spawnSync } = require('child_process');
const keys = require('./auth_keys.json');

function setEnv(name, value) {
    console.log(`Setting ${name}...`);
    const npxPath = process.platform === 'win32' ? 'npx.cmd' : 'npx';

    // Use -- to signal the end of options, so the value isn't parsed as an option
    const result = spawnSync(npxPath, ['convex', 'env', 'set', '--', name, value], {
        encoding: 'utf8',
        shell: false // Try without shell first to avoid shell-specific quoting issues
    });


    if (result.status === 0) {
        console.log(`Successfully set ${name}`);
    } else {
        console.error(`Failed to set ${name}:`, result.stderr || result.stdout);
    }
}

// CONVEX_AUTH_PRIVATE_KEY is the standard variable for @convex-dev/auth
setEnv('CONVEX_AUTH_PRIVATE_KEY', keys.CONVEX_AUTH_PRIVATE_KEY);
// JWKS is also needed for asymmetric signing
setEnv('JWKS', keys.JWKS);

