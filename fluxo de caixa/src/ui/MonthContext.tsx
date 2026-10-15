import { createContext, useContext, useState, type ReactNode } from 'react';

interface MonthCtx {
  month: string;
  setMonth: (m: string) => void;
}

const Ctx = createContext<MonthCtx | null>(null);

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState<string>(currentMonth);
  return <Ctx.Provider value={{ month, setMonth }}>{children}</Ctx.Provider>;
}

export function useMonth(): MonthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMonth must be used inside MonthProvider');
  return v;
}
