import type {
  PublicArtwork, PublicCategory, PublicFilterOptions, PublicGalleryEvent, PublicSettings,
} from "@basmat-fan/shared";

const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");

export async function fetchPublicContent(searchParams: URLSearchParams = new URLSearchParams()) {
  const query = searchParams.toString();
  const response = await fetch(`${apiBase}/public/gallery${query ? `?${query}` : ""}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`تعذر تحميل المعرض (${response.status})`);
  return response.json() as Promise<{
    artworks: PublicArtwork[];
    categories: PublicCategory[];
    settings: PublicSettings;
    filters: PublicFilterOptions;
    events: PublicGalleryEvent[];
    pagination: { page: number; pageSize: number; total: number; pages: number };
  }>;
}
