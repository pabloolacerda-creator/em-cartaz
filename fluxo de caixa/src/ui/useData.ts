import { useCallback, useEffect, useState } from 'react';
import type { Entry, FixedBill } from '../core/types';
import { listEntries } from '../data/entries';
import { listFixedBills } from '../data/fixedBills';

export function useData() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [e, f] = await Promise.all([listEntries(), listFixedBills()]);
      setEntries(e);
      setFixedBills(f);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { entries, fixedBills, reload, loading, error };
}
