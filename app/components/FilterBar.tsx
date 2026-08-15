"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GENRES, type Filters } from "../types";

type Props = {
  filters: Filters;
  open: boolean;
  onToggle: () => void;
  onApply: (filters: Filters) => void;
};

export default function FilterBar({ filters, open, onToggle, onApply }: Props) {
  const [draftFilters, setDraftFilters] = useState(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const closeWithoutApplying = () => {
    setDraftFilters(filters);
    onToggle();
  };

  return (
    <>
      <button className="filter-toggle" onClick={onToggle} aria-expanded={open} aria-label="Adjust movie filters">
        <SlidersHorizontal size={17} /> Filters
        <span>{filters.genres.length}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="filter-popover" initial={{ opacity: 0, y: -10, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: .97 }}>
            <div className="filter-popover-head">
              <div><span className="eyebrow">Tonight&apos;s mood</span><h3>Fine-tune the deck</h3></div>
              <button className="icon-quiet" onClick={closeWithoutApplying} aria-label="Close filters"><X size={18} /></button>
            </div>
            <div className="chip-grid compact">
              {GENRES.map((genre) => (
                <button key={genre.id} className={`filter-chip ${draftFilters.genres.includes(genre.id) ? "selected" : ""}`} onClick={() => setDraftFilters({ ...draftFilters, genres: draftFilters.genres.includes(genre.id) ? draftFilters.genres.filter((id) => id !== genre.id) : [...draftFilters.genres, genre.id] })}>
                  {genre.name}
                </button>
              ))}
            </div>
            <label className="range-label"><span>Minimum rating</span><strong>{draftFilters.minRating.toFixed(1)}+</strong></label>
            <input aria-label="Minimum rating" type="range" min="5" max="9" step=".5" value={draftFilters.minRating} onChange={(e) => setDraftFilters({ ...draftFilters, minRating: Number(e.target.value) })} />
            <button className="filter-done" onClick={() => { onApply(draftFilters); onToggle(); }}>Done</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
