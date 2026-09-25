import { scaffoldConfig } from '../scaffold.config';

function NetworkBadge() {
  return (
    <span className="hidden items-center rounded-full border border-[#e7e5e4] bg-[#fafaf9] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#57534e] sm:inline-flex">
      {scaffoldConfig.network}
    </span>
  );
}

export default NetworkBadge;
