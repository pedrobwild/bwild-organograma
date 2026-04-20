// One-time bootstrap function to seed admin users.
// Safe to call repeatedly: idempotent (updates password if user exists, ensures admin role).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Hardcoded list of admins to provision. Edit and redeploy to add more.
const ADMINS: Array<{ email: string; password: string }> = [
  { email: "pedro@bwild.com.br", password: "512451" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const results: Array<Record<string, unknown>> = [];

    for (const a of ADMINS) {
      // Check if user exists
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list.users.find((u) => u.email?.toLowerCase() === a.email.toLowerCase());

      let userId: string;
      if (existing) {
        // Update password to ensure it matches
        await admin.auth.admin.updateUserById(existing.id, {
          password: a.password,
          email_confirm: true,
        });
        userId = existing.id;
        results.push({ email: a.email, action: "updated", id: userId });
      } else {
        const { data: created, error } = await admin.auth.admin.createUser({
          email: a.email,
          password: a.password,
          email_confirm: true,
        });
        if (error) throw error;
        userId = created.user!.id;
        results.push({ email: a.email, action: "created", id: userId });
      }

      // Ensure admin role
      const { data: existingRole } = await admin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!existingRole) {
        await admin.from("user_roles").insert({ user_id: userId, role: "admin" });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("bootstrap-admin error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
