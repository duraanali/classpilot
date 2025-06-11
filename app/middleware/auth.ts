import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader } from "../lib/jwt";

export async function authMiddleware(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    const payload = verifyToken(token);

    // Add the user ID to the request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
