import { NextResponse } from "next/server";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Validation schema for creating a grade
const createGradeSchema = z.object({
  student_id: z.string().min(1, "Student ID is required"),
  class_id: z.string().min(1, "Class ID is required"),
  assignment: z.string().min(1, "Assignment name is required"),
  score: z.number().min(0).max(100, "Score must be between 0 and 100"),
});

export async function POST(request: Request) {
  let requestBody: any;
  try {
    // Get auth token from header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Parse and validate request body
    requestBody = await request.json();

    // Handle legacy 'title' field
    if (requestBody.title && !requestBody.assignment) {
      requestBody.assignment = requestBody.title;
      delete requestBody.title;
    }

    const validatedData = createGradeSchema.parse(requestBody);

    // Create grade in Convex with teacher authorization
    const gradeId = await convex.mutation(api.grades.create, {
      studentId: validatedData.student_id as Id<"students">,
      classId: validatedData.class_id as Id<"classes">,
      assignment: validatedData.assignment,
      score: validatedData.score,
      teacherId: decoded.userId as any,
    });

    // Get created grade with teacher authorization
    const grade = await convex.query(api.grades.getById, {
      id: gradeId,
      teacherId: decoded.userId as any,
    });

    if (!grade) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Grade not found or you don't have permission to access it",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(grade, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      }));

      return NextResponse.json(
        {
          error: "Validation failed",
          message: "Please check the provided data and try again",
          details: errorDetails,
          received: requestBody,
        },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Invalid token") {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
        },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message.includes("not enrolled")) {
      return NextResponse.json(
        {
          error: "Enrollment error",
          message: error.message,
        },
        { status: 400 }
      );
    }
    if (
      error instanceof Error &&
      error.message.includes("not owned by teacher")
    ) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: error.message,
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while creating the grade",
      },
      { status: 500 }
    );
  }
}
