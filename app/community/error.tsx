"use client";

import SiteBoundaryError from "@/src/components/site/SiteBoundaryError";

export default function CommunityError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SiteBoundaryError resetAction={reset} />;
}
