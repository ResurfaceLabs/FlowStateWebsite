import { Github } from 'lucide-react';
import { LOGO_PATH } from '../config';

const NAV_LINKS = ['Home', 'Features', 'Privacy'];

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 md:px-28">
      <div className="flex items-center gap-12 md:gap-20">
        <div className="flex items-center gap-2">
          <img src={LOGO_PATH} alt="" className="h-7 w-7" />
          <span className="text-xl font-bold tracking-tight">FlowState</span>
        </div>
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
      <a
        href="#"
        className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        <Github size={16} />
        GitHub
      </a>
    </nav>
  );
}
