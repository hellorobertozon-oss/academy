import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import { createAcademyServerClient } from "@/lib/supabase/server";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET() {
  const profile = await getCurrentAcademyProfile();
  if (!profile || profile.role !== "admin") {
    return new Response("Not found", { status: 404 });
  }

  try {
    const supabase = await createAcademyServerClient();
    const { data, error } = await supabase
      .from("trade_fair_memory_entries")
      .select("email, language")
      .order("created_at", { ascending: true });

    if (error) return new Response("Could not export entries", { status: 503 });

    const rows = ["email,language", ...(data ?? []).map((entry) => `${csvCell(entry.email)},${csvCell(entry.language)}`)];
    const csv = `\uFEFF${rows.join("\r\n")}`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="xzone-trade-fair-entries.csv"',
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch {
    return new Response("Could not export entries", { status: 503 });
  }
}
