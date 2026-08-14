import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Railway configuration includes a health check", async () => {
  const railway = JSON.parse(await readFile(new URL("../railway.json", import.meta.url), "utf8"));
  assert.equal(railway.deploy.healthcheckPath, "/api/health");
  assert.equal(railway.deploy.startCommand, "npm run start");
});

test("the frontend does not contain an admin password", async () => {
  const login = await readFile(new URL("../app/admin/login/LoginForm.tsx", import.meta.url), "utf8");
  assert.equal(login.includes("scrypt$"), false);
  assert.equal(login.includes("process.env"), false);
  assert.equal(login.includes("change-me"), false);
});

test("the server validates upload signatures", async () => {
  const uploads = await readFile(new URL("../app/lib/uploads.ts", import.meta.url), "utf8");
  assert.match(uploads, /image\/png/);
  assert.match(uploads, /image\/jpeg/);
  assert.match(uploads, /image\/webp/);
  assert.match(uploads, /bytes\[0\] === 0xff/);
});
