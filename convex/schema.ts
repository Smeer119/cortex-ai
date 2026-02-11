import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Define the schema for Convex database
export default defineSchema({
    // Users table - stores user profile information
    users: defineTable({
        tokenIdentifier: v.optional(v.string()), // Links to Clerk identity
        name: v.optional(v.string()),
        image: v.optional(v.string()),
        email: v.optional(v.string()),
        age: v.optional(v.number()),
        gender: v.optional(v.string()),
        location: v.optional(v.string()),
        status: v.optional(v.union(v.literal("Student"), v.literal("Working Professional"))),
        profileCompleted: v.optional(v.boolean()),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
    })
        .index("by_token", ["tokenIdentifier"])
        .index("email", ["email"]),



    // Memories table - stores notes, tasks, checklists, and reminders
    memories: defineTable({
        userId: v.id("users"),
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
        timestamp: v.number(),
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
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_timestamp", ["userId", "timestamp"])
        .index("by_user_and_type", ["userId", "type"])
        .searchIndex("search_content", {
            searchField: "content",
            filterFields: ["userId"],
        })
        .searchIndex("search_title", {
            searchField: "title",
            filterFields: ["userId"],
        }),
});
