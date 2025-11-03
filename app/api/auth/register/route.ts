import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { generateToken } from "@/lib/jwt";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Hash password using bcrypt (this is fine in Next.js API routes)
    const hashedPassword = await bcrypt.hash(body.password, 10);

    try {
      // Create user in Convex with already hashed password
      const userId = await convex.mutation(api.users.create, {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: "Teacher",
      });

      // Generate token
      const token = generateToken({
        userId: userId as string,
        email: body.email,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
