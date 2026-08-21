const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  electronics: { emoji: "📱", label: "Electronics" },
  furniture: { emoji: "🪑", label: "Furniture" },
  books: { emoji: "📚", label: "Books" },
  clothing: { emoji: "👕", label: "Clothing" },
  home: { emoji: "🏠", label: "Home" },
  other: { emoji: "🔮", label: "Other" },
};

export function categoryMeta(value: string): { emoji: string; label: string } {
  return CATEGORY_META[value] ?? { emoji: "📦", label: value };
}
