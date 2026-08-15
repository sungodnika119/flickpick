"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Clapperboard, Heart, Link2, LoaderCircle, Play, Sparkles, Star, Users, X } from "lucide-react";
import { useState } from "react";
import { DEFAULT_FILTERS, GENRES, type Filters } from "../types";

type Props = {
  initialCode?: string;
  loading?: boolean;
  error?: string;
  onCreate: (name: string, filters: Filters) => void;
  onJoin: (name: string, code: string) => void;
};

export default function RoomLobby({ initialCode = "", loading, error, onCreate, onJoin }: Props) {
  const [mode, setMode] = useState<"create" | "join">(initialCode ? "join" : "create");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState(initialCode);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (mode === "create") onCreate(name.trim(), filters);
    else if (roomCode.trim().length === 6) onJoin(name.trim(), roomCode.trim().toUpperCase());
  };

  return (
    <main className="landing">
      <nav className="landing-nav">
        <a className="brand" href="#" aria-label="FlickPick home"><span><Play size={18} fill="currentColor" /></span>Flick<span>Pick</span></a>
        <span className="live-pill"><i /> Live with friends</span>
      </nav>
      <section className="hero">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="eyebrow-badge"><Sparkles size={14} /> Movie night, solved</div>
          <h1>Stop scrolling.<br /><em>Start watching.</em></h1>
          <p>Swipe through movies together. The moment everyone likes the same one, it&apos;s a match.</p>
          <div className="trust-row">
            <div className="avatar-stack"><span>🦊</span><span>🐼</span><span>🐸</span><span>🐯</span></div>
            <div><div className="stars">★★★★★</div><span>Loved by indecisive friend groups</span></div>
          </div>
        </motion.div>

        <motion.div className="lobby-card" initial={{ opacity: 0, y: 25, rotate: 1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: .08 }}>
          <div className="mode-tabs" role="tablist">
            <button className={mode === "create" ? "active" : ""} onClick={() => setMode("create")} role="tab"><Clapperboard size={17} /> Create a room</button>
            <button className={mode === "join" ? "active" : ""} onClick={() => setMode("join")} role="tab"><Users size={17} /> Join friends</button>
          </div>
          <form onSubmit={submit}>
            <div className="form-heading">
              <span className="step-dot">1</span>
              <div><span className="eyebrow">{mode === "create" ? "Your screening room" : "The gang's waiting"}</span><h2>{mode === "create" ? "Build tonight’s shortlist" : "Join the movie night"}</h2></div>
            </div>
            <label className="field-label" htmlFor="display-name">What should we call you?</label>
            <input id="display-name" className="text-input" placeholder="e.g. Jamie" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} autoComplete="name" required />

            {mode === "create" ? (
              <>
                <div className="form-divider"><span>2</span><b>Pick a vibe</b><i /></div>
                <div className="chip-grid">
                  {GENRES.map((genre) => (
                    <button type="button" key={genre.id} className={`filter-chip ${filters.genres.includes(genre.id) ? "selected" : ""}`} onClick={() => setFilters({ ...filters, genres: filters.genres.includes(genre.id) ? filters.genres.filter((id) => id !== genre.id) : [...filters.genres, genre.id] })}>
                      {filters.genres.includes(genre.id) && <Check size={13} />}{genre.name}
                    </button>
                  ))}
                </div>
                <div className="filter-row">
                  <label><span><Star size={14} fill="currentColor" /> Min rating</span><select value={filters.minRating} onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}><option value="6">6.0+</option><option value="7">7.0+</option><option value="7.5">7.5+</option><option value="8">8.0+</option></select><ChevronDown size={15} /></label>
                  <label><span>Release year</span><select value={filters.decade} onChange={(e) => setFilters({ ...filters, decade: e.target.value })}><option>Any year</option><option>2020s</option><option>2010s</option><option>2000s</option><option>1990s</option></select><ChevronDown size={15} /></label>
                </div>
              </>
            ) : (
              <>
                <label className="field-label code-label" htmlFor="room-code"><Link2 size={14} /> 6-character room code</label>
                <input id="room-code" className="text-input room-code-input" placeholder="FLC123" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} minLength={6} required />
              </>
            )}

            {error && <div className="form-error"><X size={15} />{error}</div>}
            <button className="primary-button" disabled={loading || !name.trim()}>{loading ? <LoaderCircle className="spin" size={19} /> : mode === "create" ? <Clapperboard size={19} /> : <Users size={19} />}{loading ? "Getting the room ready…" : mode === "create" ? "Create movie room" : "Join the room"}<ArrowRight size={19} /></button>
            <p className="form-note">No account needed · Free to play · Invite up to 8 friends</p>
          </form>
        </motion.div>
      </section>
      <section className="how-it-works" aria-label="How it works">
        <div><span><Link2 size={19} /></span><p><b>1. Share a room</b><small>One link brings everyone in.</small></p></div>
        <i />
        <div><span><Heart size={19} /></span><p><b>2. Swipe together</b><small>Like it or leave it. No debates.</small></p></div>
        <i />
        <div><span><Sparkles size={19} /></span><p><b>3. Get your match</b><small>We reveal the unanimous winner.</small></p></div>
      </section>
      <footer>Movie data &amp; streaming availability provided by <b>TMDB</b><span>FlickPick doesn&apos;t play favorites. Just movies.</span></footer>
    </main>
  );
}
