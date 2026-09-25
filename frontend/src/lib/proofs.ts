export type Proof = {
  id: number;
  author: string;
  content: string;
  block: string | null;
};

export function shortAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function unwrap(value: unknown): unknown {
  if (value !== null && typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
    return (value as { value: unknown }).value;
  }
  return value;
}

/** Reads a total-proofs count from cvToValue output (bigint | number | string | { type, value }). */
export function parseTotal(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const value = unwrap(raw);
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

/** Reads one proof from get-proof output; returns null when the proof is absent. */
export function parseProof(raw: unknown, id: number): Proof | null {
  if (raw === null || raw === undefined || typeof raw !== 'object') return null;
  const outer = raw as { value?: unknown };
  const fields =
    outer.value !== null && typeof outer.value === 'object'
      ? (outer.value as Record<string, unknown>)
      : (raw as Record<string, unknown>);
  const author = unwrap(fields.author);
  const content = unwrap(fields.content);
  const block = unwrap(fields.timestamp);
  if (typeof author !== 'string' || typeof content !== 'string') return null;
  return {
    id,
    author,
    content,
    block: block === null || block === undefined ? null : String(block),
  };
}
