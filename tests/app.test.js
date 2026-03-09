import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

process.env.NODE_ENV = "test";

const { default: app } = await import("../src/app.js");

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
