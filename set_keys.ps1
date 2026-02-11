$keys = Get-Content -Raw -Path auth_keys.json | ConvertFrom-Json
# Use -- to ensure the value isn't treated as a CLI option
npx convex env set CONVEX_AUTH_PRIVATE_KEY -- $keys.CONVEX_AUTH_PRIVATE_KEY
npx convex env set JWKS -- $keys.JWKS
