const crypto = require('crypto');
const fs = require('fs');

const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const ps1 = `
$k = @'
${privateKey}
'@
npx convex env set JWT_PRIVATE_KEY -- $k
npx convex env set CONVEX_AUTH_PRIVATE_KEY -- $k
`;

fs.writeFileSync('set_auth_keys.ps1', ps1);
console.log('Successfully generated set_auth_keys.ps1');
