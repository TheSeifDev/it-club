import { requireOwner } from "@/lib/auth/page-guard";

export default async function OwnerContentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireOwner({ loginPath: "/interview/login?mode=content", returnTo: "/admin" });
  return children;
}
