import { NextResponse } from "next/server";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Validation schema for creating a class
const createClassSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  subject: z.string(),
  grade_level: z.coerce.number().min(1).max(12),
  schedule: z.string(),
  capacity: z.coerce.number().min(1),
});

export async function GET(request: Request) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Get all classes
    const classes = await convex.query(api.classes.list);

    return NextResponse.json(classes);
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

export async function POST(request: Request) {
  let requestBody;
  try {
    // Get auth token from header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    // Parse request body
    requestBody = await request.json();
    console.log("Raw request body:", JSON.stringify(requestBody, null, 2));

    // Validate request body
    try {
      const validatedData = createClassSchema.parse(requestBody);
      console.log("Validated create data:", validatedData);

      // Transform the data to match the Convex schema
      const createData = {
        ...validatedData,
        gradeLevel: validatedData.grade_level,
        teacherId: decoded.userId,
      };
      delete createData.grade_level;

      console.log("Final create data:", createData);

      // Create class in Convex
      const classId = await convex.mutation(api.classes.create, createData);

      // Get created class
      const classData = await convex.query(api.classes.getById, {
        id: classId,
      });

      return NextResponse.json(classData, { status: 201 });
    } catch (validationError) {
      console.error("Validation error:", validationError);
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Invalid input",
            details: validationError.errors,
            received: requestBody,
            expected: {
              name: "string (min 2 chars)",
              description: "string (min 10 chars)",
              subject: "string",
              grade_level: "number (1-12)",
              schedule: "string",
              capacity: "number (min 1)",
            },
          },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error creating class:", error);
    if (error instanceof Error && error.message === "Invalid token") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
