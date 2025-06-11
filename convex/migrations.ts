import { mutation } from "./_generated/server";

// Migration to update user records to match new schema
export const migrateUsers = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = new Date().toISOString();

    for (const user of users) {
      // Use existing created_at if available, otherwise use current time
      const createdAt = user.created_at
        ? new Date(user.created_at).toISOString()
        : now;

      // Update the user record with new schema fields
      await ctx.db.patch(user._id, {
        createdAt,
        updatedAt: createdAt,
        role: "user", // Default role for existing users
        // Remove old field
        created_at: undefined,
      });
    }

    return { success: true, migrated: users.length };
  },
});
