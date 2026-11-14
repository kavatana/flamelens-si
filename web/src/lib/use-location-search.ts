"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

/**
 * The query string of the current URL, read safely across server rendering and hydration.
 * The server renders with an empty query, and the browser re-renders with the real one.
 */
export function useLocationSearch(): string {
  return useSyncExternalStore(subscribe, () => window.location.search, () => "");
}

let arrival: string | null = null;
const never = () => () => {
  // Forget it when the page that asked is left, so the next visit reads its own address.
  arrival = null;
};

/**
 * The query string the page was opened with. Unlike `useLocationSearch` it does not follow
 * later changes to the address, so a page that writes its own state into the address can
 * still tell how the visitor arrived.
 */
export function useArrivalSearch(): string {
  return useSyncExternalStore(never, () => (arrival ??= window.location.search), () => "");
}
