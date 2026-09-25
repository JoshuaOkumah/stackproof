import React from 'react';
import { WalletConnect } from './WalletConnect';
import NetworkBadge from './NetworkBadge';

function Header() {
  return (
    <header className="border-b border-[#e7e5e4] bg-white">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-base font-semibold tracking-tight text-[#1c1917] sm:text-lg">
            StackProof
          </span>
          <span className="truncate text-xs text-[#57534e]">Prove it. Put it on-chain.</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <NetworkBadge />
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}

export default Header;
