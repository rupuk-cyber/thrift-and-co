"use client";

import { useSyncExternalStore } from "react";
import type { Listing } from "@/src/lib/types";
import { Button } from "./Button";
import { useToast } from "./ToastProvider";

const subscribeNoop = () => () => {};
const getOrigin = () => window.location.origin;
const getOriginServer = () => "";

function buildMailto(listing: Listing, origin: string): string {
  const subject = `Thrift & Co.: ${listing.title}`;
  const url = `${origin}/listings/${listing.id}`;
  const body = [
    `Hi ${listing.sellerName || "there"},`,
    "",
    `I'm interested in "${listing.title}" listed at $${Number(listing.price).toFixed(2)} on Thrift & Co.`,
    "",
    `View listing: ${url}`,
    "",
    "Thanks!",
  ].join("\n");
  return `mailto:${listing.sellerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ContactSellerActions({ listing }: { listing: Listing }) {
  const { showToast } = useToast();
  const origin = useSyncExternalStore(subscribeNoop, getOrigin, getOriginServer);

  if (!listing.sellerEmail) {
    return (
      <div className="detail-actions">
        <p className="contact-note" role="status">
          The seller&apos;s contact information is no longer available for this listing.
        </p>
      </div>
    );
  }

  const trackContactClick = () => {
    const win = window as Window & { dataLayer?: object[] };
    win.dataLayer = win.dataLayer ?? [];
    win.dataLayer.push({
      event: "contact_seller",
      listingId: listing.id,
      timestamp: Date.now(),
    });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(listing.sellerEmail);
      showToast("📧 Seller email copied to clipboard", "success");
    } catch {
      showToast("Could not copy the email address", "error");
    }
  };

  return (
    <div className="detail-actions">
      <a
        className="btn btn-primary btn-block"
        href={buildMailto(listing, origin)}
        onClick={trackContactClick}
      >
        <span aria-hidden="true">✉️</span> Contact Seller
      </a>
      <Button variant="outline" onClick={copyEmail}>
        <span aria-hidden="true">📋</span> Copy email
      </Button>
      <p className="contact-note">
        Email is used only to connect you with this seller — no account messaging.
      </p>
    </div>
  );
}
