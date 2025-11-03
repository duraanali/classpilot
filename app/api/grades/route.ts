import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

    // Parse request body
    requestBody = await request.json();

    // Handle legacy 'title' field
    if (requestBody.title && !requestBody.assignment) {
      requestBody.assignment = requestBody.title;
      delete requestBody.title;
    }

    // Create grade in Convex with teacher authorization
    const gradeId = await convex.mutation(api.grades.create, {
      studentId: requestBody.student_id as Id<"students">,
      classId: requestBody.class_id as Id<"classes">,
      assignment: requestBody.assignment,
      score: requestBody.score,
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
