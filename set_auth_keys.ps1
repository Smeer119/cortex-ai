$key = @"
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDA+fKk+R/L6O...
(placeholder, will be replaced)
-----END PRIVATE KEY-----
"@
npx convex env set JWT_PRIVATE_KEY -- $key
npx convex env set CONVEX_AUTH_PRIVATE_KEY -- $key
