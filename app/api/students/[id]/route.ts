import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

    // Get student by ID and check if it belongs to the authenticated teacher
    const student = await convex.query(api.students.getByIdAndTeacher, {
      id: id as Id<"students">,
      teacherId: decoded.userId as any,
    });

    if (!student) {
      return NextResponse.json(
        {
          error: "Not found",
          message:
            "Student not found or you don't have permission to access it",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
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
        message: "An unexpected error occurred while fetching the student",
      },
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

    // Transform the data to match the Convex schema
    const updateData = {
      ...body,
    };

    // If age is provided, calculate grade
    if (body.age) {
      updateData.grade = Math.floor(body.age / 2) + 1;
    }

    console.log("Final update data:", updateData);

    // Check if student belongs to the authenticated teacher
    const existingStudent = await convex.query(api.students.getByIdAndTeacher, {
      id: id as Id<"students">,
      teacherId: decoded.userId as any,
    });

    if (!existingStudent) {
      return NextResponse.json(
        {
          error: "Not found",
          message:
            "Student not found or you don't have permission to modify it",
        },
        { status: 404 }
      );
    }

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
        message: "An unexpected error occurred while updating the student",
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Check if student belongs to the authenticated teacher
    const existingStudent = await convex.query(api.students.getByIdAndTeacher, {
      id: id as Id<"students">,
      teacherId: decoded.userId as any,
    });

    if (!existingStudent) {
      return NextResponse.json(
        {
          error: "Not found",
          message:
            "Student not found or you don't have permission to delete it",
        },
        { status: 404 }
      );
    }

    // Delete student from Convex
    await convex.mutation(api.students.remove, {
      id: id as Id<"students">,
    });

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
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
        message: "An unexpected error occurred while deleting the student",
      },
      { status: 500 }
    );
  }
}
