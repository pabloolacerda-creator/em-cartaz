import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PROVIDERS,
  discover,
  fetchGenres,
  type Movie,
  type ProviderId,
} from "./tmdb";
import { Hero } from "./components/Hero";
import { MovieCard } from "./components/MovieCard";
import { DetailSheet } from "./components/DetailSheet";

const MIN_VOTES = 200;
const GENRE_ORDER = [
  18, 35, 28, 53, 878, 27, 12, 10749, 16, 80, 9648, 14, 10751, 99, 36, 10752, 37, 10402,
];

export default function App() {
  const [active, setActive] = useState<Set<ProviderId>>(new Set());
  const [genre, setGenre] = useState<number | null>(null);
  const [genres, setGenres] = useState<Record<number, string>>({});

  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Movie | null>(null);

  const reqId = useRef(0);

  useEffect(() => {
    fetchGenres().then(setGenres).catch(() => {});
  }, []);

  const providerList = useMemo(() => [...active] as ProviderId[], [active]);

  const load = useCallback(
    async (nextPage: number, replace: boolean) => {
      const id = ++reqId.current;
      replace ? setLoading(true) : setLoadingMore(true);
      setError(null);
      try {
        const { movies: got, totalPages: tp } = await discover({
          providers: providerList,
          page: nextPage,
          minVotes: MIN_VOTES,
          genre,
        });
        if (id !== reqId.current) return; // a newer request superseded this one
        setTotalPages(tp);
        setPage(nextPage);
        setMovies((prev) => {
          const merged = replace ? got : [...prev, ...got];
          const seen = new Set<number>();
          return merged.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
        });
      } catch {
        if (id === reqId.current) setError("Não consegui carregar os filmes. Tenta de novo.");
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [providerList, genre]
  );

  // Reload whenever filters change
  useEffect(() => {
    window.scrollTo({ top: 0 });
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerList.join(","), genre]);

  const toggleProvider = (id: ProviderId) => {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const [hero, ...rest] = movies;
  const canMore = page < totalPages && page < 20; // TMDB hard-caps discover depth

  return (
    <div className="mx-auto min-h-full max-w-3xl px-4 pb-16">
      <header className="flex items-baseline justify-between gap-3 pt-6">
        <h1 className="text-xl font-black tracking-tight text-text">
          Em&nbsp;Cartaz
          <span className="ml-2 align-middle text-xs font-semibold text-muted">
            o ranking dos streamings
          </span>
        </h1>
      </header>

      {/* Provider rail */}
      <div className="sticky top-0 z-20 -mx-4 mt-4 bg-base/90 px-4 py-3 backdrop-blur">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Chip label="Todos" active={active.size === 0} onClick={() => setActive(new Set())} />
          {PROVIDERS.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              dot={p.color}
              active={active.has(p.id)}
              onClick={() => toggleProvider(p.id)}
            />
          ))}
        </div>

        {/* Genre rail */}
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          <Chip label="Todos os gêneros" small active={genre === null} onClick={() => setGenre(null)} />
          {GENRE_ORDER.filter((id) => genres[id]).map((id) => (
            <Chip
              key={id}
              label={genres[id]}
              small
              active={genre === id}
              onClick={() => setGenre((g) => (g === id ? null : id))}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="mt-10 text-center">
          <p className="text-muted">{error}</p>
          <button
            onClick={() => load(1, true)}
            className="mt-3 rounded-full bg-surface2 px-4 py-2 text-sm font-semibold text-text"
          >
            Tentar de novo
          </button>
        </div>
      ) : loading ? (
        <GridSkeleton />
      ) : movies.length === 0 ? (
        <div className="mt-16 text-center text-muted">
          <p className="text-lg font-semibold text-text">Nada por aqui com esse filtro.</p>
          <p className="mt-1 text-sm">Tenta soltar o gênero ou escolher outro streaming.</p>
        </div>
      ) : (
        <>
          <div className="mt-5">
            <Hero movie={hero} onOpen={() => setSelected(hero)} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3">
            {rest.map((m, i) => (
              <MovieCard key={m.id} movie={m} rank={i + 2} onClick={() => setSelected(m)} />
            ))}
          </div>

          {canMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => load(page + 1, false)}
                disabled={loadingMore}
                className="rounded-full border border-line px-6 py-2.5 text-sm font-bold text-text transition hover:border-gold hover:text-gold disabled:opacity-50"
              >
                {loadingMore ? "Carregando…" : "Carregar mais"}
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <DetailSheet movie={selected} genres={genres} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  dot,
  small,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dot?: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
        small ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
      } ${
        active
          ? "border-gold bg-gold text-ink font-bold"
          : "border-line bg-surface text-text/80 font-medium hover:border-muted"
      }`}
    >
      {dot && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: active ? "#0E0F15" : dot }}
        />
      )}
      {label}
    </button>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-5">
      <div className="h-60 w-full animate-pulse rounded-2xl bg-surface" />
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-surface" />
            <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
