import type { Filters, Movie, Provider } from "../types";
import fallbackCatalog from "../data/fallback-movies.json";

const API_ROOT = "https://api.themoviedb.org/3";
const IMAGE_ROOT = "https://image.tmdb.org/t/p";
const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const bearer = process.env.NEXT_PUBLIC_TMDB_BEARER_TOKEN;

const headers = bearer ? { Authorization: `Bearer ${bearer}` } : undefined;

const DEMO_MOVIES: Movie[] = [
  {
    id: 438631,
    title: "Dune: Part Two",
    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    release_date: "2024-02-27",
    vote_average: 8.2,
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    genre_ids: [878, 12, 18],
    runtime: 167,
    providers: [
      { provider_id: 1899, provider_name: "Max", logo_path: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg" },
      { provider_id: 9, provider_name: "Prime Video", logo_path: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg" },
    ],
  },
  {
    id: 545611,
    title: "Everything Everywhere All at Once",
    overview: "An exhausted laundromat owner is swept into a wild multiverse adventure where she alone can save existence.",
    release_date: "2022-03-24",
    vote_average: 7.8,
    poster_path: "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
    genre_ids: [28, 12, 878],
    runtime: 140,
    providers: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" }],
  },
  {
    id: 120467,
    title: "The Grand Budapest Hotel",
    overview: "A legendary concierge and his trusted lobby boy become tangled in the theft of a priceless Renaissance painting.",
    release_date: "2014-02-26",
    vote_average: 8.0,
    poster_path: "/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
    genre_ids: [35, 18],
    runtime: 100,
    providers: [{ provider_id: 337, provider_name: "Disney+", logo_path: "/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg" }],
  },
  {
    id: 666277,
    title: "Past Lives",
    overview: "Two deeply connected childhood friends reunite in New York for one fateful week and confront the choices that shaped their lives.",
    release_date: "2023-06-02",
    vote_average: 7.7,
    poster_path: "/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg",
    genre_ids: [18, 10749],
    runtime: 106,
    providers: [{ provider_id: 1899, provider_name: "Max", logo_path: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg" }],
  },
  {
    id: 329865,
    title: "Arrival",
    overview: "A linguist works with the military to communicate with alien lifeforms after mysterious spacecraft appear around the world.",
    release_date: "2016-11-10",
    vote_average: 7.6,
    poster_path: "/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
    genre_ids: [18, 878],
    runtime: 116,
    providers: [{ provider_id: 15, provider_name: "Hulu", logo_path: "/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg" }],
  },
  {
    id: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    overview: "Miles Morales catapults across the Multiverse, where he encounters a team charged with protecting its very existence.",
    release_date: "2023-05-31",
    vote_average: 8.3,
    poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    genre_ids: [16, 28, 12],
    runtime: 140,
    providers: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" }],
  },
];

const COMMUNITY_MOVIES = (fallbackCatalog as unknown as Movie[]).map((movie) => ({
  ...movie,
  title: String(movie.title),
}));
const CURATED_TITLES = new Set(DEMO_MOVIES.map((movie) => movie.title.toLowerCase()));
const FALLBACK_MOVIES = [
  ...DEMO_MOVIES,
  ...COMMUNITY_MOVIES.filter((movie) => !CURATED_TITLES.has(movie.title.toLowerCase())),
];

function authQuery(path: string) {
  const join = path.includes("?") ? "&" : "?";
  return apiKey && !bearer ? `${path}${join}api_key=${apiKey}` : path;
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${authQuery(path)}`, { headers });
  if (!response.ok) throw new Error(`TMDB request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function posterUrl(path: string | null, size = "w780") {
  return path ? `${IMAGE_ROOT}/${size}${path}` : "";
}

export function moviePosterUrl(movie: Movie) {
  return movie.poster_url || posterUrl(movie.poster_path);
}

export function providerLogo(path: string | null) {
  return path ? `${IMAGE_ROOT}/w92${path}` : "";
}

export function genreName(id: number) {
  const names: Record<number, string> = { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 18: "Drama", 27: "Horror", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller" };
  return names[id] || "Movie";
}

export async function getWatchProviders(movieId: number, region = "US"): Promise<Provider[]> {
  if (!apiKey && !bearer) return DEMO_MOVIES.find((movie) => movie.id === movieId)?.providers || [];
  const data = await tmdbFetch<{ results: Record<string, { link: string; flatrate?: Provider[] }> }>(`/movie/${movieId}/watch/providers`);
  return data.results?.[region]?.flatrate || [];
}

export async function discoverMovies(filters: Filters, page = 1): Promise<Movie[]> {
  if (!apiKey && !bearer) {
    const decade = filters.decade.match(/\d{4}/)?.[0];
    return FALLBACK_MOVIES.filter((movie) => {
      const matchesRating = movie.vote_average >= filters.minRating;
      const matchesGenre = !filters.genres.length || movie.genre_ids.some((id) => filters.genres.includes(id));
      const year = Number(movie.release_date?.slice(0, 4));
      const matchesDecade = !decade || (year >= Number(decade) && year <= Number(decade) + 9);
      return matchesRating && matchesGenre && matchesDecade;
    });
  }
  const decade = filters.decade.match(/\d{4}/)?.[0];
  const params = new URLSearchParams({
    include_adult: "false",
    include_video: "false",
    language: "en-US",
    page: String(page),
    sort_by: "popularity.desc",
    "vote_average.gte": String(filters.minRating),
    "vote_count.gte": "200",
  });
  if (filters.genres.length) params.set("with_genres", filters.genres.join("|"));
  if (decade) {
    params.set("primary_release_date.gte", `${decade}-01-01`);
    params.set("primary_release_date.lte", `${Number(decade) + 9}-12-31`);
  }
  const data = await tmdbFetch<{ results: Movie[] }>(`/discover/movie?${params}`);
  return data.results.filter((movie) => movie.poster_path);
}

export async function loadMovieCatalog(filters: Filters, count = 500): Promise<Movie[]> {
  if (!apiKey && !bearer) return (await discoverMovies(filters)).slice(0, count);

  const pagesNeeded = Math.ceil(count / 20);
  const catalog: Movie[] = [];
  const seen = new Set<number>();

  for (let start = 1; start <= pagesNeeded && catalog.length < count; start += 5) {
    const pages = Array.from({ length: Math.min(5, pagesNeeded - start + 1) }, (_, offset) => start + offset);
    const results = await Promise.all(pages.map((page) => discoverMovies(filters, page)));
    results.flat().forEach((movie) => {
      if (!seen.has(movie.id)) {
        seen.add(movie.id);
        catalog.push(movie);
      }
    });
  }

  return catalog.slice(0, count);
}

export async function enrichMovieBatch(movies: Movie[]): Promise<Movie[]> {
  return Promise.all(movies.map(async (movie) => {
    let enriched = movie;

    // The offline catalog intentionally keeps its payload small, so it stores
    // titles without artwork. Resolve artwork only for cards a person reaches.
    if (!enriched.poster_path && (apiKey || bearer)) {
      const params = new URLSearchParams({ query: enriched.title, language: "en-US" });
      const year = enriched.release_date?.slice(0, 4);
      if (year) params.set("year", year);
      const result = await tmdbFetch<{ results: Movie[] }>(`/search/movie?${params}`).catch(() => null);
      const match = result?.results.find((candidate) => candidate.poster_path) || result?.results[0];
      if (match?.poster_path) enriched = { ...enriched, poster_path: match.poster_path };
    }

    if (!enriched.poster_path && !enriched.poster_url) {
      const params = new URLSearchParams({ title: enriched.title });
      const year = enriched.release_date?.slice(0, 4);
      if (year) params.set("year", year);
      const response = await fetch(`/api/poster?${params}`).catch(() => null);
      const result = response?.ok ? await response.json().catch(() => null) as { posterUrl?: string | null } | null : null;
      if (result?.posterUrl) enriched = { ...enriched, poster_url: result.posterUrl };
    }

    if (enriched.providers !== undefined || enriched.id < 0) return enriched;
    return { ...enriched, providers: await getWatchProviders(enriched.id).catch(() => []) };
  }));
}

export function getDemoMovies() {
  return FALLBACK_MOVIES;
}
