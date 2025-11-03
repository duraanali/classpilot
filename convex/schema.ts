import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
    created_at: v.optional(v.number()),
  }).index("by_email", ["email"]),

  students: defineTable({
    name: v.string(),
    email: v.string(),
    grade: v.number(),
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    notes: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    teacherId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_teacher", ["teacherId"]),

  classes: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    gradeLevel: v.optional(v.number()),
    schedule: v.optional(v.string()),
    capacity: v.optional(v.number()),
    teacherId: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_teacher", ["teacherId"]),

  enrollments: defineTable({
    studentId: v.id("students"),
    classId: v.id("classes"),
    createdAt: v.string(),
  })
    .index("by_student", ["studentId"])
    .index("by_class", ["classId"]),

  grades: defineTable({
    studentId: v.id("students"),
    classId: v.id("classes"),
    score: v.number(),
    assignment: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_student", ["studentId"])
    .index("by_class", ["classId"]),

  class_students: defineTable({
    classId: v.id("classes"),
    studentId: v.id("students"),
    enrolledAt: v.string(),
  })
    .index("by_class", ["classId"])
    .index("by_student", ["studentId"]),

  tokenBlacklist: defineTable({
    token: v.string(),
    createdAt: v.string(),
  }).index("by_token", ["token"]),
});
