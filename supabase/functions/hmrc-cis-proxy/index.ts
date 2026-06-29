import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CISStatus = "gross" | "net" | "higher_rate" | "unverified";

interface VerifyBody {
  action: "verify";
  contractor_utr: string;
  subcontractor_utr: string;
  subcontractor_name: string;
}

interface SubmitBody {
  action: "submit_return";
  tax_month: string;
  xml_payload: string;
}

type RequestBody = VerifyBody | SubmitBody;

function normaliseCISStatus(hmrcStatus: string): CISStatus {
  const s = hmrcStatus.toLowerCase();
  if (s === "gross") return "gross";
  if (s === "net") return "net";
  if (s.includes("higher")) return "higher_rate";
  return "unverified";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const hmrcClientId = Deno.env.get("HMRC_CLIENT_ID") ?? "";
  const hmrcClientSecret = Deno.env.get("HMRC_CLIENT_SECRET") ?? "";
  const hmrcBaseUrl = Deno.env.get("HMRC_BASE_URL") ?? "https://test-api.service.hmrc.gov.uk";

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const jwt = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: membership } = await supabase
    .from("workspace_memberships")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    return new Response(JSON.stringify({ error: "No workspace found" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const workspaceId = membership.workspace_id as string;

  if (body.action === "verify") {
    const { contractor_utr, subcontractor_utr, subcontractor_name } = body;

    let cisStatus: CISStatus = "unverified";
    let verificationNumber = "";

    try {
      const tokenResp = await fetch(`${hmrcBaseUrl}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: hmrcClientId,
          client_secret: hmrcClientSecret,
        }),
      });

      if (!tokenResp.ok) {
        throw new Error("HMRC token fetch failed");
      }

      const tokenData = await tokenResp.json() as { access_token: string };
      const accessToken = tokenData.access_token;

      const verifyResp = await fetch(
        `${hmrcBaseUrl}/individuals/construction-industry-scheme-request/verify-subcontractor`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Accept": "application/vnd.hmrc.1.0+json",
          },
          body: JSON.stringify({
            contractor: { utr: contractor_utr },
            subcontractor: { utr: subcontractor_utr, name: subcontractor_name },
          }),
        }
      );

      if (verifyResp.ok) {
        const verifyData = await verifyResp.json() as { verificationNumber: string; taxStatus: string };
        cisStatus = normaliseCISStatus(verifyData.taxStatus ?? "unverified");
        verificationNumber = verifyData.verificationNumber ?? "";
      }
    } catch {
      // HMRC unavailable — return unverified but log attempt
    }

    await supabase.from("cis_records").upsert(
      {
        workspace_id: workspaceId,
        subcontractor_utr,
        subcontractor_name,
        contractor_utr,
        cis_status: cisStatus,
        verification_number: verificationNumber,
        last_verified_at: new Date().toISOString(),
        verified_by: user.id,
      },
      { onConflict: "workspace_id,subcontractor_utr" }
    );

    return new Response(
      JSON.stringify({ status: cisStatus, verification_number: verificationNumber }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (body.action === "submit_return") {
    const { tax_month, xml_payload } = body;

    let success = false;
    let submissionReference = "";

    try {
      const tokenResp = await fetch(`${hmrcBaseUrl}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: hmrcClientId,
          client_secret: hmrcClientSecret,
        }),
      });

      if (!tokenResp.ok) {
        throw new Error("HMRC token fetch failed");
      }

      const tokenData = await tokenResp.json() as { access_token: string };
      const accessToken = tokenData.access_token;

      const submitResp = await fetch(
        `${hmrcBaseUrl}/individuals/construction-industry-scheme-request/monthly-return`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/xml",
            "Accept": "application/vnd.hmrc.1.0+json",
          },
          body: xml_payload,
        }
      );

      if (submitResp.ok) {
        const submitData = await submitResp.json() as { submissionReference: string };
        submissionReference = submitData.submissionReference ?? `CIS-${Date.now()}`;
        success = true;
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "HMRC API unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (success) {
      await supabase.from("cis_monthly_returns").upsert(
        {
          workspace_id: workspaceId,
          tax_month,
          status: "filed",
          submission_reference: submissionReference,
          submitted_at: new Date().toISOString(),
          submitted_by: user.id,
        },
        { onConflict: "workspace_id,tax_month" }
      );
    }

    return new Response(
      JSON.stringify({ success, submission_reference: submissionReference }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
