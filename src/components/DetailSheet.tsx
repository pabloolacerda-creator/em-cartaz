import { useEffect, useState } from "react";
import { IMG, fetchProvidersFor, type Movie, type WhereToWatch } from "../tmdb";

export function DetailSheet({
  movie,
  genres,
  onClose,
}: {
  movie: Movie;
  genres: Record<number, string>;
  onClose: () => void;
}) {
  const [where, setWhere] = useState<WhereToWatch[] | null>(null);

  useEffect(() => {
    let alive = true;
    setWhere(null);
    fetchProvidersFor(movie.id)
      .then((w) => alive && setWhere(w))
      .catch(() => alive && setWhere([]));
    return () => {
      alive = false;
    };
  }, [movie.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const backdrop = IMG.backdrop(movie.backdrop);
  const names = movie.genreIds.map((id) => genres[id]).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fade-in absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={movie.title}
        className="sheet-in relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-surface ring-1 ring-line sm:max-w-lg sm:rounded-3xl"
      >
        <div className="relative h-44 w-full overflow-hidden sm:h-52">
          {backdrop && <img src={backdrop} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ink/70 text-text backdrop-blur transition hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-start gap-4">
            <span className="tnum text-4xl font-black leading-none text-gold">
              {movie.rating.toFixed(1)}
            </span>
            <div>
              <h2 className="text-xl font-extrabold leading-tight text-text">{movie.title}</h2>
              <p className="tnum mt-1 text-sm text-muted">
                {movie.year}
                {movie.votes ? ` · ${movie.votes.toLocaleString("pt-BR")} votos` : ""}
              </p>
            </div>
          </div>

          {names.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {names.map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-surface2 px-3 py-1 text-xs font-medium text-text/80"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {movie.overview ? (
            <p className="text-sm leading-relaxed text-text/85">{movie.overview}</p>
          ) : (
            <p className="text-sm text-muted">Sinopse ainda não disponível em português.</p>
          )}

          <div>
            <h3 className="mb-2 text-sm font-bold text-text">Onde assistir no Brasil</h3>
            {where === null ? (
              <p className="text-sm text-muted">Buscando…</p>
            ) : where.length === 0 ? (
              <p className="text-sm text-muted">
                Não encontramos este filme na assinatura dos streamings agora.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {where.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-2 rounded-xl bg-surface2 py-1.5 pl-1.5 pr-3"
                  >
                    {w.logo && (
                      <img src={w.logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    )}
                    <span className="text-sm font-medium text-text">{w.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <a
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-full border border-line py-2.5 text-center text-sm font-semibold text-text/80 transition hover:border-gold hover:text-gold"
          >
            Abrir no TMDB
          </a>
        </div>
      </div>
    </div>
  );
}
