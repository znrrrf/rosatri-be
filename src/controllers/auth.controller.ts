import type { Request, Response } from "express";
import { query } from "../config/db.js";
import { env } from "../config/env.js";
import type { AuthenticatedUser } from "../middlewares/auth.middleware.js";
import { sendEmailVerificationOtpEmail } from "../services/email.service.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  generateEmailVerificationOtp,
  hashEmailVerificationOtp,
  isValidEmailVerificationOtp,
  verifyEmailVerificationOtp,
} from "../utils/otp.js";
import { createAuthToken, type UserRole } from "../utils/token.js";

type RegisterUserBody = {
  firstName?: unknown;
  lastName?: unknown;
  username?: unknown;
  email?: unknown;
  password?: unknown;
  phone?: unknown;
  address?: unknown;
};

type LoginUserBody = {
  identifier?: unknown;
  password?: unknown;
};

type VerifyEmailOtpBody = {
  email?: unknown;
  otp?: unknown;
};

type UpdateCurrentUserBody = {
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  address?: unknown;
};

type RegisterUserInput = {
  firstName: string;
  lastName: string | null;
  username: string;
  email: string;
  password: string;
  phone: string | null;
  address: string | null;
};

type RegisteredUserRow = {
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

type LoginUserInput = {
  identifier: string;
  password: string;
};

type VerifyEmailOtpInput = {
  email: string;
  otp: string;
};

type UpdateCurrentUserInput = {
  firstName: string;
  lastName: string | null;
  phone: string | null;
  address: string | null;
};

type LoginUserRow = RegisteredUserRow & {
  passwordHash: string;
};

type EmailVerificationRow = RegisteredUserRow & {
  emailVerificationOtpHash: string | null;
  emailVerificationOtpExpiresAt: Date | null;
};

type DatabaseError = Error & {
  code?: string;
  constraint?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toSafeUser(user: RegisteredUserRow): RegisteredUserRow {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    phone: user.phone,
    address: user.address,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function getRequiredString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function getOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function parseRegisterUserInput(body: RegisterUserBody): {
  data?: RegisterUserInput;
  message?: string;
} {
  const firstName = getRequiredString(body.firstName);

  if (!firstName) {
    return { message: "firstName is required." };
  }

  const username = getRequiredString(body.username);

  if (!username || username.length < 3) {
    return { message: "username must be at least 3 characters long." };
  }

  const emailValue = getRequiredString(body.email);
  const email = emailValue?.toLowerCase();

  if (!email || !EMAIL_REGEX.test(email)) {
    return { message: "A valid email is required." };
  }

  if (typeof body.password !== "string" || body.password.length < 8) {
    return { message: "password must be at least 8 characters long." };
  }

  return {
    data: {
      firstName,
      lastName: getOptionalString(body.lastName),
      username,
      email,
      password: body.password,
      phone: getOptionalString(body.phone),
      address: getOptionalString(body.address),
    },
  };
}

function parseLoginUserInput(body: LoginUserBody): {
  data?: LoginUserInput;
  message?: string;
} {
  const identifier = getRequiredString(body.identifier);

  if (!identifier) {
    return { message: "identifier is required." };
  }

  if (typeof body.password !== "string" || body.password.length < 8) {
    return { message: "password must be at least 8 characters long." };
  }

  return {
    data: {
      identifier: identifier.toLowerCase(),
      password: body.password,
    },
  };
}

function parseVerifyEmailOtpInput(body: VerifyEmailOtpBody): {
  data?: VerifyEmailOtpInput;
  message?: string;
} {
  const emailValue = getRequiredString(body.email);
  const email = emailValue?.toLowerCase();

  if (!email || !EMAIL_REGEX.test(email)) {
    return { message: "A valid email is required." };
  }

  const otp = getRequiredString(body.otp);

  if (!otp || !isValidEmailVerificationOtp(otp)) {
    return { message: "otp must be a 6-digit numeric string." };
  }

  return {
    data: {
      email,
      otp,
    },
  };
}

function parseNullableProfileField(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function parseCurrentUserUpdateInput(
  body: UpdateCurrentUserBody,
  currentUser: AuthenticatedUser,
): {
  data?: UpdateCurrentUserInput;
  message?: string;
} {
  const hasAnyField = ["firstName", "lastName", "phone", "address"].some(
    (field) => Object.prototype.hasOwnProperty.call(body, field),
  );

  if (!hasAnyField) {
    return {
      message:
        "At least one of firstName, lastName, phone, or address must be provided.",
    };
  }

  let firstName = currentUser.firstName;
  let lastName = currentUser.lastName;
  let phone = currentUser.phone;
  let address = currentUser.address;

  if (Object.prototype.hasOwnProperty.call(body, "firstName")) {
    const parsedFirstName = getRequiredString(body.firstName);

    if (!parsedFirstName) {
      return { message: "firstName must be a non-empty string." };
    }

    firstName = parsedFirstName;
  }

  if (Object.prototype.hasOwnProperty.call(body, "lastName")) {
    const parsedLastName = parseNullableProfileField(body.lastName);

    if (parsedLastName === undefined && body.lastName !== undefined) {
      return { message: "lastName must be a string or null." };
    }

    lastName = parsedLastName ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "phone")) {
    const parsedPhone = parseNullableProfileField(body.phone);

    if (parsedPhone === undefined && body.phone !== undefined) {
      return { message: "phone must be a string or null." };
    }

    phone = parsedPhone ?? null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "address")) {
    const parsedAddress = parseNullableProfileField(body.address);

    if (parsedAddress === undefined && body.address !== undefined) {
      return { message: "address must be a string or null." };
    }

    address = parsedAddress ?? null;
  }

  return {
    data: {
      firstName,
      lastName,
      phone,
      address,
    },
  };
}

export async function registerUser(
  request: Request,
  response: Response,
): Promise<void> {
  const { data, message } = parseRegisterUserInput(
    request.body as RegisterUserBody,
  );

  if (!data) {
    response.status(400).json({
      success: false,
      message,
    });
    return;
  }

  const passwordHash = await hashPassword(data.password);
  const emailVerificationOtp = generateEmailVerificationOtp();
  const emailVerificationOtpHash =
    hashEmailVerificationOtp(emailVerificationOtp);
  const emailVerificationOtpExpiresAt = new Date(
    Date.now() + env.email.otpExpiresInMinutes * 60 * 1000,
  );

  try {
    const result = await query<RegisteredUserRow>(
      `
        INSERT INTO users (
          first_name,
          last_name,
          username,
          email,
          password_hash,
          email_verified,
          email_verification_otp_hash,
          email_verification_otp_expires_at,
          phone,
          address,
          role
        )
        VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8, $9, 'renter')
        RETURNING
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
      `,
      [
        data.firstName,
        data.lastName,
        data.username,
        data.email,
        passwordHash,
        emailVerificationOtpHash,
        emailVerificationOtpExpiresAt,
        data.phone,
        data.address,
      ],
    );

    const user = result.rows[0];

    try {
      await sendEmailVerificationOtpEmail({
        to: data.email,
        otp: emailVerificationOtp,
      });
    } catch {
      await query("DELETE FROM users WHERE id = $1", [user.id]).catch(
        () => undefined,
      );

      response.status(500).json({
        success: false,
        message: "Failed to send email verification OTP.",
      });
      return;
    }

    response.status(201).json({
      success: true,
      message: "User registered successfully. OTP sent to email.",
      data: {
        ...toSafeUser(user),
        verificationRequired: true,
      },
    });
  } catch (error: unknown) {
    const databaseError = error as DatabaseError;

    if (databaseError.code === "23505") {
      const duplicateField =
        databaseError.constraint === "users_email_key" ? "email" : "username";

      response.status(409).json({
        success: false,
        message: `${duplicateField} is already in use.`,
      });
      return;
    }

    response.status(500).json({
      success: false,
      message: "Failed to register user.",
    });
  }
}

export async function loginUser(
  request: Request,
  response: Response,
): Promise<void> {
  const { data, message } = parseLoginUserInput(request.body as LoginUserBody);

  if (!data) {
    response.status(400).json({
      success: false,
      message,
    });
    return;
  }

  try {
    const result = await query<LoginUserRow>(
      `
        SELECT
          id,
          first_name AS "firstName",
          last_name AS "lastName",
          username,
          email,
          password_hash AS "passwordHash",
          email_verified AS "emailVerified",
          phone,
          address,
          role,
          created_at AS "createdAt"
        FROM users
        WHERE LOWER(email) = $1 OR LOWER(username) = $1
        LIMIT 1
      `,
      [data.identifier],
    );

    const user = result.rows[0];

    if (!user) {
      response.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
      return;
    }

    const passwordMatches = await verifyPassword(
      data.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      response.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
      return;
    }

    if (!user.emailVerified) {
      response.status(403).json({
        success: false,
        message: "Email address is not verified. Please verify OTP first.",
      });
      return;
    }

    response.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        accessToken: createAuthToken({
          sub: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        }),
        user: toSafeUser(user),
      },
    });
  } catch {
    response.status(500).json({
      success: false,
      message: "Failed to login user.",
    });
  }
}

export async function verifyEmailOtp(
  request: Request,
  response: Response,
): Promise<void> {
  const { data, message } = parseVerifyEmailOtpInput(
    request.body as VerifyEmailOtpBody,
  );

  if (!data) {
    response.status(400).json({
      success: false,
      message,
    });
    return;
  }

  try {
    const result = await query<EmailVerificationRow>(
      `
        SELECT
          id,
          first_name AS "firstName",
          last_name AS "lastName",
          username,
          email,
          email_verified AS "emailVerified",
          email_verification_otp_hash AS "emailVerificationOtpHash",
          email_verification_otp_expires_at AS "emailVerificationOtpExpiresAt",
          phone,
          address,
          role,
          created_at AS "createdAt"
        FROM users
        WHERE LOWER(email) = $1
        LIMIT 1
      `,
      [data.email],
    );

    const user = result.rows[0];

    if (!user) {
      response.status(400).json({
        success: false,
        message: "Invalid or expired email verification OTP.",
      });
      return;
    }

    if (user.emailVerified) {
      response.status(200).json({
        success: true,
        message: "Email is already verified.",
        data: toSafeUser(user),
      });
      return;
    }

    if (
      !user.emailVerificationOtpHash ||
      !user.emailVerificationOtpExpiresAt ||
      user.emailVerificationOtpExpiresAt.getTime() < Date.now() ||
      !verifyEmailVerificationOtp(data.otp, user.emailVerificationOtpHash)
    ) {
      response.status(400).json({
        success: false,
        message: "Invalid or expired email verification OTP.",
      });
      return;
    }

    const updateResult = await query<RegisteredUserRow>(
      `
        UPDATE users
        SET
          email_verified = true,
          email_verification_otp_hash = NULL,
          email_verification_otp_expires_at = NULL
        WHERE id = $1
        RETURNING
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
      `,
      [user.id],
    );

    response.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: toSafeUser(updateResult.rows[0]),
    });
  } catch {
    response.status(500).json({
      success: false,
      message: "Failed to verify email OTP.",
    });
  }
}

export async function getCurrentUser(
  _request: Request,
  response: Response,
): Promise<void> {
  const user = response.locals.authUser as AuthenticatedUser | undefined;

  if (!user) {
    response.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  response.status(200).json({
    success: true,
    message: "Authenticated user retrieved successfully.",
    data: user,
  });
}

export async function updateCurrentUser(
  request: Request,
  response: Response,
): Promise<void> {
  const currentUser = response.locals.authUser as AuthenticatedUser | undefined;

  if (!currentUser) {
    response.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  const { data, message } = parseCurrentUserUpdateInput(
    request.body as UpdateCurrentUserBody,
    currentUser,
  );

  if (!data) {
    response.status(400).json({
      success: false,
      message,
    });
    return;
  }

  try {
    const result = await query<RegisteredUserRow>(
      `
        UPDATE users
        SET
          first_name = $1,
          last_name = $2,
          phone = $3,
          address = $4
        WHERE id = $5
        RETURNING
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
      `,
      [data.firstName, data.lastName, data.phone, data.address, currentUser.id],
    );

    const updatedUser = result.rows[0];

    response.locals.authUser = updatedUser;
    response.status(200).json({
      success: true,
      message: "Authenticated user updated successfully.",
      data: toSafeUser(updatedUser),
    });
  } catch {
    response.status(500).json({
      success: false,
      message: "Failed to update authenticated user.",
    });
  }
}

export async function getAdminArea(
  _request: Request,
  response: Response,
): Promise<void> {
  // Endpoint contoh untuk membuktikan bahwa RBAC level `admin` bekerja.
  // Pada titik ini, request seharusnya sudah lolos `requireAuth`
  // dan `requireRoles("admin")` dari layer route.
  const user = response.locals.authUser as AuthenticatedUser | undefined;

  if (!user) {
    response.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  response.status(200).json({
    success: true,
    message: "Admin area accessed successfully.",
    data: {
      allowedRoles: ["admin"],
      user,
    },
  });
}

export async function getStaffArea(
  _request: Request,
  response: Response,
): Promise<void> {
  // Endpoint contoh untuk area staff bersama.
  // Route ini menerima user dengan role `owner` atau `admin`,
  // sehingga controller cukup mengembalikan bukti user yang lolos.
  const user = response.locals.authUser as AuthenticatedUser | undefined;

  if (!user) {
    response.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  response.status(200).json({
    success: true,
    message: "Staff area accessed successfully.",
    data: {
      allowedRoles: ["owner", "admin"],
      user,
    },
  });
}
