"use client";

import { CATEGORIES } from "@/src/lib/types";
import { categoryMeta } from "./categoryMeta";

interface CategoryPillsProps {
  active: string;
  onSelect: (category: string) => void;
}

export function CategoryPills({ active, onSelect }: CategoryPillsProps) {
  return (
    <div className="category-bar" role="group" aria-label="Filter by category">
      <button
        type="button"
        className={`category-pill${active === "all" ? " active" : ""}`}
        aria-pressed={active === "all"}
        onClick={() => onSelect("all")}
      >
        All
      </button>
      {CATEGORIES.map((category) => {
        const meta = categoryMeta(category);
        const isActive = active === category;
        return (
          <button
            key={category}
            type="button"
            className={`category-pill${isActive ? " active" : ""}`}
            aria-pressed={isActive}
            onClick={() => onSelect(category)}
          >
            <span aria-hidden="true">{meta.emoji}</span> {meta.label}
          </button>
        );
      })}
    </div>
  );
}
