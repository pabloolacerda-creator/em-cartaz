import { IMG, type Movie } from "../tmdb";

export function MovieCard({
  movie,
  rank,
  onClick,
}: {
  movie: Movie;
  rank: number;
  onClick: () => void;
}) {
  const poster = IMG.poster(movie.poster);
  return (
    <button
      onClick={onClick}
      className="group relative block w-full text-left focus:outline-none"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface shadow-poster ring-1 ring-line/60 transition group-focus-visible:ring-2 group-focus-visible:ring-gold">
        {poster ? (
          <img
            src={poster}
            alt={movie.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-3 text-center text-sm text-muted">
            {movie.title}
          </div>
        )}

        {/* rank chip */}
        <span className="tnum absolute left-0 top-0 rounded-br-xl bg-ink/85 px-2 py-1 text-xs font-bold text-muted backdrop-blur">
          {rank}
        </span>

        {/* rating, bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-end bg-gradient-to-t from-ink/90 via-ink/30 to-transparent p-2">
          <span className="tnum text-xl font-black text-gold drop-shadow">
            {movie.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-text">
          {movie.title}
        </h3>
        {movie.year && <p className="tnum mt-0.5 text-xs text-muted">{movie.year}</p>}
      </div>
    </button>
  );
}
