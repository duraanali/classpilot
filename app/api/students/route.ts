import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

    // Parse request body
    const body = await request.json();
    console.log("Received request body:", body); // Debug log

    // Ensure age is a number if provided
    if (body.age) {
      body.age = Number(body.age);
    }

    // Calculate grade from age if age is provided, otherwise use the provided grade
    const grade = body.age
      ? Math.floor(body.age / 2) + 1
      : body.grade;

    // Create student in Convex
    const studentId = await convex.mutation(api.students.create, {
      name: body.name,
      email: body.email,
      grade: grade,
      age: body.age,
      gender: body.gender,
      notes: body.notes,
      parentEmail: body.parentEmail,
      parentPhone: body.parentPhone,
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
