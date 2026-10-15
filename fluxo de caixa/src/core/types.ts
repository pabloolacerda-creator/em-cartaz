export type Kind = 'in' | 'out';
export interface Entry {
  id: string; kind: Kind; name: string; description: string;
  amountCents: number; paidCents: number;        // paidCents: realized portion, 0..amountCents
  purchaseDate: string; dueDate: string;          // 'YYYY-MM-DD'
  paidDate: string | null;                        // set when paidCents > 0
  sourceFixedId: string | null;
}
export type NewEntry = Omit<Entry, 'id'>;
