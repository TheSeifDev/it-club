"use client";

import SiteBoundaryError from "@/src/components/site/SiteBoundaryError";

export default function TracksError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SiteBoundaryError resetAction={reset} />;
}
