"use client";

import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { motion } from "framer-motion";

export default function HeaderBar() {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUsername(localStorage.getItem("username"));
    }
  }, []);

  const isAuth = pathname === "/login" || pathname === "/signup";
  const isSitesPage = pathname.startsWith("/sites");

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
    }
    router.push("/login");
  }

  function gotoProfile() {
    router.push("/sites");
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-white/60 backdrop-blur dark:bg-black/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold select-none">
          <motion.span
            className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent"
            style={{ backgroundSize: "200% 200%" }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          >
            Web Analytics
          </motion.span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!isAuth && !isSitesPage && (
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
          {!isAuth && (
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
          )}
        </div>
      </div>
    </header>
  );
}
