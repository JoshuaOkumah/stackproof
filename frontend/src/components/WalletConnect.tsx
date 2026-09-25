"use client";
import { useState, useEffect, type ReactNode } from 'react';
import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';
import { addressAtom, isMountedAtom } from '../store/wallet';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

function getStoredStxAddress() {
  const stored = getLocalStorage();
  if (!stored) return null;

  return (
    stored.addresses?.stx?.find(entry => entry.address.startsWith('S'))?.address ??
    stored.addresses?.stx?.[0]?.address ??
    null
  );
}

function getResponseStxAddress(addresses: Array<{ address: string; symbol?: string }>) {
  return (
    addresses.find(entry => entry.symbol === 'STX')?.address ??
    addresses.find(entry => entry.address.startsWith('S'))?.address ??
    addresses[0]?.address ??
    null
  );
}

/** Syncs Leather/Xverse connection state into Jotai atoms for the app. */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [, setAddress] = useAtom(addressAtom);
  const [, setMounted] = useAtom(isMountedAtom);

  useEffect(() => {
    const syncWalletState = () => {
      if (!isConnected()) {
        setAddress(null);
        return;
      }

      setAddress(getStoredStxAddress());
    };

    setMounted(true);
    syncWalletState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWalletState();
      }
    };

    window.addEventListener('focus', syncWalletState);
    window.addEventListener('storage', syncWalletState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', syncWalletState);
      window.removeEventListener('storage', syncWalletState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setAddress, setMounted]);

  return <>{children}</>;
}

export function WalletConnect() {
  const address = useAtomValue(addressAtom);
  const isMounted = useAtomValue(isMountedAtom);
  const setAddress = useSetAtom(addressAtom);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await connect();
      const addr = getResponseStxAddress(response.addresses);
      setAddress(addr);
    } catch (e) {
      console.error('[scaffold-stacks] connection failed:', e);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    disconnect();
    setAddress(null);
  };

  // 1. Prevents SSR Flash: Render nothing or a skeleton until client-side mount
  if (!isMounted) return <div style={{ width: '140px', height: '40px' }} />;

  // 2. Disconnected UI
  if (!address) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="inline-flex h-10 min-w-[135px] items-center justify-center rounded-xl bg-[#c2410c] px-4 text-sm font-medium text-white transition-colors hover:bg-[#9a3412] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] disabled:opacity-70"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  // 3. Connected UI
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div className="inline-flex h-10 items-center rounded-xl border border-[#e7e5e4] bg-[#fafaf9] px-2.5 font-mono text-[13px] text-[#1c1917]">
        {short}
      </div>
      <button
        onClick={handleDisconnect}
        className="inline-flex h-10 items-center rounded-lg px-2 text-[13px] text-[#57534e] transition-colors hover:text-[#1c1917] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c]"
      >
        Disconnect
      </button>
    </div>
  );
}
