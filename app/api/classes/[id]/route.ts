import { NextResponse } from "next/server";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Validation schema for updating a class
const updateClassSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .optional(),
  subject: z.string().optional(),
  grade_level: z.number().min(1).max(12).optional(),
  schedule: z.string().optional(),
  capacity: z.number().min(1).optional(),
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

    // Get class by ID and check teacher authorization
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

    // Get enrolled students for this class
    const enrolledStudents = await convex.query(
      api.class_students.listStudents,
      {
        classId: id as Id<"classes">,
      }
    );

    // Return class data with enrolled students
    const response = {
      ...classData,
      students: enrolledStudents,
      studentCount: enrolledStudents.length,
    };

    return NextResponse.json(response);
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
        message: "An unexpected error occurred while fetching the class",
      },
      { status: 500 }
    );
  }
}

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

    // Check if teacher owns the class
    const existingClass = await convex.query(api.classes.getByIdAndTeacher, {
      id: id as Id<"classes">,
      teacherId: decoded.userId as any,
    });

    if (!existingClass) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Class not found or you don't have permission to modify it",
        },
        { status: 404 }
      );
    }

    requestBody = await request.json();
    const validatedData = updateClassSchema.parse(requestBody);

    // Transform the data to match the Convex schema
    const updateData = {
      ...validatedData,
      gradeLevel: validatedData.grade_level,
    };
    delete updateData.grade_level;

    // Update class in Convex
    await convex.mutation(api.classes.update, {
      id: id as Id<"classes">,
      ...updateData,
    });

    // Get updated class with students
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

    // Get enrolled students for this class
    const enrolledStudents = await convex.query(
      api.class_students.listStudents,
      {
        classId: id as Id<"classes">,
      }
    );

    // Return class data with enrolled students
    const response = {
      ...classData,
      students: enrolledStudents,
      studentCount: enrolledStudents.length,
    };

    return NextResponse.json(response);
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
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while updating the class",
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

    // Check if teacher owns the class
    const existingClass = await convex.query(api.classes.getByIdAndTeacher, {
      id: id as Id<"classes">,
      teacherId: decoded.userId as any,
    });

    if (!existingClass) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Class not found or you don't have permission to delete it",
        },
        { status: 404 }
      );
    }

    // Delete class from Convex
    await convex.mutation(api.classes.remove, {
      id: id as Id<"classes">,
    });

    return NextResponse.json({
      success: true,
      message: "Class deleted successfully",
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
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while deleting the class",
      },
      { status: 500 }
    );
  }
}
