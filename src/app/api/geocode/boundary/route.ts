import { NextRequest } from "next/server";
import { errorResponse, success } from "@/lib/response";

type NominatimResult = {
  place_id: number;
  display_name: string;
  class?: string;
  type?: string;
  geojson?: {
    type: string;
    coordinates: unknown;
  };
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2) return errorResponse("Masukkan minimal 2 karakter nama wilayah.", 422);

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("polygon_geojson", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      "Accept-Language": "id,en;q=0.8",
      "User-Agent": "SIGMANTA-WebGIS/1.0 (local-development)",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) return errorResponse("Pencarian batas wilayah gagal dijalankan.", 502);

  const data = (await response.json()) as NominatimResult[];
  const results = data
    .filter((item) => item.geojson?.type === "Polygon" || item.geojson?.type === "MultiPolygon")
    .map((item) => ({
      id: String(item.place_id),
      name: item.display_name,
      osmClass: item.class ?? null,
      osmType: item.type ?? null,
      geojson: {
        type: "Feature",
        properties: {
          source: "OpenStreetMap Nominatim",
          placeId: item.place_id,
          name: item.display_name,
          osmClass: item.class ?? null,
          osmType: item.type ?? null,
        },
        geometry: item.geojson,
      },
    }));

  return success({ results });
}
