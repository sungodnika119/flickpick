"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Heart, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Movie } from "../types";
import MovieCard from "./MovieCard";

type Props = {
  movies: Movie[];
  index: number;
  onVote: (movie: Movie, decision: "like" | "pass") => void;
  onReset: () => void;
};

export default function SwipeDeck({ movies, index, onVote, onReset }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 180], [-11, 11]);
  const [leaving, setLeaving] = useState<"like" | "pass" | null>(null);
  const visible = movies.slice(index, index + 3);

  const vote = useCallback((decision: "like" | "pass") => {
    if (!visible[0] || leaving) return;
    setLeaving(decision);
    window.setTimeout(() => {
      onVote(visible[0], decision);
      x.set(0);
      setLeaving(null);
    }, 220);
  }, [leaving, onVote, visible, x]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") vote("like");
      if (event.key === "ArrowLeft") vote("pass");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [vote]);

  if (!visible.length) {
    return (
      <div className="empty-deck">
        <div className="empty-orbit"><span>🍿</span></div>
        <span className="eyebrow">That&apos;s the whole reel</span>
        <h2>You&apos;ve seen every pick</h2>
        <p>Adjust the filters or replay the deck while your friends catch up.</p>
        <button className="primary-button small" onClick={onReset}><RotateCcw size={17} /> Replay deck</button>
      </div>
    );
  }

  return (
    <div className="deck-shell">
      <div className="deck-progress"><span style={{ width: `${Math.max(6, ((index + 1) / movies.length) * 100)}%` }} /></div>
      <p className="deck-count"><strong>{index + 1}</strong> of {movies.length} picks</p>
      <div className="card-stack">
        {visible.slice().reverse().map((movie, reverseIndex) => {
          const layer = visible.length - 1 - reverseIndex;
          const top = layer === 0;
          return top ? (
            <AnimatePresence key={movie.id}>
              <motion.div
                className="card-layer top"
                style={{ x, rotate }}
                animate={leaving ? { x: leaving === "like" ? 620 : -620, rotate: leaving === "like" ? 22 : -22, opacity: .4 } : { x: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={.9}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 90 || info.velocity.x > 650) vote("like");
                  else if (info.offset.x < -90 || info.velocity.x < -650) vote("pass");
                }}
                whileTap={{ cursor: "grabbing" }}
              >
                <MovieCard movie={movie} x={x} isTop />
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div className="card-layer" key={movie.id} initial={false} animate={{ scale: 1 - layer * .035, y: layer * 12, opacity: 1 - layer * .16 }}>
              <MovieCard movie={movie} />
            </motion.div>
          );
        })}
      </div>
      <div className="vote-actions">
        <button className="vote-button pass-button" onClick={() => vote("pass")} aria-label="Pass on this movie"><X size={28} strokeWidth={2.5} /></button>
        <span>swipe your vote</span>
        <button className="vote-button like-button" onClick={() => vote("like")} aria-label="Like this movie"><Heart size={27} strokeWidth={2.4} fill="currentColor" /></button>
      </div>
    </div>
  );
}
