import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action =
  | { type: "list" }
  | { type: "create"; email: string; password: string; role: "admin" | "user" }
  | { type: "set_role"; user_id: string; role: "admin" | "user" }
  | { type: "set_password"; user_id: string; password: string }
  | { type: "delete"; user_id: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Caller verification (must be admin)
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "missing_auth" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return json({ error: "invalid_token" }, 401);
    }
    const callerId = userRes.user.id;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return json({ error: "forbidden" }, 403);
    }

    const body = (await req.json()) as Action;

    switch (body.type) {
      case "list": {
        const { data: list, error } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (error) throw error;

        const ids = list.users.map((u) => u.id);
        const { data: roles } = await admin
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", ids);

        const roleMap = new Map<string, string[]>();
        for (const r of roles ?? []) {
          const arr = roleMap.get(r.user_id) ?? [];
          arr.push(r.role);
          roleMap.set(r.user_id, arr);
        }

        const users = list.users.map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          roles: roleMap.get(u.id) ?? [],
        }));
        return json({ users });
      }

      case "create": {
        if (!body.email || !body.password || body.password.length < 8) {
          return json({ error: "invalid_payload" }, 400);
        }
        const { data: created, error } = await admin.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
        });
        if (error) throw error;

        if (body.role === "admin" && created.user) {
          await admin.from("user_roles").insert({
            user_id: created.user.id,
            role: "admin",
          });
        }
        return json({ user: created.user });
      }

      case "set_role": {
        if (!body.user_id || !["admin", "user"].includes(body.role)) {
          return json({ error: "invalid_payload" }, 400);
        }
        // Clear existing roles, then insert the new one (single-role model)
        await admin.from("user_roles").delete().eq("user_id", body.user_id);
        if (body.role === "admin") {
          await admin
            .from("user_roles")
            .insert({ user_id: body.user_id, role: "admin" });
        }
        return json({ ok: true });
      }

      case "set_password": {
        if (!body.user_id || !body.password || body.password.length < 8) {
          return json({ error: "invalid_payload" }, 400);
        }
        const { error } = await admin.auth.admin.updateUserById(body.user_id, {
          password: body.password,
        });
        if (error) {
          if ((error as { code?: string }).code === "weak_password") {
            return json(
              { error: "weak_password", message: "Senha vazada ou muito fraca. Escolha uma senha mais forte e única." },
              400,
            );
          }
          throw error;
        }
        return json({ ok: true });
      }

      case "delete": {
        if (!body.user_id) return json({ error: "invalid_payload" }, 400);
        if (body.user_id === callerId) {
          return json({ error: "cannot_delete_self" }, 400);
        }
        const { error } = await admin.auth.admin.deleteUser(body.user_id);
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return json({ error: "unknown_action" }, 400);
    }
  } catch (err) {
    console.error("manage-users error", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
