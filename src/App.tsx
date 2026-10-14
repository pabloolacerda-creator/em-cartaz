import { useEffect, useMemo, useRef, useState } from "react";
import {
  PROVIDERS,
  discover,
  fetchGenres,
  fetchTitleLogo,
  type Movie,
  type ProviderId,
} from "./tmdb";
import { TopBar } from "./components/TopBar";
import { Hero } from "./components/Hero";
import { Row } from "./components/Row";
import { DetailSheet } from "./components/DetailSheet";

const GENRE_ROWS = [
  { id: 18, label: "Dramas" },
  { id: 35, label: "Comédias" },
  { id: 28, label: "Ação e aventura" },
  { id: 53, label: "Suspense" },
  { id: 27, label: "Terror" },
  { id: 878, label: "Ficção científica" },
  { id: 10749, label: "Romance" },
  { id: 16, label: "Animação" },
];

export default function App() {
  const [active, setActive] = useState<Set<ProviderId>>(new Set());
  const [genres, setGenres] = useState<Record<number, string>>({});

  const [hero, setHero] = useState<Movie | null>(null);
  const [heroLogo, setHeroLogo] = useState<string | null>(null);
  const [heroLoading, setHeroLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selected, setSelected] = useState<Movie | null>(null);
  const [tick, setTick] = useState(0);
  const reqId = useRef(0);

  useEffect(() => {
    fetchGenres().then(setGenres).catch(() => {});
  }, []);

  const providerList = useMemo(() => [...active] as ProviderId[], [active]);
  const key = providerList.join(",");

  useEffect(() => {
    const id = ++reqId.current;
    setHeroLoading(true);
    setError(false);
    setHero(null);
    setHeroLogo(null);
    window.scrollTo({ top: 0 });

    discover({ providers: providerList, page: 1, minVotes: 300 })
      .then(async (r) => {
        if (id !== reqId.current) return;
        const top = r.movies.find((m) => m.backdrop) ?? r.movies[0] ?? null;
        setHero(top);
        setHeroLoading(false);
        if (top) {
          const logo = await fetchTitleLogo(top.id);
          if (id === reqId.current) setHeroLogo(logo);
        }
      })
      .catch(() => {
        if (id === reqId.current) {
          setError(true);
          setHeroLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const toggle = (id: ProviderId) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const showProviderRows = active.size === 0;

  return (
    <div className="min-h-full pb-16">
      <TopBar active={active} onTodos={() => setActive(new Set())} onToggle={toggle} />

      {error ? (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-muted">Não consegui carregar os filmes agora.</p>
          <button
            onClick={() => setTick((t) => t + 1)}
            className="rounded bg-surface2 px-4 py-2 text-sm font-semibold text-text"
          >
            Tentar de novo
          </button>
        </div>
      ) : heroLoading || !hero ? (
        <div className="h-[72vh] min-h-[460px] w-full animate-pulse bg-gradient-to-t from-base to-surface" />
      ) : (
        <Hero movie={hero} logo={heroLogo} genres={genres} onOpen={() => setSelected(hero)} />
      )}

      {/* Rows pulled up to overlap the hero fade, like Netflix */}
      <div className="relative z-10 -mt-10 sm:-mt-16">
        <Row
          title="Em alta — mais bem avaliados"
          providers={providerList}
          showRank
          excludeId={hero?.id}
          onSelect={setSelected}
        />

        {showProviderRows &&
          PROVIDERS.map((p) => (
            <Row
              key={p.id}
              title={`Destaques na ${p.name}`}
              providers={[p.id]}
              onSelect={setSelected}
            />
          ))}

        {GENRE_ROWS.map((g) => (
          <Row
            key={g.id}
            title={g.label}
            providers={providerList}
            genre={g.id}
            onSelect={setSelected}
          />
        ))}
      </div>

      {selected && (
        <DetailSheet movie={selected} genres={genres} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
