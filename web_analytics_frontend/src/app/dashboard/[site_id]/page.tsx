"use client";

import { notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import KPICard from "@/components/KPICard";
import ChartContainer from "@/components/chartcontainer";
import { fetchJSON, fetchJSONWithParams } from "@/lib/api";

interface DashboardPageProps {
  params: { site_id: string };
}

interface TrendPoint { date: string; views: number }
interface SessionPoint { date: string; sessions: number }
interface PageViewsData { trend: TrendPoint[]; top_pages: { url: string; views: number }[] }
interface SessionsData { session_count: number; avg_duration_seconds: number; trend: SessionPoint[] }
interface SourceItem { source: string; count: number }
interface DeviceItem { device: string; count: number }
interface BrowserItem { browser: string; count: number }
interface GeoItem { country: string; count: number }
interface DailyNVR { date: string; new_sessions: number; returning_sessions: number }
interface NewVsReturning { new: number; returning: number; daily: DailyNVR[] }
interface KPIs {
  period: { start: string; end: string };
  compare: { start: string; end: string } | null;
  totals: { page_views: number; sessions: number; users: number; top_country: string };
  deltas: { page_views_pct: number; sessions_pct: number; users_pct: number } | null;
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { site_id } = params;

  if (!site_id) {
    notFound();
  }

  const [pageViewsData, setPageViewsData] = useState<PageViewsData>({ trend: [], top_pages: [] });
  const [sessionsData, setSessionsData] = useState<SessionsData>({ session_count: 0, avg_duration_seconds: 0, trend: [] });
  const [sourcesData, setSourcesData] = useState<SourceItem[]>([]);
  const [devicesData, setDevicesData] = useState<DeviceItem[]>([]);
  const [browsersData, setBrowsersData] = useState<BrowserItem[]>([]);
  const [geoData, setGeoData] = useState<GeoItem[]>([]);
  const [newVsReturning, setNewVsReturning] = useState<NewVsReturning>({ new: 0, returning: 0, daily: [] });
  const [kpis, setKpis] = useState<KPIs | null>(null);

  // Filters
  const [preset, setPreset] = useState<string>("last_30d");
  const [services, setServices] = useState<string>(""); // comma-separated utm_source
  const [posts, setPosts] = useState<string>(""); // comma-separated URL prefixes
  const [compare, setCompare] = useState<boolean>(true);

  useEffect(() => {
    const params = {
      preset,
      compare: String(compare),
      ...(services ? { services } : {}),
      ...(posts ? { posts } : {}),
    } as Record<string, string>;

    const load = async () => {
      try {
        const pv = await fetchJSONWithParams(`/analytics/pages/${site_id}/`, params);
        setPageViewsData(pv);
      } catch (e) {
        setPageViewsData({ trend: [], top_pages: [] });
      }

      try {
        const ses = await fetchJSONWithParams(`/analytics/sessions/${site_id}/`, params);
        setSessionsData(ses);
      } catch (e) {
        setSessionsData({ session_count: 0, avg_duration_seconds: 0, trend: [] });
      }

      try {
        const src = await fetchJSONWithParams(`/analytics/sources/${site_id}/`, params);
        setSourcesData(src);
      } catch (e) {
        setSourcesData([]);
      }

      try {
        const dev = await fetchJSONWithParams(`/analytics/devices/${site_id}/`, params);
        setDevicesData(dev);
      } catch (e) {
        setDevicesData([]);
      }

      try {
        const br = await fetchJSONWithParams(`/analytics/browsers/${site_id}/`, params);
        setBrowsersData(br);
      } catch (e) {
        setBrowsersData([]);
      }

      try {
        const geo = await fetchJSONWithParams(`/analytics/geography/${site_id}/`, params);
        setGeoData(geo);
      } catch (e) {
        setGeoData([]);
      }

      try {
        const nvr = await fetchJSONWithParams(`/analytics/new-vs-returning/${site_id}/`, params);
        setNewVsReturning(nvr);
      } catch (e) {
        setNewVsReturning({ new: 0, returning: 0, daily: [] });
      }

      try {
        const k = await fetchJSONWithParams(`/analytics/kpis/${site_id}/`, params);
        setKpis(k);
      } catch (e) {
        setKpis(null);
      }
    };
    load();
  }, [site_id, preset, services, posts, compare]);

  // Merge page views and sessions trends by date so we can show both series in one chart
  const mergedTrend = useMemo(() => {
    const byDate: Record<string, { date: string; views?: number; sessions?: number }> = {};
    (pageViewsData?.trend || []).forEach((d: TrendPoint) => {
      const key = String(d.date);
      byDate[key] = { ...(byDate[key] || { date: key }), views: d.views };
    });
    (sessionsData?.trend || []).forEach((d: SessionPoint) => {
      const key = String(d.date);
      byDate[key] = { ...(byDate[key] || { date: key }), sessions: d.sessions };
    });
    return Object.values(byDate).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [pageViewsData, sessionsData]);

  // Sort geography data by count desc for nicer display
  const sortedGeo = useMemo(() => {
    return [...geoData].sort((a, b) => b.count - a.count);
  }, [geoData]);

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

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Date range</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white/80 p-2 text-sm dark:border-white/10 dark:bg-white/5">
            <option value="last_7d">Last 7 days</option>
            <option value="last_14d">Last 14 days</option>
            <option value="last_30d">Last 30 days</option>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Services (utm_source)</label>
          <input value={services} onChange={(e) => setServices(e.target.value)} placeholder="e.g. google,twitter" className="w-full rounded-md border border-gray-300 bg-white/80 p-2 text-sm dark:border-white/10 dark:bg-white/5" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Posts (URL prefixes)</label>
          <input value={posts} onChange={(e) => setPosts(e.target.value)} placeholder="e.g. /blog,/guides" className="w-full rounded-md border border-gray-300 bg-white/80 p-2 text-sm dark:border-white/10 dark:bg-white/5" />
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Compare vs previous
          </label>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Page Views" value={(kpis?.totals.page_views ?? pageViewsData?.trend?.reduce?.((a: number, b: { views: number }) => a + (b.views || 0), 0)) || "—"} subtitle={kpis?.deltas ? `${kpis.deltas.page_views_pct >= 0 ? "↑" : "↓"} ${Math.abs(kpis.deltas.page_views_pct).toFixed(0)}% vs prev` : "Total views in selected range"} />
        <KPICard title="Sessions" value={kpis?.totals.sessions ?? sessionsData?.session_count ?? "—"} subtitle={kpis?.deltas ? `${kpis.deltas.sessions_pct >= 0 ? "↑" : "↓"} ${Math.abs(kpis.deltas.sessions_pct).toFixed(0)}% vs prev` : `Avg session: ${Math.round(sessionsData?.avg_duration_seconds || 0)}s`} />
        <KPICard title="Users" value={(kpis?.totals.users ?? newVsReturning?.new?.toLocaleString()) || "—"} subtitle={kpis?.deltas ? `${kpis.deltas.users_pct >= 0 ? "↑" : "↓"} ${Math.abs(kpis.deltas.users_pct).toFixed(0)}% vs prev` : `${newVsReturning?.returning?.toLocaleString() || 0} returning`} />
        <KPICard title="Top Country" value={kpis?.totals.top_country || geoData?.[0]?.country || "—"} subtitle={`${geoData?.[0]?.count || 0} visitors`} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Page Views Trend" data={pageViewsData?.trend || []} chartKind="time-series" xKey="date" yKey="views" />
        <ChartContainer title="Sessions (trend)" data={sessionsData?.trend || []} chartKind="time-series" xKey="date" yKey="sessions" />
        <ChartContainer title="Top Pages" data={(pageViewsData?.top_pages || []).map((p: { url: string; views: number }) => ({ name: p.url, value: p.views }))} chartKind="categorical" xKey="name" yKey="value" />
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
        <ChartContainer title="Traffic Sources" data={sourcesData.map((s: SourceItem) => ({ name: s.source, value: s.count }))} chartKind="pie" />
        <ChartContainer title="Devices" data={devicesData.map((d: DeviceItem) => ({ name: d.device, value: d.count }))} chartKind="pie" />
        <ChartContainer title="Browsers" data={browsersData.map((b: BrowserItem) => ({ name: b.browser, value: b.count }))} chartKind="pie" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.35 }} className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <h3 className="font-semibold mb-3 bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent">Geography</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <ul>
              {sortedGeo.map((c: GeoItem, i: number) => (
                <motion.li key={i} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25, delay: i * 0.02 }} className="flex justify-between border-b border-white/40 py-2 dark:border-white/10">
                  <span className="text-gray-700 dark:text-gray-300">{c.country}</span>
                  <span className="font-semibold">{c.count}</span>
                </motion.li>
              ))}
              {sortedGeo.length === 0 && (
                <li className="text-sm text-gray-500 dark:text-gray-400 py-2">No geography data yet.</li>
              )}
            </ul>
          </div>
          <div className="md:col-span-2">
            {sortedGeo.length > 0 ? (
              <ChartContainer
                title="Top Countries"
                data={sortedGeo.map((g: GeoItem) => ({ name: g.country, value: g.count }))}
                chartKind="categorical"
                xKey="name"
                yKey="value"
              />
            ) : (
              <div className="h-56 rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur flex items-center justify-between gap-4 p-4">
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <div className="font-semibold">No geography data yet</div>
                  <div>Install the tracker on your site and start receiving country data.</div>
                </div>
                <pre className="hidden md:block max-w-[60%] overflow-auto rounded-lg bg-black p-3 text-xs text-green-400">{`<script>
  window.__SITE_ID__ = "${site_id}";
</script>
<script src="https://lakshitajain.pythonanywhere.com/api/tracker/"></script>`}</pre>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
