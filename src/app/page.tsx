import Link from "next/link";
import { SidekickDock } from "@/components/sidekick/sidekick-control";

export default function Home() {
  return (
    <div className="site-shell splash-shell" id="top">
      <a className="skip-link" href="#main-content" data-sidekick="skip-link">Skip to main content</a>
      <main id="main-content">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-title-block">
            <h1 id="page-title">bad<span>ui</span><i aria-hidden="true">.</i></h1>
            <p className="hero-subheader">a collection of intentionally bad ui experiments</p>
          </div>
          <Link className="hero-enter" href="/collection" data-sidekick="enter">
            Enter
          </Link>
        </section>
      </main>
      <SidekickDock />
    </div>
  );
}
