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

    // Get user with password for verification
    const user = await convex.query(api.users.getByEmailWithPassword, {
      email: body.email,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(
      body.password,
      user.password
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken({
      userId: user._id as string,
      email: user.email,
    });

    // Return user data (excluding password) and token
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
