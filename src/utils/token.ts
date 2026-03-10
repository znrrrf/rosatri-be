import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

export type UserRole = "admin" | "owner" | "renter";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
};

type AuthTokenInput = Omit<AuthTokenPayload, "iat" | "exp">;

function signTokenValue(value: string): string {
  return createHmac("sha256", env.auth.tokenSecret)
    .update(value)
    .digest("base64url");
}

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeJson<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function createAuthToken(payload: AuthTokenInput): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + env.auth.tokenExpiresInHours * 60 * 60;

  const encodedHeader = encodeJson({ alg: "HS256", typ: "JWT" });
  const encodedPayload = encodeJson({
    ...payload,
    iat: issuedAt,
    exp: expiresAt,
  });

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = signTokenValue(unsignedToken);

  return `${unsignedToken}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const [encodedHeader, encodedPayload, signature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signTokenValue(`${encodedHeader}.${encodedPayload}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
    return null;
  }

  const header = decodeJson<{ alg?: string; typ?: string }>(encodedHeader);
  const payload = decodeJson<Partial<AuthTokenPayload>>(encodedPayload);

  if (header?.alg !== "HS256" || header?.typ !== "JWT") {
    return null;
  }

  if (
    !payload?.sub ||
    !payload.email ||
    !payload.username ||
    !payload.role ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload as AuthTokenPayload;
}