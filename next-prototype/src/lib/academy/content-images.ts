import "server-only";

import { createAcademyServerClient } from "@/lib/supabase/server";

export const ACADEMY_CONTENT_IMAGE_BUCKET = "academy-content-images";
type AcademyClient = Awaited<ReturnType<typeof createAcademyServerClient>>;

export async function createAcademyImageUrlMap(client: AcademyClient, paths: Array<string | null | undefined>) {
  const uniquePaths = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  if (uniquePaths.length === 0) return new Map<string, string>();

  const { data, error } = await client.storage
    .from(ACADEMY_CONTENT_IMAGE_BUCKET)
    .createSignedUrls(uniquePaths, 3600);
  if (error) return new Map<string, string>();

  return new Map(
    (data ?? []).flatMap((item) => item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : []),
  );
}
