"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function SiteInfoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const siteId = searchParams.get("siteId");
  const [copied, setCopied] = useState(false);

  if (!siteId) {
    return <p className="text-center mt-20">❌ No Site ID found.</p>;
  }

  const snippet = `
<!-- Analytics Tracker -->
<script>
  window.__SITE_ID__ = "${siteId}";
</script>
<script src="http://localhost:5500/tracker.js"></script>
`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 bg-white p-6 rounded-2xl shadow-lg space-y-6">
      <h1 className="text-2xl font-bold text-center">🎉 Site Setup</h1>

      <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
        <p className="font-semibold mb-2">Your Site ID:</p>
        <p className="text-green-600">{siteId}</p>
      </div>

      <div>
        <p className="font-semibold mb-2">Add this snippet in your <code>index.html</code>:</p>
        <pre className="bg-black text-white p-4 rounded-md overflow-x-auto text-sm">
{snippet}
        </pre>
        <Button onClick={copySnippet} className="mt-2">
          {copied ? "✅ Copied!" : "📋 Copy Snippet"}
        </Button>
      </div>

      <div className="text-center">
        <Button onClick={() => router.push("/dashboard")} className="bg-indigo-600">
          Go to Dashboard →
        </Button>
      </div>
    </div>
  );
}
