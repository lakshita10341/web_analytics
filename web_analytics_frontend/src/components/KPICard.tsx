"use client";

import { motion } from "framer-motion";

export default function KPICard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-white/5"
    >
      {/* glow ring */}
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-white/40" />
      {/* gradient sheen */}
      <div className="pointer-events-none absolute -inset-x-8 -top-8 h-16 bg-gradient-to-r from-indigo-500/0 via-fuchsia-500/10 to-emerald-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="text-xs font-medium tracking-wide text-gray-500 dark:text-gray-300">{title}</div>
      <div className="mt-2 bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-emerald-500 bg-clip-text text-3xl font-extrabold text-transparent">
        {value}
      </div>
      {subtitle && <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{subtitle}</div>}
    </motion.div>
  );
}
