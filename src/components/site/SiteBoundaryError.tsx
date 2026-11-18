"use client";

import Link from "next/link";

export default function SiteBoundaryError({ resetAction }: { resetAction: () => void }) {
  return (
    <main className="site-root site-error-page" id="main-content">
      <section className="site-error-panel" aria-labelledby="site-error-title">
        <p className="site-eyebrow">IT CLUB / PUBLIC SITE</p>
        <h1 className="site-display" id="site-error-title">We couldn’t load this page.</h1>
        <p>The published information is temporarily unavailable. Please try again shortly. No draft or archived content has been substituted.</p>
        <div><button className="site-button site-button--emerald" type="button" onClick={resetAction}>TRY AGAIN <span aria-hidden="true">↻</span></button><Link className="site-button site-button--quiet" href="/contact">CONTACT THE TEAM <span aria-hidden="true">↗</span></Link></div>
      </section>
    </main>
  );
}
