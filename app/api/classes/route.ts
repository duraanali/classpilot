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

    // Get only classes for the authenticated teacher
    const classes = await convex.query(api.classes.listByTeacher, {
      teacherId: decoded.userId,
    });

    return NextResponse.json(classes, { status: 200 });
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
        message: "An unexpected error occurred while fetching classes",
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

    // Parse request body
    const requestBody = await request.json();

    // Transform the data to match the Convex schema
    const createData = {
      ...requestBody,
      gradeLevel: requestBody.grade_level,
      teacherId: decoded.userId,
    };
    delete createData.grade_level;

    // Create class in Convex
    const classId = await convex.mutation(api.classes.create, createData);

    // Get created class
    const classData = await convex.query(api.classes.getById, {
      id: classId,
    });

    return NextResponse.json(classData, { status: 201 });
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
        message: "An unexpected error occurred while creating the class",
      },
      { status: 500 }
    );
  }
}
