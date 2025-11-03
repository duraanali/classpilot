import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add a token to the blacklist
export const add = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Check if token already exists in blacklist
    const existing = await ctx.db
      .query("tokenBlacklist")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (existing) {
      return existing._id;
    }

    // Add token to blacklist
    const tokenId = await ctx.db.insert("tokenBlacklist", {
      token: args.token,
      createdAt: now,
    });

    return tokenId;
  },
});

// Check if a token is blacklisted
export const isBlacklisted = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const blacklisted = await ctx.db
      .query("tokenBlacklist")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    return blacklisted !== null;
  },
});

// Clean up old tokens (optional - for maintenance)
// Tokens older than 30 days can be removed since JWTs typically expire before that
export const cleanup = mutation({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    const oldTokens = await ctx.db
      .query("tokenBlacklist")
      .filter((q) => q.lt(q.field("createdAt"), cutoffDate))
      .collect();

    for (const token of oldTokens) {
      await ctx.db.delete(token._id);
    }

    return { deleted: oldTokens.length };
  },
});
