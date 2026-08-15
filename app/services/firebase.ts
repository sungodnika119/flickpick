import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import type { Filters, Participant, Room, Vote } from "../types";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

const app = firebaseEnabled ? (getApps().length ? getApp() : initializeApp(config)) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

const EMOJIS = ["🦊", "🐼", "🐸", "🐯", "🐙", "🦁", "🐨", "🦋"];

function code() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function localUser(): User | { uid: string } {
  const key = "flickpick-user";
  let uid = typeof window !== "undefined" ? localStorage.getItem(key) : null;
  if (!uid) {
    uid = crypto.randomUUID();
    if (typeof window !== "undefined") localStorage.setItem(key, uid);
  }
  return { uid };
}

export async function ensureAnonymousUser() {
  if (!auth) return localUser();
  return auth.currentUser || (await signInAnonymously(auth)).user;
}

function localRooms(): Record<string, { room: Room; participants: Participant[]; votes: Vote[] }> {
  try { return JSON.parse(localStorage.getItem("flickpick-rooms") || "{}"); } catch { return {}; }
}

function saveLocalRooms(rooms: ReturnType<typeof localRooms>) {
  localStorage.setItem("flickpick-rooms", JSON.stringify(rooms));
  window.dispatchEvent(new Event("flickpick-sync"));
  new BroadcastChannel("flickpick-rooms").postMessage("sync");
}

export async function createRoom(hostName: string, filters: Filters, movieIds: number[]) {
  const user = await ensureAnonymousUser();
  const roomId = crypto.randomUUID();
  const roomCode = code();
  const room: Room = { id: roomId, code: roomCode, hostId: user.uid, status: "swiping", filters, movieIds, createdAt: Date.now() };
  const participant: Participant = { id: user.uid, name: hostName, emoji: EMOJIS[0], active: true, joinedAt: Date.now(), lastSeen: Date.now() };

  if (db) {
    await setDoc(doc(db, "rooms", roomId), { ...room, createdAt: serverTimestamp() });
    await setDoc(doc(db, "rooms", roomId, "participants", user.uid), { ...participant, joinedAt: serverTimestamp(), lastSeen: serverTimestamp() });
  } else {
    const rooms = localRooms();
    rooms[roomId] = { room, participants: [participant], votes: [] };
    saveLocalRooms(rooms);
  }
  return { room, participant };
}

export async function joinRoom(roomCode: string, displayName: string) {
  const user = await ensureAnonymousUser();
  let room: Room | undefined;
  if (db) {
    const matches = await getDocs(query(collection(db, "rooms"), where("code", "==", roomCode.toUpperCase())));
    if (!matches.empty) room = { id: matches.docs[0].id, ...matches.docs[0].data() } as Room;
  } else {
    room = Object.values(localRooms()).find((item) => item.room.code === roomCode.toUpperCase())?.room;
  }
  if (!room) throw new Error("We couldn’t find that room. Check the code and try again.");
  const participant: Participant = { id: user.uid, name: displayName, emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)], active: true, joinedAt: Date.now(), lastSeen: Date.now() };
  if (db) {
    await setDoc(doc(db, "rooms", room.id, "participants", user.uid), { ...participant, joinedAt: serverTimestamp(), lastSeen: serverTimestamp() }, { merge: true });
  } else {
    const rooms = localRooms();
    const existing = rooms[room.id].participants.filter((p) => p.id !== user.uid);
    rooms[room.id].participants = [...existing, participant];
    saveLocalRooms(rooms);
  }
  return { room, participant };
}

export async function getRoomByCode(roomCode: string) {
  if (db) {
    const matches = await getDocs(query(collection(db, "rooms"), where("code", "==", roomCode.toUpperCase())));
    return matches.empty ? null : ({ id: matches.docs[0].id, ...matches.docs[0].data() } as Room);
  }
  return Object.values(localRooms()).find((item) => item.room.code === roomCode.toUpperCase())?.room || null;
}

export async function castVote(roomId: string, movieId: number, userId: string, decision: "like" | "pass") {
  if (db) {
    const voteRef = doc(db, "rooms", roomId, "votes", String(movieId));
    await setDoc(voteRef, { movieId, voters: {} }, { merge: true });
    await updateDoc(voteRef, { [`voters.${userId}`]: decision });
  } else {
    const rooms = localRooms();
    const item = rooms[roomId];
    if (!item) return;
    const vote = item.votes.find((entry) => entry.movieId === movieId);
    if (vote) vote.voters[userId] = decision;
    else item.votes.push({ movieId, voters: { [userId]: decision } });
    saveLocalRooms(rooms);
  }
}

export async function markMatch(roomId: string, movieId: number) {
  if (db) await updateDoc(doc(db, "rooms", roomId), { status: "matched", matchedMovieId: movieId });
  else {
    const rooms = localRooms();
    if (!rooms[roomId]) return;
    rooms[roomId].room.status = "matched";
    rooms[roomId].room.matchedMovieId = movieId;
    saveLocalRooms(rooms);
  }
}

export async function heartbeat(roomId: string, userId: string) {
  if (db) await setDoc(doc(db, "rooms", roomId, "participants", userId), { active: true, lastSeen: serverTimestamp() }, { merge: true });
  else {
    const rooms = localRooms();
    const participant = rooms[roomId]?.participants.find((p) => p.id === userId);
    if (participant) { participant.active = true; participant.lastSeen = Date.now(); saveLocalRooms(rooms); }
  }
}

export function subscribeToRoom(
  roomId: string,
  onRoom: (room: Room) => void,
  onParticipants: (participants: Participant[]) => void,
  onVotes: (votes: Vote[]) => void,
): Unsubscribe {
  if (db) {
    const unsubs = [
      onSnapshot(doc(db, "rooms", roomId), (snap) => snap.exists() && onRoom({ id: snap.id, ...snap.data() } as Room)),
      onSnapshot(collection(db, "rooms", roomId, "participants"), (snap) => onParticipants(snap.docs.map((item) => ({ id: item.id, ...item.data() } as Participant)))),
      onSnapshot(collection(db, "rooms", roomId, "votes"), (snap) => onVotes(snap.docs.map((item) => item.data() as Vote))),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }
  const emit = () => {
    const item = localRooms()[roomId];
    if (item) { onRoom(item.room); onParticipants(item.participants); onVotes(item.votes); }
  };
  const channel = new BroadcastChannel("flickpick-rooms");
  channel.onmessage = emit;
  window.addEventListener("flickpick-sync", emit);
  window.addEventListener("storage", emit);
  emit();
  return () => { channel.close(); window.removeEventListener("flickpick-sync", emit); window.removeEventListener("storage", emit); };
}

export async function getRoom(roomId: string) {
  if (db) {
    const snap = await getDoc(doc(db, "rooms", roomId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Room) : null;
  }
  return localRooms()[roomId]?.room || null;
}
