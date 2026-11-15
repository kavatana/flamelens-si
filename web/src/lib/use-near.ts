"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True once the element has come close to the screen, and from then on. A clip far down a
 * page waits for this before it is fetched, so it does not compete with what the visitor
 * sees first on a slow connection.
 */
export function useNear(ref: RefObject<Element | null>, margin = 400): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const watch = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: `${margin}px` });
    watch.observe(el);
    return () => watch.disconnect();
  }, [ref, near, margin]);
  return near;
}
