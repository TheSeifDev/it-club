"use client";

import Link from "next/link";
import { siteUi } from "./public-ui";

export default function SiteBoundaryError({ resetAction }: { resetAction: () => void }) {
  return (
    <main className={siteUi("site-root site-error-page")} id="main-content">
      <section className={siteUi("site-error-panel")} aria-labelledby="site-error-title">
        <p className={siteUi("site-eyebrow")}>IT CLUB / PUBLIC SITE</p>
        <h1 className={siteUi("site-display")} id="site-error-title">We couldn’t load this page.</h1>
        <p>The published information is temporarily unavailable. Please try again shortly. No draft or archived content has been substituted.</p>
        <div><button className={siteUi("site-button site-button--emerald")} type="button" onClick={resetAction}>TRY AGAIN <span aria-hidden="true">↻</span></button><Link className={siteUi("site-button site-button--quiet")} href="/contact">CONTACT THE TEAM <span aria-hidden="true">↗</span></Link></div>
      </section>
    </main>
  );
}
