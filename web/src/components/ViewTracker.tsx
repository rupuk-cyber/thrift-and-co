"use client";

import { useEffect, useRef } from "react";
import { incrementView } from "@/src/lib/engagement";

interface ViewTrackerProps {
  listingId: string;
}

export function ViewTracker({ listingId }: ViewTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;
    incrementView(listingId).catch(() => {
      // Silently fail - view tracking is best effort
    });
  }, [listingId]);

  return null;
}