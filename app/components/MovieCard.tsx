"use client";

import { AnimatePresence, motion, type MotionValue, useMotionValue, useTransform } from "framer-motion";
import { ChevronDown, Clock3, Star } from "lucide-react";
import { useState } from "react";
import { genreName, moviePosterUrl, providerLogo } from "../services/tmdb";
import type { Movie } from "../types";

type Props = {
  movie: Movie;
  x?: MotionValue<number>;
  isTop?: boolean;
};

export default function MovieCard({ movie, x, isTop = false }: Props) {
  const [details, setDetails] = useState(false);
  const fallbackX = useMotionValue(0);
  const likeOpacity = useTransform(x || fallbackX, [20, 100], [0, 1]);
  const passOpacity = useTransform(x || fallbackX, [-100, -20], [1, 0]);
  const year = movie.release_date?.slice(0, 4) || "TBA";

  return (
    <div className="movie-card" aria-label={`${movie.title}, released ${year}`}>
      <div className="poster-wrap">
        {movie.poster_path || movie.poster_url ? <img src={moviePosterUrl(movie)} alt={`${movie.title} poster`} draggable={false} /> : (
          <div className="poster-fallback" style={{ "--poster-hue": Math.abs(movie.id) % 360 } as React.CSSProperties}>
            <i className="poster-orbit one" /><i className="poster-orbit two" />
            <span>{genreName(movie.genre_ids[0])}</span>
            <b>{movie.title}</b>
            <small>A FlickPick favorite</small>
          </div>
        )}
        <div className="poster-vignette" />
        {isTop && <>
          <motion.div className="swipe-stamp like" style={{ opacity: likeOpacity }}>YES!</motion.div>
          <motion.div className="swipe-stamp pass" style={{ opacity: passOpacity }}>PASS</motion.div>
        </>}
        <div className="card-content">
          <div className="rating"><Star size={13} fill="currentColor" /> {movie.vote_average.toFixed(1)}</div>
          <h2>{movie.title}</h2>
          <div className="meta-row">
            <span>{year}</span><i />
            {movie.runtime && <><span><Clock3 size={13} /> {movie.runtime} min</span><i /></>}
            <span>{genreName(movie.genre_ids[0])}</span>
          </div>
          <div className="genre-row">
            {movie.genre_ids.slice(0, 3).map((id) => <span key={id}>{genreName(id)}</span>)}
          </div>
          <p className={`overview ${details ? "expanded" : ""}`}>{movie.overview}</p>
          <button className="details-toggle" onClick={(event) => { event.stopPropagation(); setDetails(!details); }} aria-expanded={details}>
            {details ? "Less detail" : "More detail"}<ChevronDown size={15} className={details ? "rotate" : ""} />
          </button>
          <AnimatePresence>
            {details && (
              <motion.div className="provider-drawer" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <span className="provider-label">Stream with</span>
                <div className="provider-list">
                  {movie.providers?.length ? movie.providers.slice(0, 4).map((provider) => (
                    <span className="provider-badge" key={provider.provider_id}>
                      {provider.logo_path ? <img src={providerLogo(provider.logo_path)} alt="" /> : <b>{provider.provider_name[0]}</b>}
                      {provider.provider_name}
                    </span>
                  )) : <span className="availability-note">Availability varies by region</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
