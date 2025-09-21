import { JSX } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Line, LineChart, AreaChart, Area, Legend } from "recharts";

type DataValue = string | number | undefined;
type DataPoint = Record<string, DataValue>;

type Props = {
  data: DataPoint[];
  xKey: string;
  yKey?: string; // kept for backward compatibility
  yKeys?: string[]; // multiple series
  type: "bar" | "line" | "area";
  height?: number;
  colors?: string[]; // optional colors per series
};

export default function BarOrLine({ data, xKey, yKey, yKeys, type, height = 320, colors = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#6366F1"] }: Props) {
  if (!data || data.length === 0) return <div className="p-6 text-center text-gray-400">No data</div>;

  const series = (yKeys && yKeys.length > 0) ? yKeys : (yKey ? [yKey] : []);

  let chartElement: JSX.Element | null = null;
  if (type === "bar") {
    chartElement = (
      <BarChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {series.map((k, i) => (
          <Bar key={k} dataKey={k} fill={colors[i % colors.length]} />
        ))}
      </BarChart>
    );
  } else if (type === "line") {
    chartElement = (
      <LineChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {series.map((k, i) => (
          <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} dot={false} />
        ))}
      </LineChart>
    );
  } else if (type === "area") {
    chartElement = (
      <AreaChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {series.map((k, i) => (
          <Area key={k} type="monotone" dataKey={k} fill={colors[i % colors.length]} stroke={colors[i % colors.length]} />
        ))}
      </AreaChart>
    );
  }

  return chartElement ? (
    <ResponsiveContainer width="100%" height={height}>
      {chartElement}
    </ResponsiveContainer>
  ) : (
    <div className="p-6 text-center text-gray-400">No data to display</div>
  );
  
}
