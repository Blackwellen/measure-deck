import type { SupabaseClient } from "@supabase/supabase-js";

// Buckets that hold legally-binding documents and must never be deleted via app code
const IMMUTABLE_BUCKETS = new Set(["legal-notices", "cis-documents"]);

export async function uploadFile(
  supabase: SupabaseClient,
  params: {
    bucket: string;
    path: string;
    file: File | Blob;
    metadata?: Record<string, string>;
    onProgress?: (percent: number) => void;
  }
): Promise<{ path: string; url: string }> {
  const { error } = await supabase.storage
    .from(params.bucket)
    .upload(params.path, params.file, {
      upsert: false,
      metadata: params.metadata,
    });

  if (error) throw new Error(error.message);

  // Supabase Storage JS v2 does not expose upload progress natively;
  // fire 100% immediately so callers don't hang waiting for a callback
  params.onProgress?.(100);

  const { data: signedData } = await supabase.storage
    .from(params.bucket)
    .createSignedUrl(params.path, 3600);

  const url = signedData?.signedUrl ?? "";

  return { path: params.path, url };
}

export async function getSignedUrl(
  supabase: SupabaseClient,
  params: { bucket: string; path: string; expiresIn?: number }
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(params.bucket)
    .createSignedUrl(params.path, params.expiresIn ?? 3600);

  if (error) throw new Error(error.message);

  return data.signedUrl;
}

export async function deleteFile(
  supabase: SupabaseClient,
  params: { bucket: string; path: string }
): Promise<void> {
  if (IMMUTABLE_BUCKETS.has(params.bucket)) {
    throw new Error("Cannot delete immutable document");
  }

  const { error } = await supabase.storage
    .from(params.bucket)
    .remove([params.path]);

  if (error) throw new Error(error.message);
}
