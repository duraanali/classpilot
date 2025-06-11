import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// List grades for a class
export const listByClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const grades = await ctx.db
      .query("grades")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Get student details for each grade
    const gradesWithStudents = await Promise.all(
      grades.map(async (grade) => {
        const student = await ctx.db.get(grade.studentId);
        return {
          ...grade,
          student: student,
        };
      })
    );

    return gradesWithStudents;
  },
});

// List grades for a student
export const listByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const grades = await ctx.db
      .query("grades")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Get class details for each grade
    const gradesWithClasses = await Promise.all(
      grades.map(async (grade) => {
        const classData = await ctx.db.get(grade.classId);
        return {
          ...grade,
          class: classData,
        };
      })
    );

    return gradesWithClasses;
  },
});

// Get a specific grade
export const getById = query({
  args: { id: v.id("grades") },
  handler: async (ctx, args) => {
    const grade = await ctx.db.get(args.id);
    if (!grade) return null;

    // Get student and class details
    const [student, classData] = await Promise.all([
      ctx.db.get(grade.studentId),
      ctx.db.get(grade.classId),
    ]);

    return {
      ...grade,
      student,
      class: classData,
    };
  },
});

// Create a new grade
export const create = mutation({
  args: {
    studentId: v.id("students"),
    classId: v.id("classes"),
    assignment: v.string(),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify student is enrolled in class
    const enrollment = await ctx.db
      .query("class_students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .first();

    if (!enrollment) {
      throw new Error("Student is not enrolled in this class");
    }

    // Create grade
    const gradeId = await ctx.db.insert("grades", {
      ...args,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return gradeId;
  },
});

// Update a grade
export const update = mutation({
  args: {
    id: v.id("grades"),
    assignment: v.optional(v.string()),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const grade = await ctx.db.get(id);
    if (!grade) {
      throw new Error("Grade not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Delete a grade
export const remove = mutation({
  args: { id: v.id("grades") },
  handler: async (ctx, args) => {
    const grade = await ctx.db.get(args.id);
    if (!grade) {
      throw new Error("Grade not found");
    }

    await ctx.db.delete(args.id);
  },
});
