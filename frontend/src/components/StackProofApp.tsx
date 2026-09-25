"use client";
import { useCallback, useState } from 'react';
import { SubmitProof } from './SubmitProof';
import { ProofBoard } from './ProofBoard';
import DebugContracts from '@/generated/DebugContracts';

export default function StackProofApp() {
  const [refreshToken, setRefreshToken] = useState(0);
  const handlePublished = useCallback(() => setRefreshToken(token => token + 1), []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6">
      <section className="py-10 text-center sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-[#1c1917] sm:text-4xl">
          What have you built?
        </h1>
        <p className="mt-3 text-base text-[#57534e] sm:text-lg">
          Put your accomplishments on-chain.
        </p>
      </section>

      <SubmitProof onPublished={handlePublished} />

      <section className="py-10 sm:py-14" aria-labelledby="proofs-heading">
        <div className="mb-5">
          <h2 id="proofs-heading" className="text-xl font-semibold tracking-tight text-[#1c1917]">
            Latest Proofs
          </h2>
        </div>
        <ProofBoard refreshToken={refreshToken} />
      </section>

      <details className="mb-10 rounded-xl border border-[#e7e5e4] bg-white p-4">
        <summary className="cursor-pointer text-sm text-[#57534e]">
          Contract debug console (Scaffold Stacks)
        </summary>
        <div className="mt-4">
          <DebugContracts />
        </div>
      </details>
    </main>
  );
}
