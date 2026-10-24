import { getCurrentAcademyProfile } from "@/lib/auth/profile";
import { searchOpenStreetMapAddresses } from "@/lib/maps/openstreetmap-geocoding";

export async function GET(request: Request) {
  const profile = await getCurrentAcademyProfile();
  if (!profile || profile.role !== "admin") {
    return Response.json({ error: "Ta operacja wymaga uprawnień administratora." }, { status: 403 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3 || query.length > 240) {
    return Response.json({ error: "Wpisz adres lub nazwę miejsca (od 3 do 240 znaków)." }, { status: 400 });
  }

  try {
    const results = await searchOpenStreetMapAddresses(query);
    return Response.json({ results });
  } catch {
    return Response.json({ error: "Nie udało się wyszukać adresu w OpenStreetMap. Spróbuj ponownie." }, { status: 502 });
  }
}
