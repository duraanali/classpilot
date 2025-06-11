import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// List students in a class
export const listStudents = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("class_students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const students = await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = await ctx.db.get(enrollment.studentId);
        return {
          ...student,
          enrolledAt: enrollment.enrolledAt,
        };
      })
    );

    return students;
  },
});

// Get a specific enrollment
export const getEnrollment = query({
  args: {
    classId: v.id("classes"),
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query("class_students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .first();

    return enrollment;
  },
});

// Assign students to a class
export const assignStudents = mutation({
  args: {
    classId: v.id("classes"),
    studentIds: v.array(v.id("students")),
  },
  handler: async (ctx, args) => {
    const { classId, studentIds } = args;

    // Get class to check capacity
    const classData = await ctx.db.get(classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // Get current enrollment count
    const currentEnrollments = await ctx.db
      .query("class_students")
      .withIndex("by_class", (q) => q.eq("classId", classId))
      .collect();

    // Check if adding these students would exceed capacity
    if (currentEnrollments.length + studentIds.length > classData.capacity) {
      throw new Error("Adding these students would exceed class capacity");
    }

    // Check for existing enrollments
    const existingEnrollments = await ctx.db
      .query("class_students")
      .withIndex("by_class", (q) => q.eq("classId", classId))
      .filter((q) => studentIds.some((id) => q.eq(q.field("studentId"), id)))
      .collect();

    const existingStudentIds = new Set(
      existingEnrollments.map((e) => e.studentId)
    );

    // Create new enrollments for students not already enrolled
    const enrollments = studentIds
      .filter((id) => !existingStudentIds.has(id))
      .map((studentId) => ({
        classId,
        studentId,
        enrolledAt: new Date().toISOString(),
      }));

    // Insert new enrollments
    const enrollmentIds = await Promise.all(
      enrollments.map((enrollment) =>
        ctx.db.insert("class_students", enrollment)
      )
    );

    return enrollmentIds;
  },
});

// Remove a student from a class
export const removeStudent = mutation({
  args: {
    classId: v.id("classes"),
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => {
    const { classId, studentId } = args;

    // Find the enrollment
    const enrollment = await ctx.db
      .query("class_students")
      .withIndex("by_class", (q) => q.eq("classId", classId))
      .filter((q) => q.eq(q.field("studentId"), studentId))
      .first();

    if (!enrollment) {
      throw new Error("Student is not enrolled in this class");
    }

    // Delete the enrollment
    await ctx.db.delete(enrollment._id);
  },
});
