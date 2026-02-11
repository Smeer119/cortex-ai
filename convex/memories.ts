import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Helper to get the authenticated user document.
 */
async function getAuthenticatedUser(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        return null;
    }
    return await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
}

// Get all memories for a user
export const getMemories = query({
    args: {},
    handler: async (ctx) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) {
            return [];
        }

        // Get all memories for this user, sorted by timestamp (newest first)
        const memories = await ctx.db
            .query("memories")
            .withIndex("by_user_and_timestamp", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        return memories;
    },
});

// Search memories
export const searchMemories = query({
    args: {
        searchQuery: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) {
            return [];
        }

        // Search in content
        const contentResults = await ctx.db
            .query("memories")
            .withSearchIndex("search_content", (q) =>
                q.search("content", args.searchQuery).eq("userId", user._id)
            )
            .collect();

        // Search in title
        const titleResults = await ctx.db
            .query("memories")
            .withSearchIndex("search_title", (q) =>
                q.search("title", args.searchQuery).eq("userId", user._id)
            )
            .collect();

        // Combine and deduplicate results
        const allResults = [...contentResults, ...titleResults];
        const uniqueResults = Array.from(
            new Map(allResults.map((item) => [item._id, item])).values()
        );

        return uniqueResults;
    },
});

// Create a new memory
export const createMemory = mutation({
    args: {
        type: v.union(
            v.literal("note"),
            v.literal("task"),
            v.literal("checklist"),
            v.literal("reminder")
        ),
        title: v.optional(v.string()),
        content: v.string(),
        tags: v.array(v.string()),
        items: v.optional(
            v.array(
                v.object({
                    id: v.string(),
                    text: v.string(),
                    completed: v.boolean(),
                })
            )
        ),
        reminderAt: v.optional(v.number()),
        style: v.optional(
            v.object({
                backgroundColor: v.optional(v.string()),
                highlightColor: v.optional(v.string()),
                fontFamily: v.optional(v.string()),
                fontSize: v.optional(v.string()),
                fontWeight: v.optional(v.string()),
                titleAlign: v.optional(v.string()),
                contentAlign: v.optional(v.string()),
            })
        ),
        attachments: v.optional(
            v.array(
                v.object({
                    type: v.union(v.literal("image"), v.literal("audio")),
                    url: v.string(),
                    name: v.optional(v.string()),
                })
            )
        ),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const now = Date.now();

        // Create the memory
        const memoryId = await ctx.db.insert("memories", {
            userId: user._id,
            type: args.type,
            title: args.title,
            content: args.content,
            tags: args.tags,
            items: args.items,
            timestamp: now,
            reminderAt: args.reminderAt,
            isPinned: false,
            style: args.style,
            attachments: args.attachments,
            createdAt: now,
            updatedAt: now,
        });

        return await ctx.db.get(memoryId);
    },
});

// Update a memory
export const updateMemory = mutation({
    args: {
        memoryId: v.id("memories"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        items: v.optional(
            v.array(
                v.object({
                    id: v.string(),
                    text: v.string(),
                    completed: v.boolean(),
                })
            )
        ),
        type: v.optional(
            v.union(
                v.literal("note"),
                v.literal("task"),
                v.literal("checklist"),
                v.literal("reminder")
            )
        ),
        reminderAt: v.optional(v.number()),
        isPinned: v.optional(v.boolean()),
        style: v.optional(
            v.object({
                backgroundColor: v.optional(v.string()),
                highlightColor: v.optional(v.string()),
                fontFamily: v.optional(v.string()),
                fontSize: v.optional(v.string()),
                fontWeight: v.optional(v.string()),
                titleAlign: v.optional(v.string()),
                contentAlign: v.optional(v.string()),
            })
        ),
        attachments: v.optional(
            v.array(
                v.object({
                    type: v.union(v.literal("image"), v.literal("audio")),
                    url: v.string(),
                    name: v.optional(v.string()),
                })
            )
        ),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const memory = await ctx.db.get(args.memoryId);
        if (!memory || memory.userId !== user._id) {
            throw new Error("Unauthorized");
        }

        const { memoryId, ...updates } = args;

        await ctx.db.patch(memoryId, {
            ...updates,
            updatedAt: Date.now(),
        });

        return await ctx.db.get(memoryId);
    },
});

// Delete a memory
export const deleteMemory = mutation({
    args: {
        memoryId: v.id("memories"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const memory = await ctx.db.get(args.memoryId);
        if (!memory || memory.userId !== user._id) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.memoryId);
    },
});


// Toggle checklist item
export const toggleChecklistItem = mutation({
    args: {
        memoryId: v.id("memories"),
        itemId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx);
        if (!user) {
            throw new Error("Not authenticated");
        }

        const memory = await ctx.db.get(args.memoryId);
        if (!memory || memory.userId !== user._id) {
            throw new Error("Unauthorized");
        }

        if (!memory.items) {
            throw new Error("Items not found");
        }


        const updatedItems = memory.items.map((item) =>
            item.id === args.itemId
                ? { ...item, completed: !item.completed }
                : item
        );

        await ctx.db.patch(args.memoryId, {
            items: updatedItems,
            updatedAt: Date.now(),
        });

        return await ctx.db.get(args.memoryId);
    },
});

