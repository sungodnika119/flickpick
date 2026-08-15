"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Copy, LogOut, MoreHorizontal, Play, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import FilterBar from "./components/FilterBar";
import MatchModal from "./components/MatchModal";
import RoomLobby from "./components/RoomLobby";
import SwipeDeck from "./components/SwipeDeck";
import { castVote, createRoom, ensureAnonymousUser, firebaseEnabled, heartbeat, joinRoom, markMatch, subscribeToRoom } from "./services/firebase";
import { enrichMovieBatch, getDemoMovies, loadMovieCatalog } from "./services/tmdb";
import { DEFAULT_FILTERS, type Filters, type Movie, type Participant, type Room, type Vote } from "./types";

function lastSeenMillis(value: unknown) {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toMillis" in value) return (value as { toMillis: () => number }).toMillis();
  return Date.now();
}

export default function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [user, setUser] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [movies, setMovies] = useState<Movie[]>(getDemoMovies());
  const [cardIndex, setCardIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMatch, setShowMatch] = useState(true);
  const [initialCode, setInitialCode] = useState("");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setInitialCode((search.get("room") || "").toUpperCase());
  }, []);

  useEffect(() => {
    if (!room) return;
    const unsubscribe = subscribeToRoom(room.id, setRoom, setParticipants, setVotes);
    const ping = () => user && heartbeat(room.id, user.id).catch(() => undefined);
    ping();
    const interval = window.setInterval(ping, 45000);
    return () => { unsubscribe(); window.clearInterval(interval); };
  }, [room?.id, user?.id]);

  const activeParticipants = useMemo(() => participants.filter((participant) => participant.active !== false && Date.now() - lastSeenMillis(participant.lastSeen) < 120000), [participants, votes]);

  useEffect(() => {
    if (!room || !activeParticipants.length || room.matchedMovieId) return;
    const unanimous = votes.find((vote) => activeParticipants.every((participant) => vote.voters?.[participant.id] === "like"));
    if (unanimous) markMatch(room.id, unanimous.movieId).catch(() => undefined);
  }, [activeParticipants, room, votes]);

  useEffect(() => {
    if (room?.matchedMovieId) setShowMatch(true);
  }, [room?.matchedMovieId]);

  const loadMovies = useCallback(async (filters: Filters) => {
    const catalog = await loadMovieCatalog(filters, 500).catch(() => getDemoMovies().slice(0, 500));
    const nextMovies = catalog.length ? catalog : getDemoMovies().slice(0, 500);
    setMovies(nextMovies);
    void enrichMovieBatch(nextMovies.slice(0, 10)).then((enriched) => {
      const replacements = new Map(enriched.map((movie) => [movie.id, movie]));
      setMovies((current) => current.map((movie) => replacements.get(movie.id) || movie));
    });
    return nextMovies;
  }, []);

  useEffect(() => {
    if (!room) return;
    const upcoming = movies.slice(cardIndex, cardIndex + 10);
    if (!upcoming.some((movie) => !movie.poster_path || (movie.id > 0 && movie.providers === undefined))) return;
    let cancelled = false;
    void enrichMovieBatch(upcoming).then((enriched) => {
      if (cancelled) return;
      const replacements = new Map(enriched.map((movie) => [movie.id, movie]));
      setMovies((current) => current.map((movie) => replacements.get(movie.id) || movie));
    });
    return () => { cancelled = true; };
  }, [cardIndex, room?.id]);

  const handleCreate = async (name: string, filters: Filters) => {
    setLoading(true); setError("");
    try {
      const batch = await loadMovies(filters);
      const result = await createRoom(name, filters, batch.map((movie) => movie.id));
      setRoom(result.room); setUser(result.participant); setParticipants([result.participant]); setCardIndex(0);
      window.history.replaceState(null, "", `?room=${result.room.code}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong while creating the room.");
    } finally { setLoading(false); }
  };

  const handleJoin = async (name: string, code: string) => {
    setLoading(true); setError("");
    try {
      const result = await joinRoom(code, name);
      await loadMovies(result.room.filters || DEFAULT_FILTERS);
      setRoom(result.room); setUser(result.participant); setCardIndex(0);
      window.history.replaceState(null, "", `?room=${result.room.code}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t join that room.");
    } finally { setLoading(false); }
  };

  const handleVote = async (movie: Movie, decision: "like" | "pass") => {
    if (!room || !user) return;
    setCardIndex((current) => current + 1);
    await castVote(room.id, movie.id, user.id, decision);
    if (decision === "like" && activeParticipants.length <= 1) await markMatch(room.id, movie.id);
  };

  const copyInvite = async () => {
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    await navigator.clipboard?.writeText(url);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };

  const leave = () => {
    setRoom(null); setUser(null); setParticipants([]); setVotes([]); setCardIndex(0); setError("");
    window.history.replaceState(null, "", window.location.pathname);
  };

  const applyFilters = (filters: Filters) => {
    if (!room) return;
    setRoom({ ...room, filters });
    setCardIndex(0);
    void loadMovies(filters);
  };

  const matchedMovie = room?.matchedMovieId ? movies.find((movie) => movie.id === room.matchedMovieId) : null;

  if (!room) return <RoomLobby initialCode={initialCode} loading={loading} error={error} onCreate={handleCreate} onJoin={handleJoin} />;

  return (
    <main className="room-page">
      <header className="room-nav">
        <button className="brand room-brand" onClick={leave} aria-label="Back to FlickPick home"><span><Play size={16} fill="currentColor" /></span>Flick<span>Pick</span></button>
        <div className="room-nav-actions">
          {!firebaseEnabled && <span className="demo-pill">Demo room</span>}
          <FilterBar filters={room.filters} open={filtersOpen} onToggle={() => setFiltersOpen(!filtersOpen)} onApply={applyFilters} />
          <button className="icon-quiet menu-button" aria-label="Room options"><MoreHorizontal size={20} /></button>
        </div>
      </header>

      <section className="room-layout">
        <aside className="room-sidebar">
          <button className="back-link" onClick={leave}><ChevronLeft size={16} /> Leave room</button>
          <span className="eyebrow">Movie night room</span>
          <h1>Find the one<br />everyone loves.</h1>
          <p>Swipe right on your favorites. We&apos;ll tell you the second everyone agrees.</p>
          <div className="invite-card">
            <span>Invite your friends</span>
            <div className="room-code-display"><strong>{room.code}</strong><button onClick={copyInvite} aria-label="Copy invite link">{copied ? <Check size={18} /> : <Copy size={18} />}</button></div>
            <small>{copied ? "Invite link copied!" : "Tap to copy the room link"}</small>
          </div>
          <div className="people-panel">
            <div><span><Users size={16} /> In the room</span><b>{activeParticipants.length}/8</b></div>
            <ul>
              {activeParticipants.map((person) => <li key={person.id}><span className="person-avatar">{person.emoji}</span><p>{person.name}{person.id === room.hostId && <small>Host</small>}</p><i title="Online" /></li>)}
            </ul>
          </div>
          <button className="leave-button" onClick={leave}><LogOut size={16} /> Leave movie night</button>
        </aside>

        <section className="swipe-stage">
          <div className="mobile-room-top">
            <div className="mobile-code"><span>Room</span><b>{room.code}</b><button onClick={copyInvite}>{copied ? <Check size={15} /> : <Copy size={15} />}</button></div>
            <div className="avatar-stack small">{activeParticipants.slice(0, 4).map((person) => <span key={person.id}>{person.emoji}</span>)}</div>
          </div>
          <motion.div className="stage-heading" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <span className="eyebrow">Now picking</span>
            <h2>Would you watch this?</h2>
          </motion.div>
          <SwipeDeck movies={movies} index={cardIndex} onVote={handleVote} onReset={() => setCardIndex(0)} />
          <p className="swipe-hint"><kbd>←</kbd> pass <span>·</span> like <kbd>→</kbd></p>
        </section>

        <aside className="room-activity">
          <div className="activity-head"><span className="live-dot"><i /> Live</span><small>{activeParticipants.length} picking</small></div>
          <h3>Your movie night</h3>
          <div className="mini-people">{activeParticipants.map((person) => <div key={person.id}><span>{person.emoji}</span><small>{person.name}</small></div>)}</div>
          <div className="activity-divider" />
          <span className="eyebrow">Live activity</span>
          <div className="activity-feed">
            {votes.length ? votes.slice(-3).reverse().map((vote) => <div key={vote.movieId}><span>✨</span><p><b>{Object.keys(vote.voters || {}).length} vote{Object.keys(vote.voters || {}).length === 1 ? "" : "s"} in</b><small>Everyone&apos;s choices stay secret</small></p></div>) : <div><span>👋</span><p><b>Room is ready</b><small>Share the code to bring friends in</small></p></div>}
          </div>
          <div className="privacy-note"><span>🔒</span><p><b>No peeking</b><small>Votes are hidden until there&apos;s a match.</small></p></div>
        </aside>
      </section>

      <AnimatePresence>{matchedMovie && showMatch && <MatchModal movie={matchedMovie} participants={activeParticipants} onClose={() => setShowMatch(false)} onAgain={() => { setShowMatch(false); setCardIndex((index) => Math.min(index + 1, movies.length)); }} />}</AnimatePresence>
    </main>
  );
}
