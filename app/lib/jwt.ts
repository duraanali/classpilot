import jwt from "jsonwebtoken";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const generateToken = (payload: {
  userId: string;
  email: string;
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
};

// Verify token and check if it's blacklisted
export const verifyTokenWithBlacklist = async (token: string) => {
  // First verify the token is valid
  const decoded = verifyToken(token);

  // Then check if it's blacklisted
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const isBlacklisted = await convex.query(api.tokenBlacklist.isBlacklisted, {
    token: token,
  });

  if (isBlacklisted) {
    throw new Error("Token has been revoked");
  }

  return decoded;
};

export const extractTokenFromHeader = (
  authHeader: string | undefined
): string => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided");
  }
  return authHeader.split(" ")[1];
};
