import { IMG, type Movie } from "../tmdb";
import { RatingBadge } from "./RatingBadge";

export function Hero({ movie, onOpen }: { movie: Movie; onOpen: () => void }) {
  const backdrop = IMG.backdrop(movie.backdrop) ?? IMG.poster(movie.poster, "w500");
  return (
    <section className="rise relative overflow-hidden rounded-2xl ring-1 ring-line/60">
      {backdrop && (
        <img
          src={backdrop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 to-transparent" />

      <div className="relative flex min-h-[15rem] flex-col justify-end gap-3 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold/90">
          Melhor nota agora
        </p>
        <div className="flex items-end gap-4">
          <RatingBadge value={movie.rating} size="lg" />
          <div className="pb-1">
            <h2 className="text-2xl font-extrabold leading-tight text-text">{movie.title}</h2>
            {movie.year && <p className="tnum text-sm text-muted">{movie.year}</p>}
          </div>
        </div>
        <p className="line-clamp-2 max-w-prose text-sm text-text/80">{movie.overview}</p>
        <button
          onClick={onOpen}
          className="mt-1 w-fit rounded-full bg-gold px-5 py-2 text-sm font-bold text-ink transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Ver detalhes
        </button>
      </div>
    </section>
  );
}
