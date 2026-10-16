// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PayModal from './PayModal';
import type { Entry } from '../core/types';

const mk = (over: Partial<Entry> = {}): Entry => ({
  id: 'e1',
  kind: 'out',
  name: 'Aluguel',
  description: '',
  category: '',
  amountCents: 89000,
  paidCents: 0,
  paidDate: null,
  dueDate: '2026-10-10',
  purchaseDate: '2026-10-01',
  sourceFixedId: null,
  ...over,
} as Entry);

describe('PayModal', () => {
  afterEach(cleanup);

  it('Pagar tudo pays the full amount with today as YYYY-MM-DD', async () => {
    const onPay = vi.fn();
    const onDone = vi.fn();
    render(<PayModal entry={mk()} onDone={onDone} onPay={onPay} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pagar tudo' }));
    expect(onPay).toHaveBeenCalledTimes(1);
    expect(onPay.mock.calls[0][0]).toBe(89000);
    expect(onPay.mock.calls[0][1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(onDone).toHaveBeenCalled();
  });

  it('partial R$ 50,00 pays 5000 cents', async () => {
    const onPay = vi.fn();
    render(<PayModal entry={mk()} onDone={() => {}} onPay={onPay} />);
    await userEvent.type(screen.getByLabelText('Valor parcial'), 'R$ 50,00');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar parcial' }));
    expect(onPay.mock.calls[0][0]).toBe(5000);
  });

  it('partial above remaining is clamped to amountCents', async () => {
    const onPay = vi.fn();
    render(<PayModal entry={mk({ amountCents: 50000 })} onDone={() => {}} onPay={onPay} />);
    await userEvent.type(screen.getByLabelText('Valor parcial'), 'R$ 700,00');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar parcial' }));
    expect(onPay.mock.calls[0][0]).toBe(50000);
  });

  it('adds to existing paidCents and clamps total', async () => {
    const onPay = vi.fn();
    render(<PayModal entry={mk({ amountCents: 50000, paidCents: 20000 })} onDone={() => {}} onPay={onPay} />);
    await userEvent.type(screen.getByLabelText('Valor parcial'), 'R$ 400,00');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar parcial' }));
    expect(onPay.mock.calls[0][0]).toBe(50000);
  });
});
