/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly API_KEY: string;
    readonly VITE_CONVEX_URL: string;
    readonly VITE_CLERK_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
