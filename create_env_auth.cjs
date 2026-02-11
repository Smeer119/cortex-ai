const fs = require('fs');
const keys = require('./auth_keys.json');

// For .env files, RSA keys usually need to be in a single line with \n
const formattedKey = keys.JWT_PRIVATE_KEY.replace(/ /g, '\n');
// Wait, the original had spaces where newlines were. Let's be careful.
// Actually, PEM format needs \n.

const envContent = `
JWT_PRIVATE_KEY="${keys.JWT_PRIVATE_KEY}"
JWKS='${keys.JWKS}'
CONVEX_SITE_URL="http://localhost:5173"
`;

fs.writeFileSync('.env.auth', envContent.trim());
console.log('.env.auth created');
