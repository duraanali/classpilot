import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; studentId: string } }
) {
  try {
    const { id, studentId } = await params;

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

    // Remove student from class with teacher authorization
    await convex.mutation(api.class_students.removeStudent, {
      classId: id as Id<"classes">,
      studentId: studentId as Id<"students">,
      teacherId: decoded.userId as any,
    });

    return NextResponse.json({
      success: true,
      message: "Student removed from class successfully",
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
    if (error instanceof Error && error.message.includes("not enrolled")) {
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
        message: "An unexpected error occurred while removing the student",
      },
      { status: 500 }
    );
  }
}
