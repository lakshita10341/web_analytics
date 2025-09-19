import { useState } from "react";
import BarOrLine from "./charts/BarOrLine";
import PieChartComp from "./charts/pieChartComp";

type Props = {
  title: string;
  fetcher?: any; 
  data?: any[];
  chartKind?: "time-series" | "categorical" | "pie";
  xKey?: string;
  yKey?: string;
};

export default function ChartContainer({ title, data = [], chartKind = "time-series", xKey = "date", yKey = "views" }: Props) {
  const [type, setType] = useState<"bar" | "line" | "area" | "pie">("bar");

  // choose default types by kind
  const typeOptions = chartKind === "pie" ? ["pie"] : ["bar", "line", "area"];

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        <div>
          <select className="border rounded px-2 py-1" value={type} onChange={(e) => setType(e.target.value as any)}>
            {typeOptions.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {type === "pie" || chartKind === "pie" ? (
        <PieChartComp data={data.map(d => ({ name: d.name || d.source || d.country || d.url, value: d.count || d.views || d.value }))} />
      ) : (
        <BarOrLine data={data.map(d => ({ ...d, date: (d.date || d.day || d.label) }))} xKey={xKey} yKey={yKey} type={type as any} />
      )}
    </div>
  );
}
