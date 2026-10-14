import { IMG, type Movie } from "../tmdb";

export function MovieCard({
  movie,
  rank,
  onClick,
}: {
  movie: Movie;
  rank?: number;
  onClick: () => void;
}) {
  const art = IMG.backdrop(movie.backdrop, "w780");

  return (
    <button
      onClick={onClick}
      className="group relative w-[44vw] max-w-[320px] shrink-0 snap-start text-left focus:outline-none sm:w-64"
    >
      <div className="relative aspect-video overflow-hidden rounded-md bg-surface shadow-card ring-1 ring-white/5 transition duration-200 group-hover:ring-white/30 group-focus-visible:ring-2 group-focus-visible:ring-white">
        {art ? (
          <img
            src={art}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-3 text-center text-sm font-semibold text-white/80">
            {movie.title}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        {typeof rank === "number" && (
          <span className="tnum absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-bold text-white/90 backdrop-blur">
            #{rank}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
          <span className="line-clamp-2 text-sm font-bold leading-tight text-white drop-shadow">
            {movie.title}
          </span>
          <span className="tnum shrink-0 rounded bg-black/60 px-1.5 py-0.5 text-sm font-extrabold text-match backdrop-blur">
            {movie.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </button>
  );
}
