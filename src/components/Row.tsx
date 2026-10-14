import { useEffect, useRef, useState } from "react";
import { discover, type Movie, type ProviderId } from "../tmdb";
import { MovieCard } from "./MovieCard";

const MIN_VOTES = 200;

export function Row({
  title,
  providers,
  genre,
  showRank,
  onSelect,
  excludeId,
}: {
  title: string;
  providers: ProviderId[];
  genre?: number | null;
  showRank?: boolean;
  onSelect: (m: Movie) => void;
  excludeId?: number;
}) {
  const [movies, setMovies] = useState<Movie[] | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setMovies(null);
    discover({ providers, page: 1, minVotes: MIN_VOTES, genre })
      .then((r) => {
        if (!alive) return;
        const list = r.movies.filter((m) => m.id !== excludeId && m.backdrop);
        setMovies(list);
      })
      .catch(() => alive && setMovies([]));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers.join(","), genre, excludeId]);

  const nudge = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (movies !== null && movies.length === 0) return null;

  return (
    <section className="group/row mt-8 first:mt-6">
      <h2 className="mb-2 px-4 text-lg font-bold text-text sm:px-12">{title}</h2>

      <div className="relative">
        <button
          aria-label="Voltar"
          onClick={() => nudge(-1)}
          className="absolute left-0 top-0 z-10 hidden h-full w-12 items-center justify-center bg-gradient-to-r from-base/80 to-transparent text-2xl text-white opacity-0 transition group-hover/row:opacity-100 sm:flex"
        >
          ‹
        </button>

        <div
          ref={scroller}
          className="no-scrollbar flex snap-x gap-2.5 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-12"
        >
          {movies === null
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-video w-[44vw] max-w-[320px] shrink-0 animate-pulse rounded-md bg-surface sm:w-64"
                />
              ))
            : movies.map((m, i) => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  rank={showRank ? i + 1 : undefined}
                  onClick={() => onSelect(m)}
                />
              ))}
        </div>

        <button
          aria-label="Avançar"
          onClick={() => nudge(1)}
          className="absolute right-0 top-0 z-10 hidden h-full w-12 items-center justify-center bg-gradient-to-l from-base/80 to-transparent text-2xl text-white opacity-0 transition group-hover/row:opacity-100 sm:flex"
        >
          ›
        </button>
      </div>
    </section>
  );
}
