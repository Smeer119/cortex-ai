import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get the current user from the token identifier.
 */
async function getCurrentUserHelper(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        return null;
    }
    return await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
}

// Store or update user profile upon login
export const storeUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (user !== null) {
            // ONLY update if they are missing (don't overwrite manual changes)
            const updates: any = {};
            if (!user.name && identity.name) updates.name = identity.name;
            if (!user.email && identity.email) updates.email = identity.email;

            if (Object.keys(updates).length > 0) {
                await ctx.db.patch(user._id, updates);
            }
            return user._id;
        }

        // Create new user
        return await ctx.db.insert("users", {
            tokenIdentifier: identity.tokenIdentifier,
            name: identity.name,
            email: identity.email,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Get current user profile
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        return await getCurrentUserHelper(ctx);
    },
});

// Update user profile
export const updateProfile = mutation({
    args: {
        name: v.optional(v.string()),
        age: v.optional(v.number()),
        gender: v.optional(v.string()),
        location: v.optional(v.string()),
        status: v.optional(v.union(v.literal("Student"), v.literal("Working Professional"))),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUserHelper(ctx);
        if (!user) {
            throw new Error("User not found or not authenticated");
        }

        await ctx.db.patch(user._id, {
            name: args.name,
            age: args.age,
            gender: args.gender,
            location: args.location,
            status: args.status,
            profileCompleted: true, // Set the flag
            updatedAt: Date.now(),
        });

        return await ctx.db.get(user._id);
    },
});

// Check if user profile is complete
export const isProfileComplete = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUserHelper(ctx);
        if (!user) {
            return false;
        }

        // Use the explicit flag if it exists, otherwise check fields
        if (user.profileCompleted === true) {
            return true;
        }

        return !!(
            user.name &&
            user.age &&
            user.gender &&
            user.location &&
            user.status
        );
    },
});

