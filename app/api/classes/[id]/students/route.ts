import { NextResponse } from "next/server";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Validation schema for assigning students
const assignStudentsSchema = z.object({
  student_ids: z
    .array(z.string())
    .min(1, "At least one student ID is required"),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

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

    // Check if teacher owns the class
    const classData = await convex.query(api.classes.getByIdAndTeacher, {
      id: id as Id<"classes">,
      teacherId: decoded.userId as any,
    });

    if (!classData) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Class not found or you don't have permission to access it",
        },
        { status: 404 }
      );
    }

    // Get students in class
    const students = await convex.query(api.class_students.listStudents, {
      classId: id as Id<"classes">,
    });

    return NextResponse.json(students);
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
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while fetching students",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

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
    const body = await request.json();
    const validatedData = assignStudentsSchema.parse(body);

    // Convert string IDs to Convex IDs
    const studentIds = validatedData.student_ids.map(
      (id) => id as Id<"students">
    );

    // Assign students to class with teacher authorization
    const enrollmentIds = await convex.mutation(
      api.class_students.assignStudents,
      {
        classId: id as Id<"classes">,
        studentIds,
        teacherId: decoded.userId as any,
      }
    );

    return NextResponse.json(
      {
        enrollmentIds,
        message: "Students enrolled successfully",
      },
      { status: 201 }
    );
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
          received: body,
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
    if (error instanceof Error && error.message.includes("capacity")) {
      return NextResponse.json(
        {
          error: "Capacity exceeded",
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
        message: "An unexpected error occurred while enrolling students",
      },
      { status: 500 }
    );
  }
}
