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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Get students in class
    const students = await convex.query(api.class_students.listStudents, {
      classId: id as Id<"classes">,
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error listing students:", error);
    if (error instanceof Error && error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Parse and validate request body
    const body = await request.json();
    console.log("Assign students request body:", body);

    const validatedData = assignStudentsSchema.parse(body);
    console.log("Validated data:", validatedData);

    // Convert string IDs to Convex IDs
    const studentIds = validatedData.student_ids.map(
      (id) => id as Id<"students">
    );

    // Assign students to class
    const enrollmentIds = await convex.mutation(
      api.class_students.assignStudents,
      {
        classId: id as Id<"classes">,
        studentIds,
      }
    );

    return NextResponse.json({ enrollmentIds }, { status: 201 });
  } catch (error) {
    console.error("Error assigning students:", error);
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
    if (error instanceof Error && error.message.includes("capacity")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
