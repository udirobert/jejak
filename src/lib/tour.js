// Tiny tour store: { step: 0..3 } where 0 = off. Persisted in sessionStorage
// so a reload mid-tour resumes instead of restarting.
import { useSyncExternalStore } from "react";

const KEY = "jejak.tour.step";
const SEEN_KEY = "jejak.tour.seen";
let step = read();
const listeners = new Set();

function read() {
  try {
    const n = Number(sessionStorage.getItem(KEY));
    return n >= 1 && n <= 3 ? n : 0;
  } catch {
    return 0;
  }
}

function write(n) {
  step = n;
  try {
    if (n > 0) sessionStorage.setItem(KEY, String(n));
    else sessionStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}

export function startTour() {
  markSeen();
  write(1);
}

export function setTourStep(n) {
  write(n >= 1 && n <= 3 ? n : 0);
}

export function endTour() {
  write(0);
}

export function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {}
}

export function tourSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useTour() {
  return useSyncExternalStore(subscribe, () => step);
}
