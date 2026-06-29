import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CH_BASE = "https://api.companieshouse.gov.uk";

interface SearchBody {
  action: "search";
  q: string;
}

interface DetailsBody {
  action: "details";
  company_number: string;
}

interface OfficersBody {
  action: "officers";
  company_number: string;
}

type RequestBody = SearchBody | DetailsBody | OfficersBody;

interface CHAddress {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  postal_code?: string;
  country?: string;
  region?: string;
}

interface CHCompany {
  company_number: string;
  title?: string;
  company_name?: string;
  company_status?: string;
  registered_office_address?: CHAddress;
  date_of_creation?: string;
  sic_codes?: string[];
  type?: string;
}

interface CHOfficer {
  name: string;
  officer_role: string;
  appointed_on?: string;
  resigned_on?: string;
  address?: CHAddress;
}

interface CHOfficersResponse {
  items?: CHOfficer[];
}

interface CHSearchItem {
  company_number: string;
  title: string;
  company_status?: string;
  registered_office_address?: CHAddress;
  date_of_creation?: string;
  sic_codes?: string[];
  description?: string;
}

interface CHSearchResponse {
  items?: CHSearchItem[];
  total_results?: number;
}

function formatAddress(addr?: CHAddress): string {
  if (!addr) return "";
  return [
    addr.address_line_1,
    addr.address_line_2,
    addr.locality,
    addr.region,
    addr.postal_code,
    addr.country,
  ]
    .filter(Boolean)
    .join(", ");
}

async function chFetch(path: string, apiKey: string) {
  const encoded = btoa(`${apiKey}:`);
  const res = await fetch(`${CH_BASE}${path}`, {
    headers: {
      Authorization: `Basic ${encoded}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Companies House API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const apiKey = Deno.env.get("COMPANIES_HOUSE_API_KEY") ?? "";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "COMPANIES_HOUSE_API_KEY not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { error: authError } = await supabase.auth.getUser();
    if (authError) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as RequestBody;

    if (body.action === "search") {
      const data = (await chFetch(
        `/search/companies?q=${encodeURIComponent(body.q)}&items_per_page=10`,
        apiKey
      )) as CHSearchResponse;

      const items = (data.items ?? []).map((item) => ({
        company_number: item.company_number,
        company_name: item.title,
        company_status: item.company_status ?? "unknown",
        registered_office_address: formatAddress(item.registered_office_address),
        date_of_creation: item.date_of_creation ?? null,
        sic_codes: item.sic_codes ?? [],
        description: item.description ?? "",
      }));

      return new Response(JSON.stringify({ items, total_results: data.total_results ?? 0 }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (body.action === "details") {
      const data = (await chFetch(`/company/${body.company_number}`, apiKey)) as CHCompany;

      const result = {
        company_number: data.company_number,
        company_name: data.company_name ?? data.title ?? "",
        company_status: data.company_status ?? "unknown",
        registered_office_address: formatAddress(data.registered_office_address),
        date_of_creation: data.date_of_creation ?? null,
        sic_codes: data.sic_codes ?? [],
        type: data.type ?? "",
      };

      return new Response(JSON.stringify(result), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (body.action === "officers") {
      const data = (await chFetch(
        `/company/${body.company_number}/officers?items_per_page=50`,
        apiKey
      )) as CHOfficersResponse;

      const officers = (data.items ?? [])
        .filter((o) => !o.resigned_on)
        .map((o) => ({
          name: o.name,
          officer_role: o.officer_role,
          appointed_on: o.appointed_on ?? null,
          address: formatAddress(o.address),
        }));

      return new Response(JSON.stringify({ officers }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
