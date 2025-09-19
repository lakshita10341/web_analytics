"use client";

import AuthGuard from "@/components/auth/AuthGuard";

export default function SitesLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
