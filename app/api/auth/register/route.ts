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

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    try {
      // Create user in Convex
      const userId = await convex.mutation(api.users.create, {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
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

      // Return user data (excluding password) and token
      const { password, ...userWithoutPassword } = user;
      return NextResponse.json({
        token,
        user: userWithoutPassword,
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
