function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
      "access-control-allow-headers": "Content-Type"
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

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/accounts" && request.method === "GET") {
      const email = (url.searchParams.get("email") || "").trim().toLowerCase();
      if (!email) {
        return json({ error: "Email is required." }, 400);
      }

      const result = await env.DB.prepare(
        "SELECT email, name, age, neighborhood, vibe, favorite_spot, about, interests_json FROM accounts WHERE email = ?"
      ).bind(email).first();

      if (!result) {
        return json({ account: null });
      }

      return json({
        account: {
          email: result.email,
          name: result.name,
          age: result.age,
          neighborhood: result.neighborhood,
          vibe: result.vibe,
          favoriteSpot: result.favorite_spot,
          about: result.about,
          interests: JSON.parse(result.interests_json)
        }
      });
    }

    if (path === "/api/accounts" && request.method === "POST") {
      const body = await readBody(request);
      const email = String(body.email || "").trim().toLowerCase();

      if (!email) {
        return json({ error: "Email is required." }, 400);
      }

      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO accounts (email, name, age, neighborhood, vibe, favorite_spot, about, interests_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          name = excluded.name,
          age = excluded.age,
          neighborhood = excluded.neighborhood,
          vibe = excluded.vibe,
          favorite_spot = excluded.favorite_spot,
          about = excluded.about,
          interests_json = excluded.interests_json,
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
        now
      ).run();

      return json({ success: true });
    }

    if (path === "/api/accounts" && request.method === "DELETE") {
      const email = (url.searchParams.get("email") || "").trim().toLowerCase();

      if (!email) {
        return json({ error: "Email is required." }, 400);
      }

      await env.DB.batch([
        env.DB.prepare("DELETE FROM accounts WHERE email = ?").bind(email),
        env.DB.prepare("DELETE FROM likes WHERE email = ?").bind(email),
        env.DB.prepare("DELETE FROM messages WHERE email = ?").bind(email),
        env.DB.prepare("DELETE FROM quests WHERE email = ?").bind(email)
      ]);

      return json({ success: true });
    }

    if (path === "/api/likes" && request.method === "GET") {
      const email = (url.searchParams.get("email") || "").trim().toLowerCase();
      const rows = await env.DB.prepare(
        "SELECT profile_id, created_at FROM likes WHERE email = ? ORDER BY created_at DESC"
      ).bind(email).all();
      return json({ likes: rows.results || [] });
    }

    if (path === "/api/likes" && request.method === "POST") {
      const body = await readBody(request);
      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO likes (email, profile_id, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email, profile_id) DO NOTHING
      `).bind(
        String(body.email || "").trim().toLowerCase(),
        String(body.profileId || ""),
        now
      ).run();
      return json({ success: true });
    }

    if (path === "/api/messages" && request.method === "GET") {
      const email = (url.searchParams.get("email") || "").trim().toLowerCase();
      const profileId = String(url.searchParams.get("profileId") || "");
      const rows = await env.DB.prepare(
        "SELECT sender, text, created_at FROM messages WHERE email = ? AND profile_id = ? ORDER BY id ASC"
      ).bind(email, profileId).all();
      return json({ messages: rows.results || [] });
    }

    if (path === "/api/messages" && request.method === "POST") {
      const body = await readBody(request);
      const now = new Date().toISOString();
      await env.DB.prepare(
        "INSERT INTO messages (email, profile_id, sender, text, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(
        String(body.email || "").trim().toLowerCase(),
        String(body.profileId || ""),
        String(body.sender || ""),
        String(body.text || ""),
        now
      ).run();
      return json({ success: true });
    }

    if (path === "/api/quests" && request.method === "GET") {
      const email = (url.searchParams.get("email") || "").trim().toLowerCase();
      const rows = await env.DB.prepare(
        "SELECT profile_id, match_name, title, description, xp, badge, created_at FROM quests WHERE email = ? ORDER BY id DESC"
      ).bind(email).all();
      return json({ quests: rows.results || [] });
    }

    if (path === "/api/quests" && request.method === "POST") {
      const body = await readBody(request);
      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO quests (email, profile_id, match_name, title, description, xp, badge, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        String(body.email || "").trim().toLowerCase(),
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
  }
};
