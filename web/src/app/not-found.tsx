import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container">
      <div className="no-products">
        <span className="empty-icon" aria-hidden="true">
          🧭
        </span>
        <p style={{ fontSize: "var(--text-lg)", fontWeight: 500 }}>Page not found</p>
        <p style={{ fontSize: "var(--text-sm)" }}>
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <p style={{ marginTop: "var(--space-4)" }}>
          <Link href="/" className="btn btn-outline">
            Back to listings
          </Link>
        </p>
      </div>
    </div>
  );
}
