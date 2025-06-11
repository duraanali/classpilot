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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Parse and validate request body
    requestBody = await request.json();
    console.log("Create grade request body:", requestBody);

    // Handle legacy 'title' field
    if (requestBody.title && !requestBody.assignment) {
      requestBody.assignment = requestBody.title;
      delete requestBody.title;
    }

    const validatedData = createGradeSchema.parse(requestBody);
    console.log("Validated data:", validatedData);

    // First, try to get the student and class to verify they exist
    // and get their proper IDs
    const students = await convex.query(api.students.list);
    const student = students.find(
      (s) =>
        s._id === validatedData.student_id ||
        s._id.toString() === validatedData.student_id
    );

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const classes = await convex.query(api.classes.list);
    const classDetails = classes.find(
      (c) =>
        c._id === validatedData.class_id ||
        c._id.toString() === validatedData.class_id
    );

    if (!classDetails) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Create grade in Convex using the proper IDs
    const gradeId = await convex.mutation(api.grades.create, {
      studentId: student._id,
      classId: classDetails._id,
      assignment: validatedData.assignment,
      score: validatedData.score,
    });

    // Get created grade
    const grade = await convex.query(api.grades.getById, {
      id: gradeId,
    });

    return NextResponse.json(grade);
  } catch (error) {
    console.error("Error creating grade:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: error.errors,
          received: requestBody,
        },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("not enrolled")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
