import { IMG, type Movie } from "../tmdb";

export function Hero({
  movie,
  logo,
  genres,
  onOpen,
}: {
  movie: Movie;
  logo: string | null;
  genres: Record<number, string>;
  onOpen: () => void;
}) {
  const backdrop = IMG.backdrop(movie.backdrop, "w1280") ?? IMG.poster(movie.poster, "w500");
  const genreNames = movie.genreIds.map((id) => genres[id]).filter(Boolean).slice(0, 3);

  return (
    <section className="relative h-[72vh] min-h-[460px] w-full">
      {backdrop && (
        <img src={backdrop} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {/* darken bottom and left so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-base via-base/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-base/90 via-base/40 to-transparent" />

      <div className="absolute bottom-[10%] left-0 w-full px-4 sm:px-12">
        <div className="max-w-xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-netflix">
            Nº 1 em nota agora
          </p>

          {logo ? (
            <img
              src={logo}
              alt={movie.title}
              className="mb-4 max-h-28 w-auto max-w-[80%] object-contain drop-shadow-xl sm:max-h-36"
            />
          ) : (
            <h1 className="mb-4 font-display text-5xl leading-none tracking-wide text-white drop-shadow-xl sm:text-7xl">
              {movie.title}
            </h1>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
            <span className="tnum text-match">{movie.rating.toFixed(1)} nota</span>
            {movie.year && <span className="tnum text-white/90">{movie.year}</span>}
            {genreNames.length > 0 && (
              <span className="text-white/70">{genreNames.join(" · ")}</span>
            )}
          </div>

          <p className="mb-5 line-clamp-3 text-sm text-white/85 sm:text-base">{movie.overview}</p>

          <button
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden>ⓘ</span> Mais informações
          </button>
        </div>
      </div>
    </section>
  );
}
