import { NextResponse } from "next/server";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Validation schema for creating a student
const createStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  grade: z
    .number()
    .min(1, "Grade must be at least 1")
    .max(12, "Grade must be at most 12"),
  age: z
    .number()
    .min(5, "Age must be at least 5")
    .max(18, "Age must be at most 18")
    .optional(),
  gender: z.string().optional(),
  notes: z.string().optional(),
  parentEmail: z.string().email("Invalid parent email").optional(),
  parentPhone: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Get students for the authenticated teacher
    const students = await convex.query(api.students.listByTeacher, {
      teacherId: decoded.userId as any,
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

export async function POST(request: Request) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Parse and validate request body
    const body = await request.json();
    console.log("Received request body:", body); // Debug log

    try {
      // Ensure age is a number
      if (body.age) {
        body.age = Number(body.age);
      }

      const validatedData = createStudentSchema.parse(body);
      console.log("Validated data:", validatedData); // Debug log

      // Calculate grade from age if age is provided, otherwise use the provided grade
      const grade = validatedData.age
        ? Math.floor(validatedData.age / 2) + 1
        : validatedData.grade;

      // Create student in Convex
      const studentId = await convex.mutation(api.students.create, {
        name: validatedData.name,
        email: validatedData.email,
        grade: grade,
        age: validatedData.age,
        gender: validatedData.gender,
        notes: validatedData.notes,
        parentEmail: validatedData.parentEmail,
        parentPhone: validatedData.parentPhone,
        teacherId: decoded.userId as any, // Add teacher_id from authenticated user
      });

      // Get created student
      const student = await convex.query(api.students.getById, {
        id: studentId,
      });

      if (!student) {
        throw new Error("Failed to create student");
      }

      return NextResponse.json(student);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("Validation error:", validationError.errors); // Debug log

        // Transform Zod errors to more user-friendly format
        const errorDetails = validationError.errors.map((error) => ({
          field: error.path.join("."),
          message: error.message,
          code: error.code,
        }));

        return NextResponse.json(
          {
            error: "Validation failed",
            message: "Please check the provided data and try again",
            details: errorDetails,
            received: body, // Include received data for debugging
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error creating student:", error); // Debug log

    if (error instanceof Error && error.message === "Invalid token") {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing authentication token",
        },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: "A student with this email already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while creating the student",
      },
      { status: 500 }
    );
  }
}
