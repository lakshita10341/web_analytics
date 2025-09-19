import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Line, LineChart, AreaChart, Area } from "recharts";

type Props = {
  data: any[];
  xKey: string;
  yKey: string;
  type: "bar" | "line" | "area";
  height?: number;
};

export default function BarOrLine({ data, xKey, yKey, type, height = 320 }: Props) {
  if (!data || data.length === 0) return <div className="p-6 text-center text-gray-400">No data</div>;

  let chartElement: React.ReactElement | null = null;
  if (type === "bar") {
    chartElement = (
      <BarChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={yKey} />
      </BarChart>
    );
  } else if (type === "line") {
    chartElement = (
      <LineChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={yKey} stroke="#4F46E5" />
      </LineChart>
    );
  } else if (type === "area") {
    chartElement = (
      <AreaChart data={data}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey={yKey} fill="#C7B2FF" stroke="#7C3AED" />
      </AreaChart>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        {chartElement}
      </ResponsiveContainer>
    </div>
  );
}
