import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// List grades for a class (with teacher authorization)
export const listByClass = query({
  args: {
    classId: v.id("classes"),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if teacher owns the class
    const classData = await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .filter((q) => q.eq(q.field("_id"), args.classId))
      .first();

    if (!classData) {
      return []; // Return empty array if teacher doesn't own the class
    }

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

// List grades for a student (with teacher authorization)
export const listByStudent = query({
  args: {
    studentId: v.id("students"),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if teacher owns the student
    const studentData = await ctx.db
      .query("students")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .filter((q) => q.eq(q.field("_id"), args.studentId))
      .first();

    if (!studentData) {
      return []; // Return empty array if teacher doesn't own the student
    }

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

// Get a specific grade (with teacher authorization)
export const getById = query({
  args: {
    id: v.id("grades"),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const grade = await ctx.db.get(args.id);
    if (!grade) return null;

    // Check if teacher owns the student
    const studentData = await ctx.db
      .query("students")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .filter((q) => q.eq(q.field("_id"), grade.studentId))
      .first();

    if (!studentData) {
      return null; // Return null if teacher doesn't own the student
    }

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

// Create a new grade (with teacher authorization)
export const create = mutation({
  args: {
    studentId: v.id("students"),
    classId: v.id("classes"),
    assignment: v.string(),
    score: v.number(),
    teacherId: v.id("users"), // Add teacherId for authorization
  },
  handler: async (ctx, args) => {
    const { teacherId, ...gradeData } = args;

    // Check if teacher owns the class
    const classData = await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .filter((q) => q.eq(q.field("_id"), gradeData.classId))
      .first();

    if (!classData) {
      throw new Error("Class not found or not owned by teacher");
    }

    // Check if teacher owns the student
    const studentData = await ctx.db
      .query("students")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .filter((q) => q.eq(q.field("_id"), gradeData.studentId))
      .first();

    if (!studentData) {
      throw new Error("Student not found or not owned by teacher");
    }

    // Verify student is enrolled in class
    const enrollment = await ctx.db
      .query("class_students")
      .withIndex("by_class", (q) => q.eq("classId", gradeData.classId))
      .filter((q) => q.eq(q.field("studentId"), gradeData.studentId))
      .first();

    if (!enrollment) {
      throw new Error("Student is not enrolled in this class");
    }

    // Create grade
    const gradeId = await ctx.db.insert("grades", {
      ...gradeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return gradeId;
  },
});

// Update a grade (with teacher authorization)
export const update = mutation({
  args: {
    id: v.id("grades"),
    assignment: v.optional(v.string()),
    score: v.optional(v.number()),
    teacherId: v.id("users"), // Add teacherId for authorization
  },
  handler: async (ctx, args) => {
    const { id, teacherId, ...updates } = args;

    const grade = await ctx.db.get(id);
    if (!grade) {
      throw new Error("Grade not found");
    }

    // Check if teacher owns the student
    const studentData = await ctx.db
      .query("students")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .filter((q) => q.eq(q.field("_id"), grade.studentId))
      .first();

    if (!studentData) {
      throw new Error("Grade not found or not owned by teacher");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Delete a grade (with teacher authorization)
export const remove = mutation({
  args: {
    id: v.id("grades"),
    teacherId: v.id("users"), // Add teacherId for authorization
  },
  handler: async (ctx, args) => {
    const { id, teacherId } = args;

    const grade = await ctx.db.get(id);
    if (!grade) {
      throw new Error("Grade not found");
    }

    // Check if teacher owns the student
    const studentData = await ctx.db
      .query("students")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .filter((q) => q.eq(q.field("_id"), grade.studentId))
      .first();

    if (!studentData) {
      throw new Error("Grade not found or not owned by teacher");
    }

    await ctx.db.delete(id);
  },
});

// Delete all grades for a class (for cascade deletion)
export const deleteByClass = mutation({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const grades = await ctx.db
      .query("grades")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    // Delete all grades for this class
    await Promise.all(grades.map((grade) => ctx.db.delete(grade._id)));
  },
});

// Delete all grades for a student (for cascade deletion)
export const deleteByStudent = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const grades = await ctx.db
      .query("grades")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Delete all grades for this student
    await Promise.all(grades.map((grade) => ctx.db.delete(grade._id)));
  },
});
