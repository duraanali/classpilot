import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// List all students
export const list = query({
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    return students;
  },
});

// Get a student by ID
export const getById = query({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    return student;
  },
});

// Create a new student
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    grade: v.number(),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    notes: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if student with email already exists
    const existingStudent = await ctx.db
      .query("students")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingStudent) {
      throw new Error("Student with this email already exists");
    }

    const studentId = await ctx.db.insert("students", {
      name: args.name,
      email: args.email,
      grade: args.grade,
      age: args.age,
      gender: args.gender,
      notes: args.notes,
      parentEmail: args.parentEmail,
      parentPhone: args.parentPhone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return studentId;
  },
});

// Update a student
export const update = mutation({
  args: {
    id: v.id("students"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    grade: v.optional(v.number()),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    notes: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // If email is being updated, check if it's already in use
    if (updates.email) {
      const existingStudent = await ctx.db
        .query("students")
        .filter((q) =>
          q.and(
            q.eq(q.field("email"), updates.email),
            q.neq(q.field("_id"), id)
          )
        )
        .first();

      if (existingStudent) {
        throw new Error("Student with this email already exists");
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Remove a student
export const remove = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
