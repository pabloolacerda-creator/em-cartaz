export function RatingBadge({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const n = value.toFixed(1);
  const cls =
    size === "lg"
      ? "text-5xl font-black leading-none"
      : size === "md"
        ? "text-base font-extrabold leading-none"
        : "text-sm font-bold leading-none";
  return (
    <span className={`tnum text-gold ${cls}`}>
      {n}
    </span>
  );
}
