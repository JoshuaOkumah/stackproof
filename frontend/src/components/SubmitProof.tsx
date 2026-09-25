"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { Cl } from '@stacks/transactions';
import { useAtomValue } from 'jotai';
import { addressAtom } from '@/store/wallet';
import { useStackproof_SubmitProof } from '@/generated/hooks';

const MAX_LENGTH = 280;

type Props = {
  onPublished: () => void;
};

function humanizeRejection(repr: string | null): string {
  if (!repr) return 'The transaction was rejected on-chain.';
  if (repr.includes('u100')) return 'The proof was empty. Write something first.';
  if (repr.includes('u101')) return 'The proof is too long. Keep it under 280 characters.';
  return 'The transaction was rejected on-chain.';
}

function humanizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = message.toLowerCase();
  if (
    lower.includes('reject') ||
    lower.includes('declin') ||
    lower.includes('cancel') ||
    lower.includes('denied')
  ) {
    return 'You rejected the request in your wallet.';
  }
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Could not reach the Stacks network. Check your connection and try again.';
  }
  return 'Could not publish the proof. Please try again.';
}

export function SubmitProof({ onPublished }: Props) {
  const address = useAtomValue(addressAtom);
  const submit = useStackproof_SubmitProof();
  const [content, setContent] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishedTxid, setPublishedTxid] = useState<string | null>(null);

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0;
  const pending = submit.loading || submit.txStatus === 'pending';

  useEffect(() => {
    if (submit.txStatus === 'success') {
      setPublishedTxid(submit.txid);
      setErrorMessage(null);
      setContent('');
      onPublished();
    } else if (submit.txStatus === 'abort_by_response') {
      setPublishedTxid(null);
      setErrorMessage(humanizeRejection(submit.txStatusError));
    } else if (submit.txStatus === 'error') {
      setPublishedTxid(null);
      setErrorMessage(submit.txStatusError ?? 'The transaction failed. Please try again.');
    }
  }, [submit.txStatus, submit.txid, submit.txStatusError, onPublished]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || pending) return;
    setNotice(null);
    setErrorMessage(null);
    setPublishedTxid(null);
    if (!address) {
      setNotice('Connect your Stacks wallet first to publish a proof.');
      return;
    }
    try {
      const result = await submit.call([Cl.stringUtf8(trimmed)]);
      if (!result) {
        setErrorMessage('The StackProof contract is not deployed yet.');
      } else if (!result.txid) {
        setErrorMessage('The wallet did not return a transaction id. Please try again.');
      }
    } catch (error) {
      setErrorMessage(humanizeError(error));
    }
  };

  return (
    <section aria-labelledby="compose-heading" className="sp-card p-5 sm:p-6">
      <h2 id="compose-heading" className="text-base font-semibold tracking-tight text-[#1c1917]">
        What have you built?
      </h2>
      <p className="mt-1 text-sm text-[#57534e]">
        Put your accomplishments on-chain. Short, verifiable, yours.
      </p>

      <form onSubmit={handleSubmit} className="mt-4">
        <label htmlFor="proof-content" className="sr-only">
          Your proof
        </label>
        <textarea
          id="proof-content"
          className="sp-input min-h-[120px] resize-y"
          placeholder="Tell the world what you accomplished..."
          value={content}
          maxLength={MAX_LENGTH}
          onChange={event => setContent(event.target.value)}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span
            className="font-mono text-xs tabular-nums text-[#78716c]"
            aria-live="polite"
            title={`${content.length} of ${MAX_LENGTH} characters`}
          >
            {content.length} / {MAX_LENGTH}
          </span>
          <button type="submit" className="sp-btn-primary" disabled={!canSubmit || pending}>
            {pending ? 'Publishing proof...' : 'Publish Proof'}
          </button>
        </div>
      </form>

      {pending && (
        <p role="status" className="mt-4 rounded-xl border border-[#e7e5e4] bg-[#fafaf9] px-4 py-3 text-sm text-[#57534e]">
          Publishing proof... Check your wallet to confirm the transaction.
        </p>
      )}

      {!pending && publishedTxid && submit.explorerUrl && (
        <p role="status" className="mt-4 rounded-xl border border-[#c2410c]/30 bg-[#c2410c]/5 px-4 py-3 text-sm text-[#9a3412]">
          Proof published.{' '}
          <a
            href={submit.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline"
          >
            View transaction
          </a>
        </p>
      )}

      {!pending && notice && (
        <p role="status" className="mt-4 rounded-xl border border-[#e7e5e4] bg-[#fafaf9] px-4 py-3 text-sm text-[#57534e]">
          {notice}
        </p>
      )}

      {!pending && errorMessage && (
        <p role="alert" className="mt-4 rounded-xl border border-[#b42318]/30 bg-[#b42318]/5 px-4 py-3 text-sm text-[#b42318]">
          {errorMessage}
        </p>
      )}
    </section>
  );
}
