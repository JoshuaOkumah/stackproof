"use client";
import { useCallback, useEffect, useState } from 'react';
import { Cl } from '@stacks/transactions';
import { stackproof_getProof, stackproof_getTotalProofs } from '@/generated/contracts';
import deploymentsJson from '@/generated/deployments.json';
import { parseProof, parseTotal, shortAddress, type Proof } from '@/lib/proofs';

type Props = {
  refreshToken: number;
};

type Deployments = {
  contracts?: Record<string, { contract_id?: string } | undefined>;
};

const deployments = deploymentsJson as Deployments;
const isDeployed = Boolean(deployments.contracts?.stackproof?.contract_id);

function LoadingState() {
  return (
    <div className="sp-card space-y-4 p-5" role="status" aria-live="polite">
      <div className="h-4 w-1/3 animate-pulse rounded bg-[#e7e5e4]" />
      <div className="h-3 w-full animate-pulse rounded bg-[#f5f5f4]" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-[#f5f5f4]" />
      <span className="sr-only">Loading proofs…</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="sp-card px-6 py-10 text-center">
      <p className="text-base font-medium text-[#1c1917]">No proofs yet.</p>
      <p className="mt-1 text-sm text-[#57534e]">Be the first to put one on-chain.</p>
    </div>
  );
}

export function ProofBoard({ refreshToken }: Props) {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const total = parseTotal(await stackproof_getTotalProofs([]));
      if (total === null) {
        setProofs([]);
        setError('The StackProof contract is not available on this network yet.');
        return;
      }
      const next: Proof[] = [];
      for (let id = total; id >= 1; id--) {
        const raw = await stackproof_getProof([Cl.uint(id)]);
        const proof = parseProof(raw, id);
        if (proof) next.push(proof);
      }
      setProofs(next);
    } catch {
      setError('Could not load proofs from the Stacks network. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDeployed) {
      setLoading(false);
      setError('The StackProof contract has not been deployed to testnet yet.');
      return;
    }
    void load();
  }, [load, refreshToken]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="sp-card px-6 py-8 text-center">
        <p role="alert" className="text-sm text-[#b42318]">
          {error}
        </p>
        {isDeployed && (
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex h-9 items-center rounded-lg border border-[#e7e5e4] bg-white px-4 text-sm font-medium text-[#57534e] transition-colors hover:text-[#1c1917]"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (proofs.length === 0) return <EmptyState />;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {proofs.map(proof => (
        <article key={proof.id} className="sp-card flex flex-col gap-3 p-5">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[#1c1917]">
            {proof.content}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f5f5f4] pt-3 text-xs">
            <span className="font-mono text-[#57534e]" title={proof.author}>
              {shortAddress(proof.author)}
            </span>
            <span className="font-mono text-[#78716c]">
              Proof #{proof.id}
              {proof.block ? ` · Block ${proof.block}` : ''}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
