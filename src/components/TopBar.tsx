import { useEffect, useState } from "react";
import { PROVIDERS, type ProviderId } from "../tmdb";

export function TopBar({
  active,
  onTodos,
  onToggle,
}: {
  active: Set<ProviderId>;
  onTodos: () => void;
  onToggle: (id: ProviderId) => void;
}) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        solid ? "bg-base/95 backdrop-blur" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-12">
        <span className="font-display text-2xl leading-none tracking-wider text-netflix sm:text-3xl">
          EM CARTAZ
        </span>

        <nav className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <Pill label="Todos" active={active.size === 0} onClick={onTodos} />
          {PROVIDERS.map((p) => (
            <Pill
              key={p.id}
              label={p.name}
              dot={p.color}
              active={active.has(p.id)}
              onClick={() => onToggle(p.id)}
            />
          ))}
        </nav>
      </div>
    </header>
  );
}

function Pill({
  label,
  active,
  onClick,
  dot,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-sm ${
        active
          ? "border-white bg-white text-black"
          : "border-white/30 text-white/80 hover:border-white/70"
      }`}
    >
      {dot && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: active ? "#000" : dot }}
        />
      )}
      {label}
    </button>
  );
}
