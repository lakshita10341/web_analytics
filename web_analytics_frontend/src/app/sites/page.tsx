"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Site {
  id: number;
  domain: string;
  site_id: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [domain, setDomain] = useState("");
  const [newSite, setNewSite] = useState<Site | null>(null);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const router = useRouter();

  useEffect(() => {
    async function fetchSites() {
      if (!token) return;
      const res = await axios.get("http://localhost:8000/api/sites/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSites(res.data);
    }
    fetchSites();
  }, []);

  async function handleAddSite() {
    if (!domain.trim()) return;
    try {
      const res = await axios.post(
        "http://localhost:8000/api/create-site/",
        { domain },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSites((prev) => [...prev, res.data]);
      setNewSite(res.data); // highlight the newly added site
      setDomain("");
    } catch (err) {
      console.error("Error creating site", err);
    }
  }

  function copySnippet(siteId: string) {
    const snippet = `<script>
  window.__SITE_ID__ = "${siteId}";
</script>
<script src="http://localhost:3000/tracker.js"></script>`;
    navigator.clipboard.writeText(snippet);
    alert("Snippet copied!");
  }

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Your Sites</h1>

      {/* Add Site Form */}
      <div className="flex gap-2 mb-8">
        <Input
          placeholder="Enter site domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
        <Button onClick={handleAddSite}>Add Site</Button>
      </div>

      {/* Sites List */}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sites.map((site) => (
          <motion.li
            key={site.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="p-4 bg-white rounded-xl shadow hover:shadow-lg cursor-pointer"
            onClick={() => router.push(`/dashboard/${site.site_id}`)}
          >
            <p className="font-semibold">{site.domain}</p>
            <p className="text-sm text-gray-600">
              Site ID: <span className="font-mono">{site.site_id}</span>
            </p>

            {/* Show snippet card if it's the new site */}
            {newSite?.site_id === site.site_id && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 bg-gray-50 border rounded-lg text-sm"
                >
                  <p className="mb-2 font-semibold">Embed Snippet:</p>
                  <pre className="bg-black text-green-400 p-2 rounded text-xs overflow-x-auto">{`<script>
  window.__SITE_ID__ = "${site.site_id}";
</script>
<script src="http://localhost:3000/tracker.js"></script>`}</pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation(); // avoid triggering dashboard navigation
                      copySnippet(site.site_id);
                    }}
                  >
                    Copy Snippet
                  </Button>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.li>
        ))}
      </ul>

      {/* Empty State */}
      {sites.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-500 mt-12"
        >
          No sites yet. Add one above!
        </motion.div>
      )}
    </div>
  );
}
