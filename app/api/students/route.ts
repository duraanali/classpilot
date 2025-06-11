import { NextResponse } from "next/server";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Validation schema for creating a student
const createStudentSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  age: z
    .number()
    .min(5, "Age must be at least 5")
    .max(18, "Age must be at most 18"),
  gender: z.string().optional(),
  notes: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
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

    // Get all students (in a real app, you might want to paginate this)
    const students = await convex.query(api.students.list);

    return NextResponse.json(students);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
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

      // Calculate grade from age (approximate)
      const grade = Math.floor(validatedData.age / 2) + 1;

      // Create student in Convex
      const studentId = await convex.mutation(api.students.create, {
        name: validatedData.full_name,
        email:
          validatedData.email ||
          `${validatedData.full_name.toLowerCase().replace(/\s+/g, ".")}@classpilot.com`,
        grade: grade,
        age: validatedData.age,
        gender: validatedData.gender,
        notes: validatedData.notes,
        parentEmail: validatedData.parentEmail,
        parentPhone: validatedData.parentPhone,
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
        return NextResponse.json(
          {
            error: "Invalid input",
            details: validationError.errors,
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
