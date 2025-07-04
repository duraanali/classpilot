import { NextResponse } from "next/server";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Validation schema for updating a grade
const updateGradeSchema = z.object({
  assignment: z.string().min(1, "Assignment name is required").optional(),
  score: z
    .number()
    .min(0)
    .max(100, "Score must be between 0 and 100")
    .optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  let requestBody;
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
    requestBody = await request.json();
    const validatedData = updateGradeSchema.parse(requestBody);

    // Update grade in Convex with teacher authorization
    await convex.mutation(api.grades.update, {
      id: id as Id<"grades">,
      ...validatedData,
      teacherId: decoded.userId as any,
    });

    // Get updated grade with teacher authorization
    const grade = await convex.query(api.grades.getById, {
      id: id as Id<"grades">,
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

    return NextResponse.json(grade);
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
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          error: "Not found",
          message: error.message,
        },
        { status: 404 }
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
        message: "An unexpected error occurred while updating the grade",
      },
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

    // Delete grade with teacher authorization
    await convex.mutation(api.grades.remove, {
      id: id as Id<"grades">,
      teacherId: decoded.userId as any,
    });

    return NextResponse.json({
      success: true,
      message: "Grade deleted successfully",
    });
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
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          error: "Not found",
          message: error.message,
        },
        { status: 404 }
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
        message: "An unexpected error occurred while deleting the grade",
      },
      { status: 500 }
    );
  }
}
