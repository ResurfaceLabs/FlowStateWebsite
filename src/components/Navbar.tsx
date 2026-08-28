import { LOGO_PATH } from '../config';

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Navbar() {
  return (
    <nav className="mx-auto flex max-w-4xl items-center justify-between px-8 py-4 md:px-12">
      <img src={LOGO_PATH} alt="FlowState" className="h-6 w-auto" />
      <a
        href="https://x.com/useflowstate"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X (Twitter)"
        className="flex items-center justify-center rounded-lg bg-foreground p-2.5 text-background transition-opacity hover:opacity-90"
      >
        <XLogo />
      </a>
    </nav>
  );
}
