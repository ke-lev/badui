import Link from "next/link";
import Image from "next/image";
import { SidekickControl } from "@/components/sidekick/sidekick-control";
import { ThemeControl } from "@/components/theme/theme";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="badui — back to home" data-sidekick="home">
        <Image className="wordmark-logo" src="/pointer.png" alt="" width={280} height={400} />
        <span className="wordmark-text">bad<span>ui</span><i aria-hidden="true">.</i></span>
      </Link>
      <nav aria-label="Main navigation">
        <a className="github-link" href="https://ke1ev.dev" data-sidekick="dev">
          ke1ev.dev
        </a>
        <a className="github-link" href="https://lilbuddy.ke1ev.dev/" data-sidekick="lilbuddy">
          <span><span className="nav-pitch">check out my mac app: </span>lilbuddy</span>
        </a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <ThemeControl />
      <a href="#top" data-sidekick="back-to-top">Back to top <span aria-hidden="true">↑</span></a>
      <SidekickControl />
    </footer>
  );
}
