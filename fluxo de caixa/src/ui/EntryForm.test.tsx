// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntryForm from './EntryForm';

describe('EntryForm', () => {
  afterEach(cleanup);

  it('keeps submit disabled and shows message for invalid valor', async () => {
    const spy = vi.fn();
    render(<EntryForm kind="out" onSaved={() => {}} onSubmit={spy} />);
    await userEvent.type(screen.getByLabelText('Nome'), 'Aluguel');
    await userEvent.type(screen.getByLabelText('Valor'), 'abc');
    expect((screen.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/valor inválido/i)).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });

  it('keeps submit disabled when Vencimento is empty', async () => {
    const spy = vi.fn();
    render(<EntryForm kind="out" onSaved={() => {}} onSubmit={spy} />);
    await userEvent.type(screen.getByLabelText('Nome'), 'Aluguel');
    await userEvent.type(screen.getByLabelText('Valor'), '10,00');
    const btn = screen.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    await userEvent.click(btn);
    expect(spy).not.toHaveBeenCalled();
  });

  it('submits valid entry with cents and kind', async () => {
    const spy = vi.fn();
    const saved = vi.fn();
    render(<EntryForm kind="out" onSaved={saved} onSubmit={spy} />);
    await userEvent.type(screen.getByLabelText('Nome'), 'Aluguel');
    await userEvent.type(screen.getByLabelText('Valor'), '3.240,00');
    await userEvent.type(screen.getByLabelText('Data da compra'), '2026-10-01');
    await userEvent.type(screen.getByLabelText('Vencimento'), '2026-10-10');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({ amountCents: 324000, kind: 'out', paidCents: 0, paidDate: null, sourceFixedId: null, dueDate: '2026-10-10' });
    expect(saved).toHaveBeenCalled();
  });
});
