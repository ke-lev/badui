import type { Metadata } from "next";
import { Collection } from "@/components/collection";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Collection — badui",
  description: "Six original, working interface specimens by badui.",
};

export default function CollectionPage() {
  return (
    <div className="site-shell collection-page" id="top">
      <a className="skip-link" href="#collection">Skip to collection</a>
      <SiteHeader />
      <main id="main-content">
        <Collection />
      </main>
      <SiteFooter />
    </div>
  );
}
