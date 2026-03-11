import { env } from "../config/env.js";
import nodemailer, { type Transporter } from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type TestEmailMessage = SendEmailInput & {
  sentAt: Date;
};

const testEmailOutbox: TestEmailMessage[] = [];
let smtpTransporter: Transporter | undefined;

export function clearTestEmailOutbox(): void {
  testEmailOutbox.length = 0;
}

export function getLatestTestEmail(to: string): TestEmailMessage | undefined {
  const normalizedRecipient = to.toLowerCase();

  return [...testEmailOutbox]
    .reverse()
    .find((message) => message.to === normalizedRecipient);
}

function getSmtpTransporter(): Transporter {
  if (smtpTransporter) {
    return smtpTransporter;
  }

  if (!env.email.smtpHost) {
    throw new Error("SMTP_HOST is required when EMAIL_PROVIDER=smtp.");
  }

  smtpTransporter = nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort,
    secure: env.email.smtpSecure,
    auth:
      env.email.smtpUser && env.email.smtpPass
        ? {
            user: env.email.smtpUser,
            pass: env.email.smtpPass,
          }
        : undefined,
  });

  return smtpTransporter;
}

async function sendWithSmtp(input: SendEmailInput): Promise<void> {
  const transporter = getSmtpTransporter();

  await transporter.sendMail({
    from: env.email.fromAddress,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

function logEmail(input: SendEmailInput): void {
  console.info(
    [
      "[email:log] Email delivery provider is set to log mode.",
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      input.text,
    ].join("\n"),
  );
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const normalizedInput = {
    ...input,
    to: input.to.toLowerCase(),
  };

  if (process.env.NODE_ENV === "test") {
    testEmailOutbox.push({
      ...normalizedInput,
      sentAt: new Date(),
    });
    return;
  }

  if (env.email.provider === "log") {
    logEmail(normalizedInput);
    return;
  }

  await sendWithSmtp(normalizedInput);
}

export async function sendEmailVerificationOtpEmail(input: {
  to: string;
  otp: string;
}): Promise<void> {
  const subject = "Rosatri email verification OTP";
  const text = [
    "Welcome to Rosatri.",
    `Your email verification OTP is: ${input.otp}`,
    `This OTP expires in ${env.email.otpExpiresInMinutes} minutes.`,
  ].join("\n");
  const html = [
    "<p>Welcome to Rosatri.</p>",
    `<p>Your email verification OTP is: <strong>${input.otp}</strong></p>`,
    `<p>This OTP expires in ${env.email.otpExpiresInMinutes} minutes.</p>`,
  ].join("");

  await sendEmail({
    to: input.to,
    subject,
    text,
    html,
  });
}
