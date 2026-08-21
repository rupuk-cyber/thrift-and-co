"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "danger" | "success" | "outline";
type Size = "default" | "sm" | "block";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn-primary",
  danger: "btn-danger",
  success: "btn-success",
  outline: "btn-outline",
};

const SIZE_CLASS: Record<Size, string> = {
  default: "",
  sm: "btn-sm",
  block: "btn-block",
};

export function Button({
  variant = "primary",
  size = "default",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = ["btn", VARIANT_CLASS[variant], SIZE_CLASS[size], className]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
      {loading && <span className="sr-only">Loading…</span>}
    </button>
  );
}
