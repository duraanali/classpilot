import { NextResponse } from "next/server";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Validation schema for updating a student
const updateStudentSchema = z.object({
  full_name: z.string().min(2).optional(),
  age: z.number().min(5).max(18).optional(),
  gender: z.string().optional(),
  notes: z.string().optional(),
  email: z.string().email().optional(),
  parentEmail: z.string().email().optional(),
  parentPhone: z.string().optional(),
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Get student by ID
    const student = await convex.query(api.students.getById, {
      id: id as Id<"students">,
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    console.log("Updating student with ID:", id);

    // Get auth token from header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const body = await request.json();
    console.log("Update request body:", body);

    // Ensure age is a number if provided
    if (body.age) {
      body.age = Number(body.age);
    }

    const validatedData = updateStudentSchema.parse(body);
    console.log("Validated update data:", validatedData);

    // Transform the data to match the Convex schema
    const updateData = {
      ...validatedData,
      name: validatedData.full_name, // Map full_name to name
    };
    delete updateData.full_name; // Remove full_name as it's not in the Convex schema

    // If age is provided, calculate grade
    if (validatedData.age) {
      updateData.grade = Math.floor(validatedData.age / 2) + 1;
    }

    console.log("Final update data:", updateData);

    // Update student in Convex
    await convex.mutation(api.students.update, {
      id: id as Id<"students">,
      ...updateData,
    });

    // Get updated student
    const student = await convex.query(api.students.getById, {
      id: id as Id<"students">,
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error updating student:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: error.errors,
          received: body,
        },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Get auth token from header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Delete student from Convex
    await convex.mutation(api.students.remove, {
      id: id as Id<"students">,
    });

    return NextResponse.json({ success: true });
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
