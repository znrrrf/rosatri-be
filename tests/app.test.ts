import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import request from "supertest";
import { closeDatabaseConnection, query } from "../src/config/db.js";

process.env.NODE_ENV = "test";

const { default: app } = await import("../src/app.js");
const { clearTestEmailOutbox, getLatestTestEmail } =
  await import("../src/services/email.service.js");

/**
 * Panduan file test ini:
 * - File ini dipakai untuk integration test endpoint HTTP utama backend.
 * - Gunakan nama test dengan pola: `METHOD /path should expected behavior`.
 * - Urutan isi file: type helper -> helper setup/cleanup -> `test.after()` -> test per fitur.
 * - Saat menambah endpoint baru, minimal tulis success case dan error case terpenting.
 * - Jika endpoint protected, tambahkan test `401` untuk request tanpa token.
 * - Jika endpoint memakai role, tambahkan test `403` untuk role yang ditolak dan `200` untuk role yang diizinkan.
 * - Gunakan `randomUUID()` untuk data unik agar test tidak bentrok dengan data lama.
 * - Query database hanya dipakai untuk memverifikasi side effect penting, misalnya password hash tersimpan atau profil benar-benar ter-update.
 * - Jika setup berulang mulai muncul di 2+ test, pindahkan ke helper lokal di file ini.
 * - Selalu cleanup data test yang Anda buat sendiri.
 */

type PasswordRow = {
  password_hash: string;
  email_verified: boolean;
  email_verification_otp_hash: string | null;
  email_verification_otp_expires_at: Date | null;
};

type ProfileRow = {
  first_name: string;
  last_name: string | null;
  phone: string | null;
  address: string | null;
};

type UserRole = "admin" | "owner" | "renter";

async function cleanupTestUser(email: string, username: string): Promise<void> {
  await query("DELETE FROM users WHERE email = $1 OR username = $2", [
    email,
    username,
  ]);
}

function getLatestOtpForEmail(email: string): string {
  const latestEmail = getLatestTestEmail(email);

  assert.ok(latestEmail, `Expected OTP email for ${email}.`);

  const otpMatch = latestEmail.text.match(/\b([0-9]{6})\b/);

  assert.ok(otpMatch, `Expected 6-digit OTP inside latest email for ${email}.`);

  return otpMatch[1];
}

async function verifyTestUserEmail(email: string): Promise<void> {
  const otp = getLatestOtpForEmail(email);
  const response = await request(app)
    .post("/api/v1/auth/verify-email-otp")
    .send({
      email,
      otp,
    });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
}

async function updateTestUserRole(
  email: string,
  role: UserRole,
): Promise<void> {
  await query("UPDATE users SET role = $1 WHERE email = $2", [role, email]);
}

async function createAuthenticatedTestUser(role: UserRole): Promise<{
  email: string;
  username: string;
  accessToken: string;
}> {
  const suffix = randomUUID();
  const email = `rbac-${role}-${suffix}@example.com`;
  const username = `rbac_${suffix.replace(/-/g, "").slice(0, 12)}`;
  const password = "rahasia123";

  await cleanupTestUser(email, username);
  clearTestEmailOutbox();

  const registerResponse = await request(app)
    .post("/api/v1/auth/register")
    .send({
      firstName: "Rosatri",
      lastName: "RBAC",
      username,
      email,
      password,
    });

  assert.equal(registerResponse.statusCode, 201);

  await verifyTestUserEmail(email);

  if (role !== "renter") {
    await updateTestUserRole(email, role);
  }

  const loginResponse = await request(app).post("/api/v1/auth/login").send({
    identifier: email,
    password,
  });

  assert.equal(loginResponse.statusCode, 200);

  return {
    email,
    username,
    accessToken: loginResponse.body.data.accessToken,
  };
}

test.after(async () => {
  await closeDatabaseConnection();
});

// Fondasi endpoint publik yang harus tetap hidup walaupun fitur lain berubah.
test("GET / should return backend metadata", async () => {
  const response = await request(app).get("/");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.service, "Rosatri Backend API");
});

test("GET /unknown-route should return 404 response", async () => {
  const response = await request(app).get("/unknown-route");

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.success, false);
});

test("GET /api/v1/health should return service and database status", async () => {
  const response = await request(app).get("/api/v1/health");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.service, "Rosatri Backend API");
  assert.equal(response.body.data.database.ok, true);
});

// Auth dasar: validasi register, login, dan response aman tanpa data sensitif.
test("POST /api/v1/auth/register should validate required fields", async () => {
  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Rosatri",
    username: "ro",
    email: "invalid-email",
    password: "123",
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
});

test("POST /api/v1/auth/register should create renter user and store hashed password", async () => {
  const suffix = randomUUID();
  const email = `register-${suffix}@example.com`;
  const username = `register_${suffix.replace(/-/g, "").slice(0, 12)}`;
  const password = "rahasia123";

  await cleanupTestUser(email, username);
  clearTestEmailOutbox();

  const response = await request(app).post("/api/v1/auth/register").send({
    firstName: "Rosatri",
    lastName: "Tester",
    username,
    email,
    password,
    phone: "08123456789",
    address: "Jl. Mawar No. 1",
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.email, email);
  assert.equal(response.body.data.username, username);
  assert.equal(response.body.data.role, "renter");
  assert.equal(response.body.data.emailVerified, false);
  assert.equal(response.body.data.verificationRequired, true);
  assert.equal("passwordHash" in response.body.data, false);
  assert.equal("password" in response.body.data, false);

  const latestEmail = getLatestTestEmail(email);

  assert.ok(latestEmail);
  assert.equal(latestEmail.subject, "Rosatri email verification OTP");

  const databaseResult = await query<PasswordRow>(
    `
      SELECT
        password_hash,
        email_verified,
        email_verification_otp_hash,
        email_verification_otp_expires_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  assert.equal(databaseResult.rowCount, 1);
  assert.notEqual(databaseResult.rows[0].password_hash, password);
  assert.ok(databaseResult.rows[0].password_hash.includes(":"));
  assert.equal(databaseResult.rows[0].email_verified, false);
  assert.ok(databaseResult.rows[0].email_verification_otp_hash);
  assert.ok(databaseResult.rows[0].email_verification_otp_expires_at);

  await cleanupTestUser(email, username);
});

test("POST /api/v1/auth/login should reject invalid credentials", async () => {
  const response = await request(app).post("/api/v1/auth/login").send({
    identifier: "user-tidak-ada@example.com",
    password: "rahasia123",
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.success, false);
});

test("POST /api/v1/auth/login should reject user with unverified email", async () => {
  const suffix = randomUUID();
  const email = `unverified-${suffix}@example.com`;
  const username = `unverified_${suffix.replace(/-/g, "").slice(0, 12)}`;
  const password = "rahasia123";

  await cleanupTestUser(email, username);
  clearTestEmailOutbox();

  const registerResponse = await request(app)
    .post("/api/v1/auth/register")
    .send({
      firstName: "Rosatri",
      lastName: "Pending",
      username,
      email,
      password,
    });

  assert.equal(registerResponse.statusCode, 201);

  const loginResponse = await request(app).post("/api/v1/auth/login").send({
    identifier: email,
    password,
  });

  assert.equal(loginResponse.statusCode, 403);
  assert.equal(loginResponse.body.success, false);

  await cleanupTestUser(email, username);
});

test("POST /api/v1/auth/verify-email-otp should verify registered user email", async () => {
  const suffix = randomUUID();
  const email = `verify-${suffix}@example.com`;
  const username = `verify_${suffix.replace(/-/g, "").slice(0, 12)}`;
  const password = "rahasia123";

  await cleanupTestUser(email, username);
  clearTestEmailOutbox();

  const registerResponse = await request(app)
    .post("/api/v1/auth/register")
    .send({
      firstName: "Rosatri",
      lastName: "Verify",
      username,
      email,
      password,
    });

  assert.equal(registerResponse.statusCode, 201);

  const otp = getLatestOtpForEmail(email);
  const verifyResponse = await request(app)
    .post("/api/v1/auth/verify-email-otp")
    .send({ email, otp });

  assert.equal(verifyResponse.statusCode, 200);
  assert.equal(verifyResponse.body.success, true);
  assert.equal(verifyResponse.body.data.emailVerified, true);

  const databaseResult = await query<{
    email_verified: boolean;
    email_verification_otp_hash: string | null;
    email_verification_otp_expires_at: Date | null;
  }>(
    `
      SELECT
        email_verified,
        email_verification_otp_hash,
        email_verification_otp_expires_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  assert.equal(databaseResult.rowCount, 1);
  assert.equal(databaseResult.rows[0].email_verified, true);
  assert.equal(databaseResult.rows[0].email_verification_otp_hash, null);
  assert.equal(databaseResult.rows[0].email_verification_otp_expires_at, null);

  await cleanupTestUser(email, username);
});

test("POST /api/v1/auth/login should authenticate user with email or username", async () => {
  const suffix = randomUUID();
  const email = `login-${suffix}@example.com`;
  const username = `login_${suffix.replace(/-/g, "").slice(0, 12)}`;
  const password = "rahasia123";

  await cleanupTestUser(email, username);
  clearTestEmailOutbox();

  const registerResponse = await request(app)
    .post("/api/v1/auth/register")
    .send({
      firstName: "Rosatri",
      lastName: "Login",
      username,
      email,
      password,
    });

  assert.equal(registerResponse.statusCode, 201);

  await verifyTestUserEmail(email);

  const loginByEmailResponse = await request(app)
    .post("/api/v1/auth/login")
    .send({
      identifier: email,
      password,
    });

  assert.equal(loginByEmailResponse.statusCode, 200);
  assert.equal(loginByEmailResponse.body.success, true);
  assert.equal(typeof loginByEmailResponse.body.data.accessToken, "string");
  assert.equal(loginByEmailResponse.body.data.user.email, email);
  assert.equal(loginByEmailResponse.body.data.user.username, username);
  assert.equal("passwordHash" in loginByEmailResponse.body.data.user, false);
  assert.equal("password" in loginByEmailResponse.body.data.user, false);

  const loginByUsernameResponse = await request(app)
    .post("/api/v1/auth/login")
    .send({
      identifier: username,
      password,
    });

  assert.equal(loginByUsernameResponse.statusCode, 200);
  assert.equal(loginByUsernameResponse.body.success, true);
  assert.equal(loginByUsernameResponse.body.data.user.email, email);

  await cleanupTestUser(email, username);
});

// Protected endpoint: selalu uji minimal unauthorized + success case.
test("GET /api/v1/auth/me should reject request without bearer token", async () => {
  const response = await request(app).get("/api/v1/auth/me");

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.success, false);
});

test("GET /api/v1/auth/me should return authenticated user from access token", async () => {
  const suffix = randomUUID();
  const email = `me-${suffix}@example.com`;
  const username = `me_${suffix.replace(/-/g, "").slice(0, 12)}`;
  const password = "rahasia123";

  await cleanupTestUser(email, username);
  clearTestEmailOutbox();

  const registerResponse = await request(app)
    .post("/api/v1/auth/register")
    .send({
      firstName: "Rosatri",
      lastName: "Profile",
      username,
      email,
      password,
    });

  assert.equal(registerResponse.statusCode, 201);

  await verifyTestUserEmail(email);

  const loginResponse = await request(app).post("/api/v1/auth/login").send({
    identifier: email,
    password,
  });

  assert.equal(loginResponse.statusCode, 200);

  const accessToken = loginResponse.body.data.accessToken;

  const meResponse = await request(app)
    .get("/api/v1/auth/me")
    .set("Authorization", `Bearer ${accessToken}`);

  assert.equal(meResponse.statusCode, 200);
  assert.equal(meResponse.body.success, true);
  assert.equal(meResponse.body.data.email, email);
  assert.equal(meResponse.body.data.username, username);
  assert.equal("passwordHash" in meResponse.body.data, false);
  assert.equal("password" in meResponse.body.data, false);

  await cleanupTestUser(email, username);
});

test("PATCH /api/v1/auth/me should reject request without bearer token", async () => {
  const response = await request(app).patch("/api/v1/auth/me").send({
    firstName: "Rosatri Baru",
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.success, false);
});

test("PATCH /api/v1/auth/me should update authenticated user profile", async () => {
  const suffix = randomUUID();
  const email = `profile-${suffix}@example.com`;
  const username = `profile_${suffix.replace(/-/g, "").slice(0, 12)}`;
  const password = "rahasia123";

  await cleanupTestUser(email, username);
  clearTestEmailOutbox();

  const registerResponse = await request(app)
    .post("/api/v1/auth/register")
    .send({
      firstName: "Rosatri",
      lastName: "Awal",
      username,
      email,
      password,
      phone: "081111111111",
      address: "Jl. Lama No. 1",
    });

  assert.equal(registerResponse.statusCode, 201);

  await verifyTestUserEmail(email);

  const loginResponse = await request(app).post("/api/v1/auth/login").send({
    identifier: email,
    password,
  });

  assert.equal(loginResponse.statusCode, 200);

  const accessToken = loginResponse.body.data.accessToken;

  const updateResponse = await request(app)
    .patch("/api/v1/auth/me")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      firstName: "Rosatri Update",
      lastName: null,
      phone: "089876543210",
      address: "Jl. Baru No. 2",
    });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.body.success, true);
  assert.equal(updateResponse.body.data.firstName, "Rosatri Update");
  assert.equal(updateResponse.body.data.lastName, null);
  assert.equal(updateResponse.body.data.phone, "089876543210");
  assert.equal(updateResponse.body.data.address, "Jl. Baru No. 2");

  const databaseResult = await query<ProfileRow>(
    `
      SELECT first_name, last_name, phone, address
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  assert.equal(databaseResult.rowCount, 1);
  assert.equal(databaseResult.rows[0].first_name, "Rosatri Update");
  assert.equal(databaseResult.rows[0].last_name, null);
  assert.equal(databaseResult.rows[0].phone, "089876543210");
  assert.equal(databaseResult.rows[0].address, "Jl. Baru No. 2");

  await cleanupTestUser(email, username);
});

// RBAC: uji role yang ditolak (`403`) dan role yang diizinkan (`200`).
test("GET /api/v1/auth/admin-area should reject renter role", async () => {
  const session = await createAuthenticatedTestUser("renter");

  const response = await request(app)
    .get("/api/v1/auth/admin-area")
    .set("Authorization", `Bearer ${session.accessToken}`);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.success, false);

  await cleanupTestUser(session.email, session.username);
});

test("GET /api/v1/auth/staff-area should allow owner role", async () => {
  const session = await createAuthenticatedTestUser("owner");

  const response = await request(app)
    .get("/api/v1/auth/staff-area")
    .set("Authorization", `Bearer ${session.accessToken}`);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.user.role, "owner");

  await cleanupTestUser(session.email, session.username);
});

test("GET /api/v1/auth/admin-area should allow admin role", async () => {
  const session = await createAuthenticatedTestUser("admin");

  const response = await request(app)
    .get("/api/v1/auth/admin-area")
    .set("Authorization", `Bearer ${session.accessToken}`);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.user.role, "admin");

  await cleanupTestUser(session.email, session.username);
});
