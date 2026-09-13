import { LoginForm } from "@/components/login-form";
import { SidekickDock } from "@/components/sidekick/sidekick-control";

export default function Home() {
  return (
    <div className="site-shell splash-shell" id="top">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <main id="main-content">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-title-block">
            <h1 id="page-title">bad<span>ui</span><i aria-hidden="true">.</i></h1>
          </div>
          <LoginForm />
        </section>
      </main>
      <SidekickDock />
    </div>
  );
}
