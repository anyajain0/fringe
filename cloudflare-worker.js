function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization"
    }
  });
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function toHex(bytes) {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toHex(bytes);
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

async function createSession(env, email) {
  const token = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO sessions (token, email, created_at) VALUES (?, ?, ?)"
  ).bind(token, email, createdAt).run();
  return token;
}

async function getSessionEmail(env, request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return null;
  }

  const token = auth.slice(7);
  const result = await env.DB.prepare(
    "SELECT email FROM sessions WHERE token = ?"
  ).bind(token).first();
  return result?.email || null;
}

async function getAccountByEmail(env, email) {
  return env.DB.prepare(`
    SELECT email, name, age, neighborhood, vibe, favorite_spot, about, interests_json, verified
    FROM accounts
    WHERE email = ?
  `).bind(email).first();
}

async function requireSession(env, request) {
  const email = await getSessionEmail(env, request);
  if (!email) {
    return { error: json({ error: "Sign in required." }, 401) };
  }
  return { email };
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return json({ ok: true });
      }

      const url = new URL(request.url);
      const path = url.pathname;

      if (path === "/api/auth/register" && request.method === "POST") {
        const body = await readBody(request);
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!email || !password) {
          return json({ error: "Email and password are required." }, 400);
        }

        const salt = randomSalt();
        const passwordHash = await hashPassword(password, salt);
        const verificationCode = randomCode();
        const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const now = new Date().toISOString();

        await env.DB.prepare(`
          INSERT INTO accounts (
            email, name, age, neighborhood, vibe, favorite_spot, about, interests_json,
            password_salt, password_hash, verified, verification_code, verification_expires_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET
            name = excluded.name,
            age = excluded.age,
            neighborhood = excluded.neighborhood,
            vibe = excluded.vibe,
            favorite_spot = excluded.favorite_spot,
            about = excluded.about,
            interests_json = excluded.interests_json,
            password_salt = excluded.password_salt,
            password_hash = excluded.password_hash,
            verified = 0,
            verification_code = excluded.verification_code,
            verification_expires_at = excluded.verification_expires_at,
            updated_at = excluded.updated_at
        `).bind(
          email,
          String(body.name || ""),
          String(body.age || ""),
          String(body.neighborhood || ""),
          String(body.vibe || ""),
          String(body.favoriteSpot || ""),
          String(body.about || ""),
          JSON.stringify(Array.isArray(body.interests) ? body.interests : []),
          salt,
          passwordHash,
          verificationCode,
          verificationExpiresAt,
          now
        ).run();

        return json({
          success: true,
          delivery: "developer-preview",
          verificationPreviewCode: verificationCode
        });
      }

      if (path === "/api/auth/request-code" && request.method === "POST") {
        const body = await readBody(request);
        const email = String(body.email || "").trim().toLowerCase();

        if (!email) {
          return json({ error: "Email is required." }, 400);
        }

        const existing = await env.DB.prepare(
          "SELECT email FROM accounts WHERE email = ?"
        ).bind(email).first();

        if (!existing) {
          return json({ error: "Account not found." }, 404);
        }

        const verificationCode = randomCode();
        const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        await env.DB.prepare(`
          UPDATE accounts
          SET verification_code = ?, verification_expires_at = ?, verified = 0
          WHERE email = ?
        `).bind(verificationCode, verificationExpiresAt, email).run();

        return json({
          success: true,
          delivery: "developer-preview",
          verificationPreviewCode: verificationCode
        });
      }

      if (path === "/api/auth/verify" && request.method === "POST") {
        const body = await readBody(request);
        const email = String(body.email || "").trim().toLowerCase();
        const code = String(body.code || "").trim();
        const record = await env.DB.prepare(
          "SELECT verification_code, verification_expires_at FROM accounts WHERE email = ?"
        ).bind(email).first();

        if (!record) {
          return json({ error: "Account not found." }, 404);
        }

        if (record.verification_code !== code) {
          return json({ error: "Verification code is incorrect." }, 400);
        }

        if (record.verification_expires_at && new Date(record.verification_expires_at).getTime() < Date.now()) {
          return json({ error: "Verification code expired." }, 400);
        }

        await env.DB.prepare(`
          UPDATE accounts
          SET verified = 1, verification_code = NULL, verification_expires_at = NULL
          WHERE email = ?
        `).bind(email).run();

        const token = await createSession(env, email);
        const account = await getAccountByEmail(env, email);

        return json({
          success: true,
          token,
          account: {
            email: account.email,
            name: account.name,
            age: account.age,
            neighborhood: account.neighborhood,
            vibe: account.vibe,
            favoriteSpot: account.favorite_spot,
            about: account.about,
            interests: JSON.parse(account.interests_json),
            verified: Boolean(account.verified)
          }
        });
      }

      if (path === "/api/auth/login" && request.method === "POST") {
        const body = await readBody(request);
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const record = await env.DB.prepare(`
          SELECT email, name, age, neighborhood, vibe, favorite_spot, about, interests_json,
                 password_salt, password_hash, verified
          FROM accounts
          WHERE email = ?
        `).bind(email).first();

        if (!record) {
          return json({ error: "Account not found." }, 404);
        }

        const incomingHash = await hashPassword(password, record.password_salt);
        if (incomingHash !== record.password_hash) {
          return json({ error: "Password is incorrect." }, 401);
        }

        if (!record.verified) {
          return json({ error: "Account is not verified yet.", needsVerification: true }, 403);
        }

        const token = await createSession(env, email);

        return json({
          success: true,
          token,
          account: {
            email: record.email,
            name: record.name,
            age: record.age,
            neighborhood: record.neighborhood,
            vibe: record.vibe,
            favoriteSpot: record.favorite_spot,
            about: record.about,
            interests: JSON.parse(record.interests_json),
            verified: Boolean(record.verified)
          }
        });
      }

      if (path === "/api/auth/me" && request.method === "GET") {
        const session = await requireSession(env, request);
        if (session.error) {
          return session.error;
        }

        const account = await getAccountByEmail(env, session.email);
        if (!account) {
          return json({ error: "Account not found." }, 404);
        }

        return json({
          account: {
            email: account.email,
            name: account.name,
            age: account.age,
            neighborhood: account.neighborhood,
            vibe: account.vibe,
            favoriteSpot: account.favorite_spot,
            about: account.about,
            interests: JSON.parse(account.interests_json),
            verified: Boolean(account.verified)
          }
        });
      }

      if (path === "/api/accounts" && request.method === "DELETE") {
        const session = await requireSession(env, request);
        if (session.error) {
          return session.error;
        }

        await env.DB.batch([
          env.DB.prepare("DELETE FROM accounts WHERE email = ?").bind(session.email),
          env.DB.prepare("DELETE FROM likes WHERE email = ?").bind(session.email),
          env.DB.prepare("DELETE FROM messages WHERE email = ?").bind(session.email),
          env.DB.prepare("DELETE FROM quests WHERE email = ?").bind(session.email),
          env.DB.prepare("DELETE FROM sessions WHERE email = ?").bind(session.email)
        ]);

        return json({ success: true });
      }

      if (path === "/api/likes" && request.method === "GET") {
        const session = await requireSession(env, request);
        if (session.error) {
          return session.error;
        }

        const rows = await env.DB.prepare(
          "SELECT profile_id, created_at FROM likes WHERE email = ? ORDER BY created_at DESC"
        ).bind(session.email).all();
        return json({ likes: rows.results || [] });
      }

      if (path === "/api/likes" && request.method === "POST") {
        const session = await requireSession(env, request);
        if (session.error) {
          return session.error;
        }

        const body = await readBody(request);
        const now = new Date().toISOString();
        await env.DB.prepare(`
          INSERT INTO likes (email, profile_id, created_at)
          VALUES (?, ?, ?)
          ON CONFLICT(email, profile_id) DO NOTHING
        `).bind(session.email, String(body.profileId || ""), now).run();
        return json({ success: true });
      }

      if (path === "/api/messages" && request.method === "GET") {
        const session = await requireSession(env, request);
        if (session.error) {
          return session.error;
        }

        const profileId = String(url.searchParams.get("profileId") || "");
        const rows = await env.DB.prepare(
          "SELECT sender, text, created_at FROM messages WHERE email = ? AND profile_id = ? ORDER BY id ASC"
        ).bind(session.email, profileId).all();
        return json({ messages: rows.results || [] });
      }

      if (path === "/api/messages" && request.method === "POST") {
        const session = await requireSession(env, request);
        if (session.error) {
          return session.error;
        }

        const body = await readBody(request);
        const now = new Date().toISOString();
        await env.DB.prepare(
          "INSERT INTO messages (email, profile_id, sender, text, created_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(session.email, String(body.profileId || ""), String(body.sender || ""), String(body.text || ""), now).run();
        return json({ success: true });
      }

      if (path === "/api/quests" && request.method === "GET") {
        const session = await requireSession(env, request);
        if (session.error) {
          return session.error;
        }

        const rows = await env.DB.prepare(
          "SELECT profile_id, match_name, title, description, xp, badge, created_at FROM quests WHERE email = ? ORDER BY id DESC"
        ).bind(session.email).all();
        return json({ quests: rows.results || [] });
      }

      if (path === "/api/quests" && request.method === "POST") {
        const session = await requireSession(env, request);
        if (session.error) {
          return session.error;
        }

        const body = await readBody(request);
        const now = new Date().toISOString();
        await env.DB.prepare(`
          INSERT INTO quests (email, profile_id, match_name, title, description, xp, badge, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          session.email,
          String(body.profileId || ""),
          String(body.matchName || ""),
          String(body.title || ""),
          String(body.description || ""),
          String(body.xp || ""),
          String(body.badge || ""),
          now
        ).run();
        return json({ success: true });
      }

      return json({ error: "Not found." }, 404);
    } catch (error) {
      return json({
        error: "Worker failure.",
        detail: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  }
};
