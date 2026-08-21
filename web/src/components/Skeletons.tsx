export function Spinner({ label }: { label?: string }) {
  return (
    <div className="spinner-center" role="status">
      <span className="spinner" aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card product-card--skeleton" aria-hidden="true">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line skeleton-line--w60" />
        <div className="skeleton skeleton-line skeleton-line--w40" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid" role="status" aria-label="Loading listings">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
