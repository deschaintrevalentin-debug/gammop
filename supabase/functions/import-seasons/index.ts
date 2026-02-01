import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface SeasonRow {
  game: string;
  name: string;
  date: string;
  players: string[];
  is_special?: boolean;
  special_number?: number | null;
  organizer?: string | null;
  speciality?: string | null;
  gdoc_link?: string | null;
}

interface ProfileRow {
  pseudo: string;
  discord_user_id: string;
  avatar_url?: string | null;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Service-role client for DB writes (bypasses RLS)
    const sbAdmin = createClient(supabaseUrl, serviceRoleKey);

    // --- 1. Parse body (JWT is inside the body, not the Authorization header) ---
    const body = await req.json();

    // --- 2. Verify caller is authenticated via JWT in body ---
    const jwt = body.userJwt;
    if (!jwt) {
      return jsonResponse(
        { error: "Missing userJwt in request body" },
        401
      );
    }

    const {
      data: { user },
      error: authError,
    } = await sbAdmin.auth.getUser(jwt);

    if (authError || !user) {
      return jsonResponse(
        {
          error: "Authentication failed",
          details: authError?.message || "Invalid token",
        },
        401
      );
    }
    const mode: string = body.mode || "replace"; // "replace" | "test"
    const seasons: SeasonRow[] = body.seasons || [];
    const profiles: ProfileRow[] = body.profiles || [];

    // --- 3. Mode: test (insert 1 test row) ---
    if (mode === "test") {
      const testRow: SeasonRow = {
        game: "Test",
        name: "Test Edge Function (supprimer)",
        date: new Date().toISOString().split("T")[0],
        players: ["Joueur1", "Joueur2", "Joueur3"],
        is_special: false,
      };

      const { data, error } = await sbAdmin
        .from("seasons")
        .insert(testRow)
        .select();

      if (error) {
        return jsonResponse(
          { error: "Insert test failed", details: error.message, code: error.code },
          500
        );
      }

      // Verify with separate SELECT
      const { data: verifyData } = await sbAdmin
        .from("seasons")
        .select("id")
        .eq("name", "Test Edge Function (supprimer)");

      return jsonResponse({
        success: true,
        mode: "test",
        inserted: data?.length || 0,
        verified: verifyData?.length || 0,
        row: data?.[0] || null,
        user: user.email || user.id,
      });
    }

    // --- 4. Mode: replace (full import) ---
    if (seasons.length === 0) {
      return jsonResponse({ error: "No seasons provided" }, 400);
    }

    // Validate required fields on each season
    for (let i = 0; i < seasons.length; i++) {
      const s = seasons[i];
      if (!s.name || !s.date || !Array.isArray(s.players)) {
        return jsonResponse(
          {
            error: `Invalid season at index ${i}: missing name, date, or players`,
            sample: JSON.stringify(s).substring(0, 200),
          },
          400
        );
      }
    }

    // Delete existing seasons
    const { error: delSeasonsErr } = await sbAdmin
      .from("seasons")
      .delete()
      .gt("created_at", "1970-01-01");

    if (delSeasonsErr) {
      return jsonResponse(
        {
          error: "Failed to delete existing seasons",
          details: delSeasonsErr.message,
        },
        500
      );
    }

    // Delete existing discord_profiles
    const { error: delProfilesErr } = await sbAdmin
      .from("discord_profiles")
      .delete()
      .gt("created_at", "1970-01-01");

    if (delProfilesErr) {
      return jsonResponse(
        {
          error: "Failed to delete existing profiles",
          details: delProfilesErr.message,
        },
        500
      );
    }

    // Insert seasons in batches of 50
    let insertedCount = 0;
    for (let i = 0; i < seasons.length; i += 50) {
      const batch = seasons.slice(i, i + 50);
      const { data, error } = await sbAdmin
        .from("seasons")
        .insert(batch)
        .select("id");

      if (error) {
        return jsonResponse(
          {
            error: `Insert batch failed at index ${i}`,
            details: error.message,
            code: error.code,
            insertedSoFar: insertedCount,
          },
          500
        );
      }
      insertedCount += data?.length || 0;
    }

    // Insert discord profiles if provided
    let profilesInserted = 0;
    if (profiles.length > 0) {
      const { data: profData, error: profErr } = await sbAdmin
        .from("discord_profiles")
        .insert(profiles)
        .select("id");

      if (profErr) {
        // Non-fatal: log but continue
        console.error("Discord profiles insert error:", profErr.message);
      } else {
        profilesInserted = profData?.length || 0;
      }
    }

    // Verify final count
    const { count } = await sbAdmin
      .from("seasons")
      .select("*", { count: "exact", head: true });

    return jsonResponse({
      success: true,
      mode: "replace",
      inserted: insertedCount,
      verified: count ?? insertedCount,
      profilesInserted,
      user: user.email || user.id,
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return jsonResponse(
      { error: "Internal server error", details: (err as Error).message },
      500
    );
  }
});
