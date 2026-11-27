import type { Metadata } from "next";
import { SiteFrame } from "@/src/components/site/SiteUI";
import Storefront from "@/src/components/store/Storefront";

export const metadata: Metadata = {
  title: "IT Club Store",
  description:
    "Explore the IT Club field kit: the club vest, ID card, and lanyard. Request an order from the team.",
};

export default function StorePage() {
  return (
    <SiteFrame>
      <Storefront />
    </SiteFrame>
  );
}
