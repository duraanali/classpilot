import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { generateToken } from "@/lib/jwt";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Hash password using bcrypt (this is fine in Next.js API routes)
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    try {
      // Create user in Convex with already hashed password
      const userId = await convex.mutation(api.users.create, {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: "Teacher",
      });

      // Generate token
      const token = generateToken({
        userId: userId as string,
        email: validatedData.email,
      });

      // Get created user
      const user = await convex.query(api.users.getById, { id: userId });

      if (!user) {
        throw new Error("Failed to create user");
      }

      // Return user data and token (user already excludes password)
      return NextResponse.json({
        token,
        user,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
