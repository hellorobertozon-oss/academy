import "server-only";
import type { GeocodedLocation } from "@/lib/maps/geocoding-types";

const MIN_REQUEST_INTERVAL_MS = 1_100;
const CACHE_SECONDS = 86_400;

let lastRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

function getSearchUrl(query: string, limit: number) {
  const configuredBase = process.env.NOMINATIM_BASE_URL?.trim() || "https://nominatim.openstreetmap.org";
  const base = new URL(configuredBase);
  if (base.protocol !== "https:" || base.username || base.password) {
    throw new Error("The geocoding provider must use HTTPS and must not include credentials.");
  }

  const endpoint = new URL("search", base.toString().endsWith("/") ? base : `${base}/`);
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("limit", String(limit));
  return endpoint;
}

async function fetchNominatim(url: URL) {
  const previousRequest = requestQueue;
  let releaseRequest!: () => void;
  requestQueue = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });

  await previousRequest;
  const delay = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  lastRequestAt = Date.now();

  try {
    return await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pl,en;q=0.8",
        "User-Agent": "XzoneAcademy/1.0",
      },
      next: { revalidate: CACHE_SECONDS },
    });
  } finally {
    releaseRequest();
  }
}

function parseLocation(value: unknown): GeocodedLocation | null {
  if (typeof value !== "object" || value === null) return null;
  const item = value as Record<string, unknown>;
  const parseCoordinate = (coordinate: unknown) => {
    if (typeof coordinate !== "string" && typeof coordinate !== "number") return null;
    if (typeof coordinate === "string" && coordinate.trim() === "") return null;
    const parsed = Number(coordinate);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const latitude = parseCoordinate(item.lat);
  const longitude = parseCoordinate(item.lon);
  if (
    latitude === null
    || latitude < -90
    || latitude > 90
    || longitude === null
    || longitude < -180
    || longitude > 180
    || typeof item.display_name !== "string"
    || item.display_name.trim() === ""
  ) {
    return null;
  }

  let validBoundingBox: GeocodedLocation["boundingBox"] = null;
  if (Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
    const boundingBox = item.boundingbox.map(parseCoordinate);
    if (boundingBox.every((coordinate): coordinate is number => coordinate !== null)) {
      const [south, north, west, east] = boundingBox;
      if (
        south >= -90
        && south <= north
        && north <= 90
        && west >= -180
        && west <= east
        && east <= 180
      ) {
        validBoundingBox = [south, north, west, east];
      }
    }
  }

  return {
    id: String(item.place_id ?? `${latitude},${longitude}`),
    latitude,
    longitude,
    displayName: item.display_name,
    boundingBox: validBoundingBox,
  };
}

export async function searchOpenStreetMapAddresses(query: string, limit = 5) {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 3 || normalizedQuery.length > 240) return [];

  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 5);
  const response = await fetchNominatim(getSearchUrl(normalizedQuery, safeLimit));
  if (!response.ok) throw new Error(`OpenStreetMap geocoding returned ${response.status}.`);

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error("OpenStreetMap geocoding returned an invalid response.");

  return payload
    .map(parseLocation)
    .filter((location): location is GeocodedLocation => location !== null);
}

export function buildStoreAddressQuery(address: {
  street_address: string;
  postal_code: string;
  city: string;
  country_code: string;
}) {
  const country = new Intl.DisplayNames(["en"], { type: "region" }).of(address.country_code) ?? address.country_code;
  return [address.street_address, `${address.postal_code} ${address.city}`, country].join(", ");
}
