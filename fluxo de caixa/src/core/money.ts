/** Format integer cents as BRL, e.g. 324000 -> "R$ 3.240,00". */
export function formatBRL(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const reais = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const rest = (abs % 100).toString().padStart(2, '0');
  return `${negative ? '-' : ''}R$ ${reais},${rest}`;
}

/** Parse a BRL string into integer cents; null if empty or invalid. */
export function parseBRL(input: string): number | null {
  const s = input.replace(/^\s*R\$/i, '').replace(/\s+/g, '');
  const m = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const reais = parseInt(m[1].replace(/\./g, ''), 10);
  const cents = m[2] ? parseInt(m[2].padEnd(2, '0'), 10) : 0;
  return reais * 100 + cents;
}
