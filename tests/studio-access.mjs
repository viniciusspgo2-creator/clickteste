import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
const base = process.env.STUDIO_TEST_URL || "http://127.0.0.1:3000";
assert.equal(
  new URL(base).hostname,
  "127.0.0.1",
  "Run against the local app only",
);
assert.equal(
  process.env.DATABASE_URL,
  "postgresql://clicktools@127.0.0.1:5432/clicktools_dev",
  "Use the isolated onboarding DB",
);
const db = new PrismaClient();
const created = [];
let checks = 0;
async function api(path, { method = "GET", body, cookie, token } = {}) {
  const response = await fetch(
    base +
      path +
      (method === "DELETE" && body?.code
        ? `?code=${encodeURIComponent(body.code)}`
        : ""),
    {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  const data = await response.json();
  return {
    data,
    status: response.status,
    cookie: response.headers
      .getSetCookie()
      .map((s) => s.split(";")[0])
      .join("; "),
  };
}
try {
  assert.equal((await api("/api/admin/codes")).status, 401);
  checks++;
  const login = await api("/api/admin/login", {
    method: "POST",
    body: { password: process.env.ADMIN_PASSWORD },
  });
  assert.equal(login.data.ok, true);
  const admin = login.cookie;
  assert.equal(
    (await api("/api/access/session", { cookie: admin })).data.plan,
    "Admin Master",
  );
  checks++;
  async function create(clientType, name) {
    const r = await api("/api/admin/codes", {
      method: "POST",
      cookie: admin,
      body: { clientName: name, clientType },
    });
    assert.equal(r.data.ok, true);
    const code = r.data.created[0];
    created.push(code);
    return code;
  }
  const code = await create("standalone", "QA anual");
  let list = await api("/api/admin/codes", { cookie: admin });
  const row = list.data.codes.find((c) => c.code === code);
  assert.equal(row.clientName, "QA anual");
  assert.equal(row.clientType, "standalone");
  assert.ok(
    Math.abs(new Date(row.expiresAt).getTime() - Date.now() - 365 * 86400000) <
      10000,
  );
  checks++;
  const a = await api("/api/access/validate", {
    method: "POST",
    body: { code },
  });
  assert.equal(a.data.ok, true);
  assert.ok(a.cookie.includes("cg_studio_browser="));
  checks++;
  assert.equal(
    (
      await api("/api/access/session", {
        cookie: a.cookie,
        token: a.data.sessionToken,
      })
    ).data.ok,
    true,
  );
  checks++;
  assert.equal(
    (await api("/api/access/session", { token: a.data.sessionToken })).data.ok,
    false,
  );
  checks++;
  const wrong = await api("/api/access/validate", {
    method: "POST",
    body: { code },
  });
  assert.equal(wrong.data.reason, "browser");
  checks++;
  const b = await api("/api/access/validate", {
    method: "POST",
    body: { code },
    cookie: a.cookie,
  });
  assert.equal(b.data.ok, true);
  assert.equal(
    (
      await api("/api/access/session", {
        cookie: a.cookie,
        token: a.data.sessionToken,
      })
    ).data.ok,
    false,
  );
  assert.equal(
    (
      await api("/api/access/session", {
        cookie: a.cookie,
        token: b.data.sessionToken,
      })
    ).data.ok,
    true,
  );
  checks++;
  const claimed = await api("/api/access/session", {
    method: "POST",
    cookie: a.cookie,
    token: b.data.sessionToken,
  });
  assert.equal(claimed.data.ok, true);
  assert.equal(
    (
      await api("/api/access/session", {
        cookie: a.cookie,
        token: b.data.sessionToken,
      })
    ).data.ok,
    false,
  );
  assert.equal(
    (
      await api("/api/access/session", {
        cookie: a.cookie,
        token: claimed.data.sessionToken,
      })
    ).data.ok,
    true,
  );
  b.data.sessionToken = claimed.data.sessionToken;
  checks++;
  assert.equal(
    (
      await api("/api/admin/codes", {
        method: "PATCH",
        cookie: admin,
        body: { code, active: false },
      })
    ).data.ok,
    true,
  );
  assert.equal(
    (
      await api("/api/access/session", {
        cookie: a.cookie,
        token: b.data.sessionToken,
      })
    ).data.ok,
    false,
  );
  assert.equal(
    (
      await api("/api/access/validate", {
        method: "POST",
        cookie: a.cookie,
        body: { code },
      })
    ).data.reason,
    "invalid",
  );
  checks++;
  await api("/api/admin/codes", {
    method: "PATCH",
    cookie: admin,
    body: {
      code,
      active: true,
      resetBrowser: true,
      clientName: "QA editado",
      clientType: "library",
      expiresAt: null,
    },
  });
  const c = await api("/api/access/validate", {
    method: "POST",
    body: { code },
  });
  assert.equal(c.data.ok, true);
  assert.equal(c.data.clientName, "QA editado");
  assert.equal(c.data.plan, "Biblioteca Click Gruda");
  checks++;
  await api("/api/access/session", {
    method: "DELETE",
    cookie: c.cookie,
    token: c.data.sessionToken,
  });
  assert.equal(
    (
      await api("/api/access/session", {
        cookie: c.cookie,
        token: c.data.sessionToken,
      })
    ).data.ok,
    false,
  );
  checks++;
  await api("/api/admin/codes", {
    method: "PATCH",
    cookie: admin,
    body: { code, expiresAt: "2020-01-01T00:00:00Z" },
  });
  assert.equal(
    (
      await api("/api/access/validate", {
        method: "POST",
        cookie: c.cookie,
        body: { code },
      })
    ).data.reason,
    "expired",
  );
  checks++;
  const raceCode = await create("library", "QA concorrência");
  const race = await Promise.all(
    [1, 2].map(() =>
      api("/api/access/validate", { method: "POST", body: { code: raceCode } }),
    ),
  );
  assert.equal(race.filter((r) => r.data.ok).length, 1);
  assert.equal(race.filter((r) => r.data.reason === "browser").length, 1);
  checks++;
  await api("/api/admin/codes", {
    method: "DELETE",
    cookie: admin,
    body: { code: raceCode },
  });
  assert.equal(
    (
      await api("/api/access/validate", {
        method: "POST",
        body: { code: raceCode },
      })
    ).data.reason,
    "invalid",
  );
  checks++;
  console.log(
    `${checks} access integration checks passed (browser binding, single session, expiry, revocation, editing, reset, concurrency, admin).`,
  );
} finally {
  await db.accessCode.deleteMany({ where: { code: { in: created } } });
  await db.$disconnect();
}
