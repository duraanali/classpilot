import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyToken } from "@/lib/jwt";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

    // Verify token is valid before blacklisting
    try {
      verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    // Add token to blacklist
    await convex.mutation(api.tokenBlacklist.add, {
      token: token,
    });

    return NextResponse.json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred during logout",
      },
      { status: 500 }
    );
  }
}
