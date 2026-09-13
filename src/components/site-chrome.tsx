import Link from "next/link";
import { SidekickControl } from "@/components/sidekick/sidekick-control";

function CollectionMark() {
  return (
    <span className="collection-mark" aria-hidden="true">
      <span /><span /><span /><span />
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="badui — back to home">
        <CollectionMark /><span>badui</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link className="collection-link" href="/collection">
          Collection <span className="nav-count">06</span>
          <span aria-hidden="true">↘</span>
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="footer-brand">badui</span>
      <span className="footer-note">End of collection</span>
      <SidekickControl />
      <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
    </footer>
  );
}
