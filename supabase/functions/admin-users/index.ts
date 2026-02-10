import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Verify caller is admin
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const userId = claimsData.claims.sub;

  // Check admin role using service client
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: adminCheck } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminCheck) {
    return new Response(JSON.stringify({ error: "Forbidden: Admin role required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const url = new URL(req.url);

  // GET: list all users with profiles and roles
  if (req.method === "GET") {
    const { data: profiles, error: profilesError } = await serviceClient
      .from("profiles")
      .select("id, full_name, employee_id, created_at");

    if (profilesError) {
      return new Response(JSON.stringify({ error: profilesError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: allRoles } = await serviceClient.from("user_roles").select("user_id, role");

    const users = (profiles || []).map((p) => ({
      ...p,
      roles: (allRoles || []).filter((r) => r.user_id === p.id).map((r) => r.role),
    }));

    return new Response(JSON.stringify(users), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // POST: assign role
  if (req.method === "POST") {
    const { user_id, role } = await req.json();
    if (!user_id || !role) {
      return new Response(JSON.stringify({ error: "user_id and role required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const validRoles = ["admin", "route_planner", "control_room", "depot_official"];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { error } = await serviceClient.from("user_roles").upsert({ user_id, role }, { onConflict: "user_id,role" });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // DELETE: remove role
  if (req.method === "DELETE") {
    const { user_id, role } = await req.json();
    if (!user_id || !role) {
      return new Response(JSON.stringify({ error: "user_id and role required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { error } = await serviceClient.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
