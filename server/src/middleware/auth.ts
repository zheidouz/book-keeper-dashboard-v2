import { createClerkClient } from "@clerk/clerk-sdk-node";
import type { Request, Response, NextFunction } from "express";
import { db, schema } from "../db/adapter.js";
import { eq } from "drizzle-orm";
import type { AuthUser } from "../types/index.js";
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY || "" });
declare global { namespace Express { interface Request { authUser?: AuthUser; } } }

/**
 * Look up or create a user from a Clerk user ID, then set req.authUser.
 */
async function resolveClerkUser(clerkId: string): Promise<AuthUser | null> {
  if (!clerkId) return null;

  // Try to find existing user by clerkId or email
  let [user] = await db.select().from(schema.users).where(eq(schema.users.clerkId, clerkId));

  if (!user) {
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      const name = ((clerkUser.firstName || "") + " " + (clerkUser.lastName || "")).trim() || email;

      // Check if user already exists by email (from a previous partial creation)
      [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
      if (user) {
        // Update the existing user's clerkId to link them
        await db.update(schema.users).set({ clerkId }).where(eq(schema.users.id, user.id)).run();
        return user as AuthUser;
      }

      // First Clerk-authenticated user gets admin role
      const existingUsers = await db.select().from(schema.users);
      const isFirstUser = existingUsers.length === 0 || existingUsers.every((u: any) => u.clerkId === "default_admin");
      const role = isFirstUser ? "admin" : "encoder";

      // Insert with onConflictDoNothing to handle race conditions
      await db.insert(schema.users).values({ clerkId, name, email, role }).onConflictDoNothing().run();

      // Fetch the newly created (or existing) user
      [user] = await db.select().from(schema.users).where(eq(schema.users.clerkId, clerkId));
      if (!user) {
        [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
      }
    } catch (e: any) {
      console.error("resolveClerkUser error:", e?.message || e);
      return null;
    }
  }
  return user as AuthUser | null;
}

/**
 * Extract a Clerk session JWT from Express request:
 * 1. Authorization: Bearer <token> header
 * 2. __session cookie
 */
function extractClerkJwt(req: Request): string | null {
  // Try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Try __session cookie
  const cookies = req.headers.cookie;
  if (cookies) {
    for (const c of cookies.split(";")) {
      const [name, ...rest] = c.trim().split("=");
      if (name === "__session" || name === "__clerk_db_jwt") {
        return rest.join("=");
      }
    }
  }

  return null;
}

export async function clerkAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    let clerkId: string | undefined;

    // ── 1. Extract and verify Clerk JWT token ──
    const jwt = extractClerkJwt(req);

    if (jwt) {
      try {
        const jwtClaims = await clerkClient.verifyToken(jwt, {
          secretKey: process.env.CLERK_SECRET_KEY,
          issuer: null,
          clockSkewInMs: 60000,
        });
        if (jwtClaims.sub) {
          clerkId = jwtClaims.sub;
        }
      } catch (e: any) {
        console.error("Clerk verifyToken error:", e?.message || e, "jwt prefix:", jwt.substring(0, 20) + "...");
      }
    }

    // ── 2. Resolve Clerk user in database ──
    if (clerkId) {
      const user = await resolveClerkUser(clerkId);
      if (user) {
        req.authUser = user;
        return next();
      }
    }

    // ── 3. Dev mode fallback (no auth required) ──
    if (process.env.NODE_ENV !== "production" && !req.authUser) {
      const [admin] = await db.select().from(schema.users).where(eq(schema.users.role, "admin")).all();
      if (admin) { req.authUser = admin as AuthUser; }
    }

    next();
  } catch (error) { next(error); }
}
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) return res.status(401).json({ success: false, error: "Authentication required" });
    if (!roles.includes(req.authUser.role)) return res.status(403).json({ success: false, error: "Insufficient permissions" });
    next();
  };
}
