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
    console.log("Removing student", studentId, "from class", id);

    // Get auth token from header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Verify class exists
    const classData = await convex.query(api.classes.getById, {
      id: id as Id<"classes">,
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Verify student exists
    const studentData = await convex.query(api.students.getById, {
      id: studentId as Id<"students">,
    });

    if (!studentData) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Find and remove the enrollment
    const enrollment = await convex.query(api.class_students.getEnrollment, {
      classId: id as Id<"classes">,
      studentId: studentId as Id<"students">,
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Student is not enrolled in this class" },
        { status: 404 }
      );
    }

    // Remove student from class
    await convex.mutation(api.class_students.removeStudent, {
      classId: id as Id<"classes">,
      studentId: studentId as Id<"students">,
    });

    return NextResponse.json({
      success: true,
      message: "Student removed from class successfully",
    });
  } catch (error) {
    console.error("Error removing student:", error);
    if (error instanceof Error && error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("not enrolled")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
