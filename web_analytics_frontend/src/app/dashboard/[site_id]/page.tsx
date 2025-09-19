"use client";

import { notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import KPICard from "@/components/KPICard";
import ChartContainer from "@/components/chartcontainer";
import { fetchJSON } from "@/lib/api";
import { useParams } from "next/navigation";

interface DashboardPageProps {
  params: { site_id: string };
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { site_id } = params;

  if (!site_id) {
    notFound();
  }

  const [pageViewsData, setPageViewsData] = useState<any>({});
  const [sessionsData, setSessionsData] = useState<any>({});
  const [sourcesData, setSourcesData] = useState<any[]>([]);
  const [devicesData, setDevicesData] = useState<any[]>([]);
  const [browsersData, setBrowsersData] = useState<any[]>([]);
  const [geoData, setGeoData] = useState<any[]>([]);
  const [newVsReturning, setNewVsReturning] = useState<{new: number, returning: number, daily: Array<{date: string, new_sessions: number, returning_sessions: number}>}>({new: 0, returning: 0, daily: []});

  useEffect(() => {
    const load = async () => {
      try {
        const pv = await fetchJSON(`/analytics/pages/${site_id}/`);
        setPageViewsData(pv);
      } catch (e) {
        // fallback dummy
        setPageViewsData({
          trend: Array.from({ length: 14 }).map((_, i) => ({ date: `2025-09-${i + 1}`, views: Math.round(Math.random() * 300 + 50) })),
          top_pages: [
            { url: "/", views: 1200 },
            { url: "/pricing", views: 500 },
            { url: "/blog/how-we-built", views: 320 },
          ],
        });
      }

      try {
        const ses = await fetchJSON(`/analytics/sessions/${site_id}/`);
        setSessionsData(ses);
      } catch (e) {
        setSessionsData({
          session_count: 432,
          avg_duration_seconds: 180,
          trend: Array.from({ length: 14 }).map((_, i) => ({ date: `2025-09-${i + 1}`, sessions: Math.round(Math.random() * 40 + 10) })),
        });
      }

      try {
        const src = await fetchJSON(`/analytics/sources/${site_id}/`);
        setSourcesData(src);
      } catch (e) {
        setSourcesData([
          { source: "direct", count: 1200 },
          { source: "google", count: 400 },
          { source: "twitter.com", count: 220 },
        ]);
      }

      try {
        const dev = await fetchJSON(`/analytics/devices/${site_id}/`);
        setDevicesData(dev);
      } catch (e) {
        setDevicesData([
          { device: "mobile", count: 1200 },
          { device: "desktop", count: 800 },
          { device: "tablet", count: 150 },
        ]);
      }

      try {
        const br = await fetchJSON(`/analytics/browsers/${site_id}/`);
        setBrowsersData(br);
      } catch (e) {
        setBrowsersData([
          { browser: "Chrome", count: 1500 },
          { browser: "Safari", count: 400 },
          { browser: "Firefox", count: 100 },
        ]);
      }

      try {
        const geo = await fetchJSON(`/analytics/geography/${site_id}/`);
        setGeoData(geo);
      } catch (e) {
        setGeoData([
          { country: "India", count: 800 },
          { country: "United States", count: 500 },
          { country: "United Kingdom", count: 200 },
        ]);
      }

      try {
        const nvr = await fetchJSON(`/analytics/new-vs-returning/${site_id}/`);
        setNewVsReturning(nvr);
      } catch (e) {
        console.error("Failed to load new vs returning data:", e);
        // Fallback dummy data
        setNewVsReturning({
          new: 350,
          returning: 80,
          daily: Array.from({ length: 14 }).map((_, i) => ({
            date: `2025-09-${i + 1}`,
            new_sessions: Math.round(Math.random() * 30 + 5),
            returning_sessions: Math.round(Math.random() * 20 + 3),
          }))
        });
      }
    };
    load();
  }, [site_id]);

  // Merge page views and sessions trends by date so we can show both series in one chart
  const mergedTrend = useMemo(() => {
    const byDate: Record<string, { date: string; views?: number; sessions?: number }> = {};
    (pageViewsData?.trend || []).forEach((d: any) => {
      const key = String(d.date);
      byDate[key] = { ...(byDate[key] || { date: key }), views: d.views };
    });
    (sessionsData?.trend || []).forEach((d: any) => {
      const key = String(d.date);
      byDate[key] = { ...(byDate[key] || { date: key }), sessions: d.sessions };
    });
    return Object.values(byDate).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [pageViewsData, sessionsData]);

  return (
    <div className="relative p-6 md:p-8 space-y-6">
      {/* decorative bg */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 dark:from-[#0b0b11] dark:via-[#0f1020] dark:to-[#0a1110]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.04)_1px,_transparent_0)] bg-[size:24px_24px] dark:bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.06)_1px,_transparent_0)]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-center justify-between">
        <h1 className="bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-emerald-500 bg-clip-text text-3xl font-extrabold text-transparent">Analytics Dashboard</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">Site: <span className="font-mono">{site_id}</span></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Page Views (30d)" value={pageViewsData?.trend?.reduce?.((a: any,b: { views: any; })=> a+(b.views||0),0) || "—"} subtitle="Total views in selected range" />
        <KPICard title="Sessions" value={sessionsData?.session_count ?? "—"} subtitle={`Avg session: ${Math.round(sessionsData?.avg_duration_seconds || 0)}s`} />
        <KPICard title="New Users" value={newVsReturning?.new?.toLocaleString() || "—"} subtitle={`${newVsReturning?.returning?.toLocaleString() || 0} returning`} />
        <KPICard title="Top Country" value={geoData?.[0]?.country || "—"} subtitle={`${geoData?.[0]?.count || 0} visitors`} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Page Views Trend" data={pageViewsData?.trend || []} chartKind="time-series" xKey="date" yKey="views" />
        <ChartContainer title="Sessions (trend)" data={sessionsData?.trend || []} chartKind="time-series" xKey="date" yKey="sessions" />
        <ChartContainer title="Top Pages" data={(pageViewsData?.top_pages || []).map((p:any)=>({ name: p.url, value: p.views }))} chartKind="categorical" xKey="name" yKey="value" />
        <ChartContainer 
          title="New vs Returning (daily)" 
          data={newVsReturning?.daily || []} 
          chartKind="time-series" 
          xKey="date" 
          yKeys={["new_sessions", "returning_sessions"]}
          subtitle={`${newVsReturning?.new?.toLocaleString() || 0} new, ${newVsReturning?.returning?.toLocaleString() || 0} returning`}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35 }} className="grid grid-cols-1 gap-6">
        <ChartContainer
          title="Views vs Sessions"
          data={mergedTrend}
          chartKind="time-series"
          xKey="date"
          yKeys={["views", "sessions"]}
          subtitle="Comparison of daily page views vs session count"
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartContainer title="Traffic Sources" data={sourcesData.map((s:any)=>({ name: s.source, value: s.count }))} chartKind="pie" />
        <ChartContainer title="Devices" data={devicesData.map((d:any)=>({ name: d.device, value: d.count }))} chartKind="pie" />
        <ChartContainer title="Browsers" data={browsersData.map((b:any)=>({ name: b.browser, value: b.count }))} chartKind="pie" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35 }} className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <h3 className="font-semibold mb-3 bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent">Geography</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <ul>
              {geoData.map((c:any, i:number) => (
                <motion.li key={i} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: i * 0.02 }} className="flex justify-between border-b border-white/40 py-2 dark:border-white/10">
                  <span className="text-gray-700 dark:text-gray-300">{c.country}</span>
                  <span className="font-semibold">{c.count}</span>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            {/* Placeholder for map — integrate react-simple-maps or any map lib */}
            <div className="h-56 rounded-md bg-gradient-to-r from-indigo-50 to-white dark:from-white/10 dark:to-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Map visualization placeholder — integrate react-simple-maps
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
