"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RadarDataPoint {
  kategori: string;
  required: number;
  actual: number;
}

export default function RadarKompetensi({ data }: { data: RadarDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius={85}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="kategori"
          tick={{ fontSize: 12, fill: "#475569" }}
        />
        <PolarRadiusAxis
          domain={[0, 4]}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
        />
        <Radar
          name="Required"
          dataKey="required"
          stroke="#93c5fd"
          fill="#93c5fd"
          fillOpacity={0.25}
        />
        <Radar
          name="Actual"
          dataKey="actual"
          stroke="#1d4ed8"
          fill="#1d4ed8"
          fillOpacity={0.35}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value) => (
            <span className="text-slate-600">{value}</span>
          )}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
