import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// List all classes
export const list = query({
  handler: async (ctx) => {
    const classes = await ctx.db.query("classes").collect();
    return classes;
  },
});

// List classes by teacher
export const listByTeacher = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();
    return classes;
  },
});

// Get a class by ID and teacher (for authorization)
export const getByIdAndTeacher = query({
  args: {
    id: v.id("classes"),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .filter((q) => q.eq(q.field("_id"), args.id))
      .first();
    return classData;
  },
});

// Get a class by ID
export const getById = query({
  args: { id: v.id("classes") },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.id);
    return classData;
  },
});

// Create a new class
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    gradeLevel: v.optional(v.number()),
    schedule: v.optional(v.string()),
    capacity: v.optional(v.number()),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const classId = await ctx.db.insert("classes", {
      ...args,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return classId;
  },
});

// Update a class
export const update = mutation({
  args: {
    id: v.id("classes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    gradeLevel: v.optional(v.number()),
    schedule: v.optional(v.string()),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const classData = await ctx.db.get(id);
    if (!classData) {
      throw new Error("Class not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Delete a class
export const remove = mutation({
  args: { id: v.id("classes") },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.id);
    if (!classData) {
      throw new Error("Class not found");
    }

    // Delete all grades for this class
    await ctx.runMutation(api.grades.deleteByClass, {
      classId: args.id,
    });

    // Delete all class_students connections for this class
    const enrollments = await ctx.db
      .query("class_students")
      .withIndex("by_class", (q) => q.eq("classId", args.id))
      .collect();

    // Delete all enrollments
    await Promise.all(
      enrollments.map((enrollment) => ctx.db.delete(enrollment._id))
    );

    // Delete the class
    await ctx.db.delete(args.id);
  },
});
