
export default {
    providers: [
        {
            // You'll need to set the CLERK_JWT_ISSUER_DOMAIN environment variable in Convex
            domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
            applicationID: "convex",
        },
    ],
};
