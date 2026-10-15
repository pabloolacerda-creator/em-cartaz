import { describe, it, expect } from 'vitest';
import { formatBRL, parseBRL } from './money';

describe('formatBRL', () => {
  it('formats cents as BRL', () => {
    expect(formatBRL(324000)).toBe('R$ 3.240,00');
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(5)).toBe('R$ 0,05');
  });
});

describe('parseBRL', () => {
  it('parses valid input to cents', () => {
    expect(parseBRL('1.234,56')).toBe(123456);
    expect(parseBRL('3240')).toBe(324000);
    expect(parseBRL('3240,5')).toBe(324050);
    expect(parseBRL('0')).toBe(0);
  });
  it('returns null for invalid or empty input', () => {
    expect(parseBRL('')).toBeNull();
    expect(parseBRL('abc')).toBeNull();
  });
});
