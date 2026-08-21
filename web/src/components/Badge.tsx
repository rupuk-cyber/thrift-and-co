export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: "neutral" | "accent";
  children: React.ReactNode;
}) {
  return (
    <span className={variant === "accent" ? "chip chip-accent" : "chip"}>{children}</span>
  );
}
