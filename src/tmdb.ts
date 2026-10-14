const KEY = import.meta.env.VITE_TMDB_KEY as string;
const BASE = "https://api.themoviedb.org/3";
const REGION = "BR";
const LANG = "pt-BR";

export const IMG = {
  poster: (path: string | null, size: "w342" | "w500" = "w342") =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
  backdrop: (path: string | null, size: "w780" | "w1280" = "w1280") =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,
};

export const PROVIDERS = [
  { id: 8, name: "Netflix", color: "#E50914" },
  { id: 119, name: "Prime Video", color: "#1FA2FF" },
  { id: 1899, name: "Max", color: "#9A6CFF" },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]["id"];

export type Movie = {
  id: number;
  title: string;
  year: string;
  rating: number;
  votes: number;
  poster: string | null;
  backdrop: string | null;
  overview: string;
  genreIds: number[];
};

type RawMovie = {
  id: number;
  title: string;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  genre_ids?: number[];
};

function mapMovie(m: RawMovie): Movie {
  return {
    id: m.id,
    title: m.title,
    year: m.release_date ? m.release_date.slice(0, 4) : "",
    rating: m.vote_average,
    votes: m.vote_count,
    poster: m.poster_path,
    backdrop: m.backdrop_path,
    overview: m.overview,
    genreIds: m.genre_ids ?? [],
  };
}

async function get<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", KEY);
  url.searchParams.set("language", LANG);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

export async function fetchGenres(): Promise<Record<number, string>> {
  const data = await get<{ genres: { id: number; name: string }[] }>("/genre/movie/list", {});
  const map: Record<number, string> = {};
  for (const g of data.genres) map[g.id] = g.name;
  return map;
}

export type DiscoverResult = { movies: Movie[]; totalPages: number };

export async function discover(opts: {
  providers: ProviderId[];
  page: number;
  minVotes: number;
  genre?: number | null;
}): Promise<DiscoverResult> {
  const providers = opts.providers.length ? opts.providers : PROVIDERS.map((p) => p.id);
  const params: Record<string, string | number> = {
    watch_region: REGION,
    with_watch_providers: providers.join("|"),
    with_watch_monetization_types: "flatrate",
    sort_by: "vote_average.desc",
    "vote_count.gte": opts.minVotes,
    include_adult: "false",
    page: opts.page,
  };
  if (opts.genre) params.with_genres = opts.genre;
  const data = await get<{ results: RawMovie[]; total_pages: number }>("/discover/movie", params);
  return { movies: data.results.map(mapMovie), totalPages: data.total_pages };
}

export async function fetchTitleLogo(movieId: number): Promise<string | null> {
  try {
    const data = await get<{
      logos: { file_path: string; iso_639_1: string | null }[];
    }>(`/movie/${movieId}/images`, { include_image_language: "pt,en,null" });
    const logos = data.logos ?? [];
    if (!logos.length) return null;
    const pick =
      logos.find((l) => l.iso_639_1 === "pt") ??
      logos.find((l) => l.iso_639_1 === "en") ??
      logos[0];
    return `https://image.tmdb.org/t/p/w500${pick.file_path}`;
  } catch {
    return null;
  }
}

export type WhereToWatch = { id: number; name: string; logo: string | null };

export async function fetchProvidersFor(movieId: number): Promise<WhereToWatch[]> {
  const data = await get<{
    results: Record<string, { flatrate?: { provider_id: number; provider_name: string; logo_path: string | null }[] }>;
  }>(`/movie/${movieId}/watch/providers`, {});
  const br = data.results?.[REGION]?.flatrate ?? [];
  return br.map((p) => ({
    id: p.provider_id,
    name: p.provider_name,
    logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null,
  }));
}
