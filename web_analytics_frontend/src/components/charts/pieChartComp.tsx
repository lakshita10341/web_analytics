import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#8B5CF6"];

type PieDatum = { name: string; value: number };

export default function PieChartComp({ data, nameKey = "name", valueKey = "value" }: { data: PieDatum[]; nameKey?: string; valueKey?: string }) {
  if (!data || data.length === 0) return <div className="p-6 text-center text-gray-400">No data</div>;
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey={valueKey} nameKey={nameKey} outerRadius={100} fill="#8884d8">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
