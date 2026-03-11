import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

const EMAIL_OTP_LENGTH = 6;
const EMAIL_OTP_REGEX = /^[0-9]{6}$/;
const EMAIL_OTP_MAX_VALUE = 10 ** EMAIL_OTP_LENGTH;

export function generateEmailVerificationOtp(): string {
  return randomInt(0, EMAIL_OTP_MAX_VALUE)
    .toString()
    .padStart(EMAIL_OTP_LENGTH, "0");
}

export function isValidEmailVerificationOtp(value: string): boolean {
  return EMAIL_OTP_REGEX.test(value);
}

export function hashEmailVerificationOtp(otp: string): string {
  return createHmac("sha256", env.auth.tokenSecret).update(otp).digest("hex");
}

export function verifyEmailVerificationOtp(
  otp: string,
  storedOtpHash: string,
): boolean {
  const currentOtpHash = Buffer.from(hashEmailVerificationOtp(otp));
  const expectedOtpHash = Buffer.from(storedOtpHash);

  if (currentOtpHash.length !== expectedOtpHash.length) {
    return false;
  }

  return timingSafeEqual(currentOtpHash, expectedOtpHash);
}