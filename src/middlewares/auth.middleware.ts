import type { NextFunction, Request, Response } from "express";
import { query } from "../config/db.js";
import { verifyAuthToken, type UserRole } from "../utils/token.js";

export type AuthenticatedUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  username: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  address: string | null;
  role: UserRole;
  createdAt: Date;
};

// Middleware RBAC (Role-Based Access Control).
//
// Cara kerjanya:
// 1. `requireAuth` harus dijalankan lebih dulu agar `response.locals.authUser`
//    terisi user terbaru dari database.
// 2. `requireRoles(...allowedRoles)` membaca role dari `authUser` tersebut.
// 3. Jika user belum ada -> `401 Authentication required`.
// 4. Jika user ada tetapi role tidak termasuk daftar yang diizinkan -> `403 Forbidden`.
// 5. Jika role cocok -> request diteruskan ke controller endpoint.
export function requireRoles(...allowedRoles: UserRole[]) {
  return (_request: Request, response: Response, next: NextFunction): void => {
    const authUser = response.locals.authUser as AuthenticatedUser | undefined;

    if (!authUser) {
      response.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!allowedRoles.includes(authUser.role)) {
      response.status(403).json({
        success: false,
        message: "Forbidden for current user role.",
      });
      return;
    }

    next();
  };
}

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    response.status(401).json({
      success: false,
      message: "Authentication token is required.",
    });
    return;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();
  const payload = verifyAuthToken(token);

  if (!payload) {
    response.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
    return;
  }

  try {
    const result = await query<AuthenticatedUser>(
      `
        SELECT
          id,
          first_name AS "firstName",
          last_name AS "lastName",
          username,
          email,
          email_verified AS "emailVerified",
          phone,
          address,
          role,
          created_at AS "createdAt"
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [payload.sub],
    );

    const user = result.rows[0];

    if (!user) {
      response.status(401).json({
        success: false,
        message: "Authenticated user no longer exists.",
      });
      return;
    }

    response.locals.authUser = user;
    next();
  } catch {
    response.status(500).json({
      success: false,
      message: "Failed to validate authentication token.",
    });
  }
}
