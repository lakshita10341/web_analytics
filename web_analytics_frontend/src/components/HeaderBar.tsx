"use client";

import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

export default function HeaderBar() {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUsername(localStorage.getItem("username"));
    }
  }, []);

  // Hide the header on auth pages
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
    }
    router.push("/login");
  }

  function gotoProfile() {
    // Redirect to sites page (user can choose a site/dashboard there)
    router.push("/sites");
  }

  const isSitesPage = pathname.startsWith("/sites");

  return (
    <header className="sticky top-0 z-20 border-b bg-white/70 backdrop-blur dark:bg-black/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">Web Analytics</Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Profile icon hidden on /sites page as requested */}
          {!isSitesPage && (
            <Button
              variant="outline"
              size="icon"
              className="hover:scale-[1.03] transition-transform"
              onClick={gotoProfile}
              aria-label={username ? `Profile (${username})` : "Profile"}
              title={username || "Profile"}
            >
              <User className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hover:scale-[1.03] transition-transform"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
