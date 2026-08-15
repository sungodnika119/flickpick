"use client";

import { motion } from "framer-motion";
import { ExternalLink, PartyPopper, RotateCcw, Sparkles, X } from "lucide-react";
import { moviePosterUrl, providerLogo } from "../services/tmdb";
import type { Movie, Participant } from "../types";

type Props = { movie: Movie; participants: Participant[]; onClose: () => void; onAgain: () => void };

export default function MatchModal({ movie, participants, onClose, onAgain }: Props) {
  return (
    <motion.div className="match-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}
      </div>
      <button className="match-close" onClick={onClose} aria-label="Close match celebration"><X size={20} /></button>
      <motion.div className="match-card" initial={{ scale: .78, y: 45, rotate: -2 }} animate={{ scale: 1, y: 0, rotate: 0 }} transition={{ type: "spring", stiffness: 190, damping: 16 }}>
        <div className="match-burst"><Sparkles size={17} /> unanimous pick <Sparkles size={17} /></div>
        <div className="match-poster">
          {movie.poster_path || movie.poster_url ? <img src={moviePosterUrl(movie)} alt={`${movie.title} poster`} /> : (
            <div className="match-poster-fallback">
              <span>Tonight&apos;s pick</span>
              <b>{movie.title}</b>
            </div>
          )}
          <div className="match-rings" />
        </div>
        <div className="match-copy">
          <span className="match-kicker"><PartyPopper size={17} /> It&apos;s a match!</span>
          <h2>{movie.title}</h2>
          <p>Everybody&apos;s in. Snacks ready?</p>
          <div className="match-people">
            {participants.map((person) => <span key={person.id} title={person.name}>{person.emoji}</span>)}
            <small>{participants.length === 1 ? "Your perfect pick" : `Loved by all ${participants.length}`}</small>
          </div>
          <div className="watch-panel">
            <span>Available to stream on</span>
            <div>
              {movie.providers?.length ? movie.providers.slice(0, 4).map((provider) => <span className="watch-logo" key={provider.provider_id}>{provider.logo_path && <img src={providerLogo(provider.logo_path)} alt="" />}{provider.provider_name}</span>) : <small>Check your favorite streaming service</small>}
            </div>
          </div>
          <a className="primary-button watch-button" href={`https://www.themoviedb.org/movie/${movie.id}/watch`} target="_blank" rel="noreferrer">Start watching <ExternalLink size={17} /></a>
          <button className="again-button" onClick={onAgain}><RotateCcw size={15} /> Keep swiping</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
