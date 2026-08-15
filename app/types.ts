export type Filters = {
  genres: number[];
  minRating: number;
  decade: string;
  providers: string[];
};

export type Provider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
};

export type Movie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  poster_path: string | null;
  poster_url?: string | null;
  backdrop_path?: string | null;
  genre_ids: number[];
  runtime?: number;
  providers?: Provider[];
};

export type Participant = {
  id: string;
  name: string;
  emoji: string;
  active?: boolean;
  joinedAt?: number;
  lastSeen?: number;
};

export type Vote = {
  movieId: number;
  voters: Record<string, "like" | "pass">;
};

export type Room = {
  id: string;
  code: string;
  hostId: string;
  status: "lobby" | "swiping" | "matched";
  filters: Filters;
  movieIds: number[];
  matchedMovieId?: number | null;
  createdAt?: number;
};

export const GENRES = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 10749, name: "Romance" },
  { id: 16, name: "Animation" },
  { id: 27, name: "Horror" },
];

export const PROVIDERS = ["Netflix", "Disney+", "Prime Video", "Hulu", "Max"];

export const DEFAULT_FILTERS: Filters = {
  genres: [28, 35, 18],
  minRating: 7,
  decade: "Any year",
  providers: [],
};
