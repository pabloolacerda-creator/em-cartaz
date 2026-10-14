# Em Cartaz — o ranking dos streamings

App de celular (site que funciona como app) que mostra os filmes disponíveis
**agora** na Netflix, Prime Video e Max no Brasil, ordenados pela **nota** do TMDB.

## Como ligar

```bash
npm install      # só na primeira vez
npm run dev      # liga o servidor
```

Depois abra **http://localhost:5173** no navegador. No celular, na mesma rede,
use o endereço "Network" que aparece no terminal.

Para adicionar à tela inicial do celular: abra no navegador → menu → "Adicionar
à tela de início".

## A chave do TMDB

Fica no arquivo `.env` (`VITE_TMDB_KEY`). É a sua chave pessoal gratuita do
TMDB. Como é um app client-side, a chave vai junto no navegador — tudo bem para
uso pessoal.

## Como mexer

- `src/tmdb.ts` — tudo que fala com a API do TMDB (streamings, filtros, região).
- `src/App.tsx` — a tela principal, filtros e grade.
- `src/components/` — o destaque, os cartões de filme e a ficha de detalhes.
- `tailwind.config.js` — as cores (fundo escuro, dourado da nota).

### Mudar quais streamings aparecem
Edite a lista `PROVIDERS` em `src/tmdb.ts`.

### Quão exigente é o filtro de "não aparecer filme obscuro"
Constante `MIN_VOTES` em `src/App.tsx` (hoje 200 votos mínimos).
