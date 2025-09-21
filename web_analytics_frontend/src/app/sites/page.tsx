"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createSite, fetchJSON } from "@/lib/api";

interface Site {
  id: number;
  domain: string;
  site_id: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [domain, setDomain] = useState("");
  const [newSite, setNewSite] = useState<Site | null>(null);
  const [showSnippet, setShowSnippet] = useState(false);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const router = useRouter();

  useEffect(() => {
    async function fetchSites() {
      const data = await fetchJSON("/sites/");
      setSites(data);
    }
    fetchSites();
  }, []);

  async function handleAddSite() {
    if (!domain.trim()) return;
    try {
      const created = await createSite(domain);
      setSites((prev) => [...prev, created]);
      setNewSite(created); // store the newly added site
      setShowSnippet(true); // show floating snippet card
      setDomain("");
    } catch (err) {
      console.error("Error creating site", err);
    }
  }

  async function copySnippet(siteId: string) {
    const snippet = `<script>
  window.__SITE_ID__ = "${siteId}";
</script>
<script src="http://localhost:8000/static/tracker/tracker.js
"></script>`;
    try {
      await navigator.clipboard.writeText(snippet);
      // briefly show "Copied" state then dismiss
      setTimeout(() => setShowSnippet(false), 900);
    } catch (e) {
      console.error("Copy failed", e);
    }
  }

  return (
    <div className="relative">
      {/* subtle decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-[#0b0b11] dark:via-[#0f1020] dark:to-[#0a1110]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.04)_1px,_transparent_0)] bg-[size:24px_24px] dark:bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.06)_1px,_transparent_0)]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 text-center text-3xl font-extrabold tracking-tight"
        >
          <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent">
            Your Sites
          </span>
        </motion.h1>

        {/* Add Site Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-8 rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-white/5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Enter site domain (e.g., example.com)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="rounded-lg"
            />
            <Button onClick={handleAddSite} className="shrink-0 rounded-lg">
              Add Site
            </Button>
          </div>
        </motion.div>

        {/* Sites List */}
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {sites.map((site, idx) => (
            <motion.li
              key={site.site_id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: idx * 0.2, ease: "easeInOut" }}
              whileHover={{ scale: 1.02 }}
              className="relative cursor-pointer overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-md transition-[transform,box-shadow] duration-200 ease-in-out hover:shadow-2xl dark:border-white/10 dark:bg-white/5"
              onClick={() => router.push(`/dashboard/${site.site_id}`)}
            >
              {/* sheen */}
              <div className="pointer-events-none absolute -inset-x-10 -top-10 h-12 bg-gradient-to-r from-indigo-500/0 via-fuchsia-500/10 to-emerald-500/0" />

              <p className="font-semibold">{site.domain}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Site ID: <span className="font-mono">{site.site_id}</span>
              </p>
            </motion.li>
          ))}
        </ul>

        {/* Empty State */}
        {sites.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center text-gray-500"
          >
            No sites yet. Add one above!
          </motion.div>
        )}
      </div>

      {/* Floating Snippet Card */}
      <AnimatePresence>
        {showSnippet && newSite && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed bottom-6 right-6 z-50 w-[min(92vw,560px)] overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">Embed Snippet</p>
              <button
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                onClick={() => setShowSnippet(false)}
              >
                Close
              </button>
            </div>
            <pre className="max-h-48 overflow-auto rounded-lg bg-black p-3 text-xs text-green-400">{`<script>
  window.__SITE_ID__ = "${newSite.site_id}";
</script>
<script src="http://localhost:3000/tracker.js"></script>`}</pre>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSnippet(false)} className="rounded-lg">Dismiss</Button>
              <Button size="sm" onClick={() => copySnippet(newSite.site_id)} className="rounded-lg">Copy code</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
