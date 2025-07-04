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

// Check if teacher owns both class and students
export const checkTeacherAuthorization = query({
  args: {
    teacherId: v.id("users"),
    classId: v.id("classes"),
    studentIds: v.array(v.id("students")),
  },
  handler: async (ctx, args) => {
    const { teacherId, classId, studentIds } = args;

    // Check if teacher owns the class
    const classData = await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .filter((q) => q.eq(q.field("_id"), classId))
      .first();

    if (!classData) {
      return {
        authorized: false,
        reason: "Class not found or not owned by teacher",
      };
    }

    // Check if teacher owns all students
    const students = await ctx.db
      .query("students")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .filter((q) => studentIds.some((id) => q.eq(q.field("_id"), id)))
      .collect();

    if (students.length !== studentIds.length) {
      return {
        authorized: false,
        reason: "Some students not found or not owned by teacher",
      };
    }

    return { authorized: true };
  },
});

// Assign students to a class
export const assignStudents = mutation({
  args: {
    classId: v.id("classes"),
    studentIds: v.array(v.id("students")),
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { classId, studentIds, teacherId } = args;

    // Check teacher authorization
    const authCheck = await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .filter((q) => q.eq(q.field("_id"), classId))
      .first();

    if (!authCheck) {
      throw new Error("Class not found or not owned by teacher");
    }

    // Check if teacher owns all students
    const students = await ctx.db
      .query("students")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .filter((q) => studentIds.some((id) => q.eq(q.field("_id"), id)))
      .collect();

    if (students.length !== studentIds.length) {
      throw new Error("Some students not found or not owned by teacher");
    }

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
    if (
      classData.capacity &&
      currentEnrollments.length + studentIds.length > classData.capacity
    ) {
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
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { classId, studentId, teacherId } = args;

    // Check teacher authorization for class
    const classData = await ctx.db
      .query("classes")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .filter((q) => q.eq(q.field("_id"), classId))
      .first();

    if (!classData) {
      throw new Error("Class not found or not owned by teacher");
    }

    // Check teacher authorization for student
    const studentData = await ctx.db
      .query("students")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacherId))
      .filter((q) => q.eq(q.field("_id"), studentId))
      .first();

    if (!studentData) {
      throw new Error("Student not found or not owned by teacher");
    }

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
