"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/lib/api";
import gsap from "gsap";
import { Eye, EyeOff } from "lucide-react";

type Props = { mode: "login" | "signup" };

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".auth-card", { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" });
      gsap.from(".bg-bubble", {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: 0.9,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch(`${API_BASE}/signup/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) throw new Error(await res.text());
    
      }

   
      const loginRes = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!loginRes.ok) {
        let msg = "Invalid username or password";
        try {
          const err = await loginRes.json();
          if (err.detail && typeof err.detail === "string" && err.detail.trim()) {
            msg = err.detail;
          }
        } catch {
          // fallback to default
        }
        throw new Error(msg);
      }
      const data = await loginRes.json();
      const access = data.access || data.token || data.access_token;
      const refresh = data.refresh || data.refresh_token || null;
      if (!access) throw new Error("No access token returned");

      localStorage.setItem("token", access);
      if (refresh) localStorage.setItem("refresh", refresh);
     
      gsap.to(".auth-card", { scale: 1.02, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.inOut" });
      setTimeout(() => router.push("/sites"), 350);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      gsap.fromTo(
        ".auth-card",
        { x: -6 },
        { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)", clearProps: "x" }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      {/* animated background bubbles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bg-bubble pointer-events-none absolute -z-10 rounded-full blur-2xl opacity-30"
          style={{
            width: 120 + (i % 3) * 40,
            height: 120 + (i % 3) * 40,
            left: `${(i * 12) % 100}%`,
            top: `${(i * 17) % 100}%`,
            background:
              i % 2 === 0
                ? "linear-gradient(135deg, rgba(79,70,229,0.5), rgba(16,185,129,0.4))"
                : "linear-gradient(135deg, rgba(236,72,153,0.5), rgba(99,102,241,0.4))",
          }}
        />
      ))}

      <div className="auth-card w-full max-w-md rounded-2xl border bg-white/70 p-8 shadow-xl backdrop-blur dark:bg-black/40 dark:border-white/10">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === "login" ? "Sign in to continue" : "It only takes a minute"}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="group">
            <label className="mb-1 block text-sm font-medium text-gray-800 dark:text-gray-200">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                onFocus={() => gsap.to(".focus-glow-pass", { opacity: 1, duration: 0.2 })}
                onBlur={() => gsap.to(".focus-glow-pass", { opacity: 0, duration: 0.2 })}
                className="rounded-xl border-white/30 bg-white/90 shadow-sm backdrop-blur placeholder:text-gray-400 dark:border-white/15 dark:bg-white/10 dark:shadow-none"
              />
              <div className="focus-glow-pass pointer-events-none absolute inset-0 -z-10 rounded-xl opacity-0 ring-2 ring-emerald-400/40 blur-sm" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 dark:text-gray-300 dark:hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          )}

          <Button disabled={loading} className="w-full" type="submit">
            {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : mode === "login" ? "Sign In" : "Sign Up"}
          </Button>

          <div className="pt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            {mode === "login" ? (
              <span>
                Don&apos;t have an account? <a href="/signup" className="text-primary underline-offset-4 hover:underline">Sign up</a>
              </span>
            ) : (
              <span>
                Already have an account? <a href="/login" className="text-primary underline-offset-4 hover:underline">Log in</a>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
