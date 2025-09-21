"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // typing animation text
  const titleText = mode === "login" ? "Welcome back" : "Create your account";
  const taglineText = mode === "login" ? "Sign in to continue" : "It only takes a minute";
  const [typedTitle, setTypedTitle] = useState("");
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    // typing effect
    setTypedTitle("");
    setShowTagline(false);
    let i = 0;
    const speed = 40; // ms per char
    const timer = setInterval(() => {
      setTypedTitle((prev) => prev + titleText.charAt(i));
      i++;
      if (i >= titleText.length) {
        clearInterval(timer);
        setTimeout(() => setShowTagline(true), 150);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [titleText]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // entrance for card
      gsap.from(cardRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
      });

      // floating gradient blobs
      gsap.utils.toArray<HTMLElement>(".bg-blob").forEach((b, i) => {
        gsap.fromTo(
          b,
          { y: gsap.utils.random(-16, 16), x: gsap.utils.random(-16, 16), opacity: 0 },
          {
            opacity: 0.7,
            y: `+=${gsap.utils.random(-36, 36)}`,
            x: `+=${gsap.utils.random(-46, 46)}`,
            duration: gsap.utils.random(12, 18),
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.18,
          }
        );
      });

      // animate accent bar under title
      gsap.fromTo(
        ".accent-bar",
        { scaleX: 0, opacity: 0.6 },
        { scaleX: 1, opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.25, transformOrigin: "left" }
      );

      // soft glow around card border
      gsap.fromTo(
        ".card-glow",
        { opacity: 0.35 },
        { opacity: 0.7, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  async function handleSubmit() {
    try {
      setLoading(true);
      setError(null);
      if (mode === "signup") {
        await axios.post("http://localhost:8000/api/signup/", {
          username,
          password,
        });
      }

      const res = await axios.post("http://localhost:8000/api/login/", {
        username,
        password,
      });

      const data = res.data;
      localStorage.setItem("token", data.access);
      localStorage.setItem("username", username);

      // success pulse
      gsap.fromTo(
        cardRef.current,
        { scale: 1 },
        { scale: 1.02, duration: 0.18, ease: "power1.inOut", yoyo: true, repeat: 1 }
      );

      router.push("/sites");
    } catch (error: unknown) {
      let message = "Authentication failed";
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (data && typeof data === "object" && "error" in data) {
          // TypeScript now knows 'error' exists in data
          message = (data as { error?: string }).error ?? error.message ?? message;
        } else {
          message = error.message ?? message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      setError(message);
      // subtle shake on error
      gsap.fromTo(
        cardRef.current,
        { x: -8 },
        { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)", clearProps: "x" }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      {/* animated gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_20%,rgba(99,102,241,0.08),transparent_60%),radial-gradient(900px_500px_at_10%_90%,rgba(236,72,153,0.08),transparent_60%),radial-gradient(900px_500px_at_90%_80%,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="bg-blob absolute -left-24 -top-24 size-[26rem] rounded-full blur-3xl opacity-60"
             style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.85), rgba(99,102,241,0))" }} />
        <div className="bg-blob absolute right-[-120px] top-1/4 size-[28rem] rounded-full blur-3xl opacity-60"
             style={{ background: "radial-gradient(closest-side, rgba(16,185,129,0.85), rgba(16,185,129,0))" }} />
        <div className="bg-blob absolute left-1/3 bottom-[-120px] size-[30rem] rounded-full blur-3xl opacity-60"
             style={{ background: "radial-gradient(closest-side, rgba(236,72,153,0.8), rgba(236,72,153,0))" }} />
        {/* subtle grid + noise overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.05)_1px,_transparent_0)] bg-[size:22px_22px] opacity-30 dark:opacity-40" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 400 400\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\' opacity=\'0.8\'/></svg>')]" />
      </div>

      <div
        ref={cardRef}
        className="relative w-[92%] max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/60 p-8 shadow-[0_20px_60px_-20px_rgba(79,70,229,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
      >
        {/* gradient border glow */}
        <div className="card-glow pointer-events-none absolute -inset-[1px] -z-10 rounded-2xl bg-[conic-gradient(from_140deg,rgba(79,70,229,0.3),rgba(236,72,153,0.3),rgba(16,185,129,0.3),rgba(79,70,229,0.3))] blur" />
        {/* static ring */}
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-white/50 dark:ring-white/20" />

        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-3xl font-extrabold text-transparent">
            {typedTitle}
          </h1>
          <div className="accent-bar mx-auto mt-2 h-[3px] w-28 origin-left scale-x-0 rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500" />
          <p className={`mt-2 text-sm text-gray-600 transition-opacity duration-300 dark:text-gray-300 ${showTagline ? "opacity-100" : "opacity-0"}`}>
            {taglineText}
          </p>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="group">
            <label className="mb-1 block text-sm font-medium text-gray-800 dark:text-gray-200">Username</label>
            <div className="relative">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                onFocus={() => gsap.to(".focus-glow-user", { opacity: 1, duration: 0.2 })}
                onBlur={() => gsap.to(".focus-glow-user", { opacity: 0, duration: 0.2 })}
                className="rounded-xl border-white/30 bg-white/90 shadow-sm backdrop-blur placeholder:text-gray-400 dark:border-white/15 dark:bg-white/10 dark:shadow-none"
              />
              <div className="focus-glow-user pointer-events-none absolute inset-0 -z-10 rounded-xl opacity-0 ring-2 ring-indigo-400/40 blur-sm" />
            </div>
          </div>

          <div className="group">
            <label className="mb-1 block text-sm font-medium text-gray-800 dark:text-gray-200">Password</label>
            <div className="relative">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                onFocus={() => gsap.to(".focus-glow-pass", { opacity: 1, duration: 0.2 })}
                onBlur={() => gsap.to(".focus-glow-pass", { opacity: 0, duration: 0.2 })}
                className="rounded-xl border-white/30 bg-white/90 shadow-sm backdrop-blur placeholder:text-gray-400 dark:border-white/15 dark:bg-white/10 dark:shadow-none"
              />
              <div className="focus-glow-pass pointer-events-none absolute inset-0 -z-10 rounded-xl opacity-0 ring-2 ring-emerald-400/40 blur-sm" />
            </div>
          </div>

          {/* Use icon-less Button but override variant visuals with gradient */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="ghost"
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-emerald-500 px-4 py-2 text-white shadow-lg transition-transform duration-150 ease-in-out hover:scale-[1.02]"
            onMouseEnter={(e) => {
              const btn = e.currentTarget;
              gsap.to(btn, { y: -1, boxShadow: "0_14px_30px_-12px_rgba(79,70,229,0.48)", duration: 0.18, ease: "power1.out" });
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget;
              gsap.to(btn, { y: 0, boxShadow: "0 0 0 0 rgba(0,0,0,0)", duration: 0.2, ease: "power1.inOut" });
            }}
          >
            <span className="relative z-10">
              {loading ? (mode === "signup" ? "Creating account..." : "Signing in...") : mode === "signup" ? "Sign Up" : "Log In"}
            </span>
            <span className="pointer-events-none absolute inset-0 -z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: "radial-gradient(120px 40px at 50% 0%, rgba(255,255,255,0.25), rgba(255,255,255,0))" }} />
          </Button>

          <div className="pt-2 text-center text-sm text-gray-700 dark:text-gray-300">
            {mode === "login" ? (
              <span>
                Don&apos;t have an account? <a href="/signup" className="text-indigo-400 underline-offset-4 hover:underline">Sign up</a>
              </span>
            ) : (
              <span>
                Already have an account? <a href="/login" className="text-indigo-400 underline-offset-4 hover:underline">Log in</a>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
