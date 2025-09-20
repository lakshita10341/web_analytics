"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import BarOrLine from "./charts/BarOrLine";
import PieChartComp from "./charts/pieChartComp";

type DataValue = string | number | undefined;
export type DataPoint = Record<string, DataValue> & { date?: string; name?: string; value?: number; count?: number; views?: number };

type Props = {
  title: string;
  fetcher?: () => Promise<DataPoint[]>; 
  data?: DataPoint[];
  chartKind?: "time-series" | "categorical" | "pie";
  xKey?: string;
  yKey?: string; // single series for backward compatibility
  yKeys?: string[]; // multiple series
  subtitle?: string;
  colors?: string[];
};

export default function ChartContainer({ title, data = [], chartKind = "time-series", xKey = "date", yKey = "views", yKeys, subtitle, colors }: Props) {
  const [type, setType] = useState<"bar" | "line" | "area" | "pie">("bar");

  // choose default types by kind
  const typeOptions = chartKind === "pie" ? ["pie"] : ["bar", "line", "area"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="bg-white/70 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 shadow-xl backdrop-blur-md p-4 relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-white/40" />
      <div className="pointer-events-none absolute -inset-x-12 -top-10 h-16 bg-gradient-to-r from-indigo-500/0 via-fuchsia-500/10 to-emerald-500/0" />

      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent">
            {title}
          </h3>
          {subtitle ? <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">{subtitle}</div> : null}
        </div>
        <div>
          <select className="border rounded px-2 py-1 dark:bg-transparent dark:border-white/20" value={type} onChange={(e) => setType(e.target.value as "bar" | "line" | "area" | "pie")}>
            {typeOptions.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {type === "pie" || chartKind === "pie" ? (
        <PieChartComp data={data.map(d => ({ name: (d as any).name || (d as any).source || (d as any).country || (d as any).url, value: (d as any).count || (d as any).views || (d as any).value }))} />
      ) : (
        <BarOrLine data={data.map(d => ({ ...d, date: ((d as any).date || (d as any).day || (d as any).label) }))} xKey={xKey} yKey={yKey} yKeys={yKeys} type={type === "pie" ? "bar" : type} colors={colors} />
      )}
    </motion.div>
  );
}
